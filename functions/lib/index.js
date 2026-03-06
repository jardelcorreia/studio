"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onMatchScoreUpdate = exports.onRevealScores = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
/**
 * Notifica os usuários quando os palpites são revelados.
 * Ocorre quando isScoresHidden muda de true para false no documento da rodada.
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
 * Notifica um usuário específico se ele acertou um placar em cheio (3 pontos).
 * Disparado quando o Admin atualiza o status de uma partida para 'finished'.
 */
exports.onMatchScoreUpdate = (0, firestore_1.onDocumentUpdated)("rounds/{roundId}", async (event) => {
    const after = event.data?.after.data();
    if (!after || !after.matches)
        return;
    const roundId = event.params.roundId;
    const matches = after.matches;
    // Busca todos os palpites desta rodada para verificar acertos
    const betsSnapshot = await admin.firestore().collection(`rounds/${roundId}/bets`).get();
    for (const betDoc of betsSnapshot.docs) {
        const bet = betDoc.data();
        const userId = bet.userId;
        // Procura a partida correspondente no array de partidas da rodada
        const match = matches.find((m) => m.id === bet.matchId);
        // Se a partida foi finalizada agora e o palpite foi um acerto exato
        if (match && match.status === 'finished') {
            const isExact = bet.homeScorePrediction === match.homeScore &&
                bet.awayScorePrediction === match.awayScore;
            if (isExact) {
                // Busca o documento do usuário para obter seus tokens FCM
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
                        console.log(`Notificação de acerto exato enviada para o usuário ${userId}.`);
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