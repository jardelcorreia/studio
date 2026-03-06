"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMatchScoreUpdate = exports.onRevealScores = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * Notifica os usuários quando os palpites são revelados.
 */
exports.onRevealScores = (0, firestore_1.onDocumentUpdated)("rounds/{roundId}", async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after)
        return;
    // Verifica se isScoresHidden mudou de true para false
    if (before.isScoresHidden === true && after.isScoresHidden === false) {
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
        };
        try {
            const response = await admin.messaging().sendEachForMulticast(message);
            console.log(`${response.successCount} notificações enviadas para revelação de placar.`);
        }
        catch (error) {
            console.error("Erro ao enviar notificações de revelação:", error);
        }
    }
});
/**
 * Notifica o usuário se ele acertou um placar em cheio (3 pontos).
 */
exports.onMatchScoreUpdate = (0, firestore_1.onDocumentUpdated)("rounds/{roundId}", async (event) => {
    const after = event.data?.after.data();
    if (!after || !after.matches)
        return;
    const roundId = event.params.roundId;
    const matches = after.matches;
    // Busca todos os palpites desta rodada
    const betsSnapshot = await admin.firestore().collection(`rounds/${roundId}/bets`).get();
    for (const betDoc of betsSnapshot.docs) {
        const bet = betDoc.data();
        const userId = bet.userId;
        // Procura a partida correspondente para ver se foi finalizada e se houve acerto exato
        const match = matches.find((m) => m.id === bet.matchId);
        if (match && match.status === 'finished') {
            const isExact = bet.homeScorePrediction === match.homeScore &&
                bet.awayScorePrediction === match.awayScore;
            if (isExact) {
                // Busca o usuário para pegar os tokens FCM
                const userDoc = await admin.firestore().collection("users").doc(userId).get();
                const userData = userDoc.data();
                if (userData && userData.fcmTokens && userData.fcmTokens.length > 0) {
                    const message = {
                        notification: {
                            title: "🎯 NA MOSCA!",
                            body: `Você cravou o placar de um jogo na ${after.name}! +3 pontos garantidos.`,
                        },
                        tokens: userData.fcmTokens,
                    };
                    try {
                        await admin.messaging().sendEachForMulticast(message);
                    }
                    catch (error) {
                        console.error(`Erro ao notificar acerto exato para ${userId}:`, error);
                    }
                }
            }
        }
    }
});
//# sourceMappingURL=index.js.map