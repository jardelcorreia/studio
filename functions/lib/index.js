"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notifyRoundStart = exports.onMatchScoreUpdate = exports.onRevealScores = exports.syncBrasileiraoData = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
if (admin.apps.length === 0) {
    admin.initializeApp();
}
/**
 * URL base do App.
 */
const APP_URL = "https://alphabetleague.netlify.app";
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';
/**
 * Verifica se estamos no horário de silêncio (22h às 08h BRT).
 */
function isQuietHours() {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false,
    });
    const hour = parseInt(formatter.format(now));
    return hour >= 22 || hour < 8;
}
/**
 * Lógica de Janela de Validade
 */
function getValidMatchesCount(matches) {
    if (!matches || matches.length === 0)
        return 0;
    const matchesToProcess = matches.slice(0, 10);
    const dateCounts = {};
    matchesToProcess.forEach(m => {
        if (m.utcDate) {
            const date = m.utcDate.split('T')[0];
            dateCounts[date] = (dateCounts[date] || 0) + 1;
        }
    });
    let mainDateStr = "";
    let maxCount = -1;
    for (const date in dateCounts) {
        if (dateCounts[date] > maxCount) {
            maxCount = dateCounts[date];
            mainDateStr = date;
        }
    }
    if (!mainDateStr)
        return matchesToProcess.filter(m => m.status !== 'cancelled').length;
    const mainDate = new Date(`${mainDateStr}T12:00:00Z`).getTime();
    const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;
    return matchesToProcess.filter(m => {
        if (m.status === 'cancelled')
            return false;
        if (!m.utcDate)
            return true;
        const matchTime = new Date(m.utcDate).getTime();
        const diff = Math.abs(matchTime - mainDate);
        return diff <= (threeDaysInMs + 12 * 60 * 60 * 1000);
    }).length;
}
/**
 * Sincroniza dados da API oficial com o Firestore a cada 15 minutos.
 */
exports.syncBrasileiraoData = (0, scheduler_1.onSchedule)("every 15 minutes", async (event) => {
    if (!API_KEY) {
        console.error("syncBrasileiraoData: FOOTBALL_DATA_API_KEY não configurada.");
        return;
    }
    try {
        const competitionResponse = await fetch(`${BASE_URL}/competitions/BSA`, {
            headers: { 'X-Auth-Token': API_KEY }
        });
        const competitionData = await competitionResponse.json();
        const currentMatchday = competitionData.currentSeason?.currentMatchday;
        if (!currentMatchday)
            return;
        const matchesResponse = await fetch(`${BASE_URL}/competitions/BSA/matches?matchday=${currentMatchday}`, {
            headers: { 'X-Auth-Token': API_KEY }
        });
        const matchesData = await matchesResponse.json();
        const apiMatches = matchesData.matches.map((m) => {
            let status = 'upcoming';
            if (['IN_PLAY', 'PAUSED', 'LIVE'].includes(m.status))
                status = 'live';
            else if (['FINISHED', 'AWARDED'].includes(m.status))
                status = 'finished';
            else if (['POSTPONED', 'CANCELLED'].includes(m.status))
                status = 'cancelled';
            return {
                id: m.id,
                homeTeam: m.homeTeam.name,
                awayTeam: m.awayTeam.name,
                homeScore: m.score.fullTime.home,
                awayScore: m.score.fullTime.away,
                utcDate: m.utcDate,
                status: status,
                matchday: m.matchday,
            };
        });
        const roundId = `round_${currentMatchday}`;
        const roundRef = admin.firestore().collection("rounds").doc(roundId);
        const roundDoc = await roundRef.get();
        const existingData = roundDoc.exists ? roundDoc.data() : null;
        let finalMatches = apiMatches;
        if (existingData && existingData.matches) {
            finalMatches = apiMatches.map((apiMatch) => {
                const manualMatch = existingData.matches.find((mm) => mm.id === apiMatch.id);
                if (manualMatch && manualMatch.isManual) {
                    if (apiMatch.status === 'finished')
                        return apiMatch;
                    return manualMatch;
                }
                return apiMatch;
            });
        }
        await roundRef.set({
            id: roundId,
            roundNumber: currentMatchday,
            name: `Rodada ${currentMatchday}`,
            matches: finalMatches,
            isScoresHidden: existingData ? existingData.isScoresHidden : true,
            dateUpdated: admin.firestore.FieldValue.serverTimestamp(),
            dateCreated: existingData ? existingData.dateCreated : admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        console.log(`syncBrasileiraoData: Rodada ${currentMatchday} sincronizada com sucesso.`);
    }
    catch (error) {
        console.error("syncBrasileiraoData: Erro na sincronização:", error);
    }
});
/**
 * Notifica os usuários quando os palpites são revelados.
 */
exports.onRevealScores = (0, firestore_1.onDocumentUpdated)("rounds/{roundId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    if (before.isScoresHidden === true && after.isScoresHidden === false) {
        if (isQuietHours())
            return;
        const usersSnapshot = await admin.firestore().collection("users").get();
        const tokens = [];
        usersSnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
                tokens.push(...data.fcmTokens);
            }
        });
        if (tokens.length === 0)
            return;
        const message = {
            notification: {
                title: "👀 Palpites Revelados!",
                body: `A rodada começou! Veja agora o que seus amigos jogaram na ${after.name}.`,
            },
            tokens: tokens,
            webpush: {
                fcmOptions: { link: `${APP_URL}/?tab=palpites` },
            },
            data: { link: `${APP_URL}/?tab=palpites` }
        };
        try {
            await admin.messaging().sendEachForMulticast(message);
        }
        catch (error) {
            console.error("onRevealScores: Erro:", error);
        }
    }
});
/**
 * Notifica um usuário específico se ele acertou um placar em cheio.
 */
exports.onMatchScoreUpdate = (0, firestore_1.onDocumentUpdated)("rounds/{roundId}", async (event) => {
    const after = event.data?.after.data();
    const before = event.data?.before.data();
    if (!after || !after.matches)
        return;
    const roundId = event.params.roundId;
    const matches = after.matches;
    const oldMatches = before?.matches || [];
    const betsSnapshot = await admin.firestore().collection(`rounds/${roundId}/bets`).get();
    for (const betDoc of betsSnapshot.docs) {
        const bet = betDoc.data();
        const userId = bet.userId;
        const match = matches.find((m) => m.id === bet.matchId);
        const oldMatch = oldMatches.find((m) => m.id === bet.matchId);
        if (match && match.status === 'finished' && oldMatch?.status !== 'finished') {
            const isExact = bet.homeScorePrediction === match.homeScore &&
                bet.awayScorePrediction === match.awayScore;
            if (isExact) {
                const userDoc = await admin.firestore().collection("users").doc(userId).get();
                const userData = userDoc.data();
                if (userData && userData.fcmTokens && userData.fcmTokens.length > 0) {
                    const message = {
                        notification: {
                            title: "🎯 NA MOSCA!",
                            body: `Você cravou o placar de um jogo na ${after.name}! +3 pontos garantidos.`,
                        },
                        tokens: userData.fcmTokens,
                        webpush: { fcmOptions: { link: `${APP_URL}/?tab=jogos` } },
                        data: { link: `${APP_URL}/?tab=jogos` }
                    };
                    try {
                        await admin.messaging().sendEachForMulticast(message);
                    }
                    catch (error) {
                        console.error(`onMatchScoreUpdate: Erro para ${userId}:`, error);
                    }
                }
            }
        }
    }
});
/**
 * Lembrete de Palpites Pendentes.
 */
exports.notifyRoundStart = (0, scheduler_1.onSchedule)("every 30 minutes", async (event) => {
    if (isQuietHours())
        return;
    const roundsSnapshot = await admin.firestore()
        .collection("rounds")
        .orderBy("roundNumber", "desc")
        .limit(1)
        .get();
    if (roundsSnapshot.empty)
        return;
    const currentRound = roundsSnapshot.docs[0];
    const roundData = currentRound.data();
    const roundId = currentRound.id;
    if (roundData.isScoresHidden === false)
        return;
    const matches = roundData.matches || [];
    const targetCount = getValidMatchesCount(matches);
    if (targetCount === 0)
        return;
    const firstMatchTime = matches
        .filter((m) => m.status !== 'cancelled' && m.utcDate)
        .reduce((earliest, m) => {
        const d = new Date(m.utcDate).getTime();
        return (d > 0 && d < earliest) ? d : earliest;
    }, Infinity);
    if (!Number.isFinite(firstMatchTime))
        return;
    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (now < (firstMatchTime - twentyFourHours) || now >= firstMatchTime)
        return;
    const usersSnapshot = await admin.firestore().collection("users").get();
    for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;
        if (!userData.fcmTokens || userData.fcmTokens.length === 0)
            continue;
        const userBetsSnapshot = await admin.firestore()
            .collection(`rounds/${roundId}/bets`)
            .where("userId", "==", userId)
            .get();
        if (userBetsSnapshot.size < targetCount) {
            const remaining = targetCount - userBetsSnapshot.size;
            const message = {
                notification: {
                    title: "⚠️ PALPITES PENDENTES!",
                    body: `Ei ${userData.username || 'campeão'}, faltam ${remaining} palpite${remaining > 1 ? 's' : ''} para a ${roundData.name}. O primeiro jogo já vai começar!`,
                },
                tokens: userData.fcmTokens,
                webpush: { fcmOptions: { link: `${APP_URL}/?tab=jogos` } },
                data: { link: `${APP_URL}/?tab=jogos` }
            };
            try {
                await admin.messaging().sendEachForMulticast(message);
            }
            catch (error) {
                console.error(`notifyRoundStart: Erro para ${userId}:`, error);
            }
        }
    }
});
