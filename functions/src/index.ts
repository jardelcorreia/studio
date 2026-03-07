
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// URL base do App (substituir pela URL real de produção se necessário)
const APP_URL = "https://alphabet-league.web.app";

/**
 * Notifica os usuários quando os palpites são revelados.
 */
export const onRevealScores = onDocumentUpdated("rounds/{roundId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  if (before.isScoresHidden === true && after.isScoresHidden === false) {
    const usersSnapshot = await admin.firestore().collection("users").get();
    const tokens: string[] = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fcmTokens && Array.isArray(data.fcmTokens)) {
        tokens.push(...data.fcmTokens);
      }
    });

    if (tokens.length === 0) return;

    const message = {
      notification: {
        title: "👀 Palpites Revelados!",
        body: `A rodada começou! Veja agora o que seus amigos jogaram na ${after.name}.`,
      },
      tokens: tokens,
      webpush: {
        fcmOptions: {
          link: `${APP_URL}/?tab=palpites`,
        },
      },
      data: {
        link: `${APP_URL}/?tab=palpites`,
      }
    };

    try {
      await admin.messaging().sendEachForMulticast(message);
    } catch (error) {
      console.error("Erro ao enviar notificações de revelação:", error);
    }
  }
});

/**
 * Notifica um usuário específico se ele acertou um placar em cheio.
 */
export const onMatchScoreUpdate = onDocumentUpdated("rounds/{roundId}", async (event) => {
  const after = event.data?.after.data();
  if (!after || !after.matches) return;

  const roundId = event.params.roundId;
  const matches = after.matches;

  const betsSnapshot = await admin.firestore().collection(`rounds/${roundId}/bets`).get();

  for (const betDoc of betsSnapshot.docs) {
    const bet = betDoc.data();
    const userId = bet.userId;
    const match = matches.find((m: any) => m.id === bet.matchId);
    
    if (match && match.status === 'finished') {
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
            webpush: {
              fcmOptions: {
                link: `${APP_URL}/?tab=jogos`,
              },
            },
            data: {
              link: `${APP_URL}/?tab=jogos`,
            }
          };

          try {
            await admin.messaging().sendEachForMulticast(message);
          } catch (error) {
            console.error(`Erro ao notificar acerto exato para ${userId}:`, error);
          }
        }
      }
    }
  }
});

/**
 * Lembrete de Palpites Pendentes.
 */
export const notifyRoundStart = onSchedule("every 60 minutes", async (event) => {
  const roundsSnapshot = await admin.firestore()
    .collection("rounds")
    .orderBy("roundNumber", "desc")
    .limit(1)
    .get();

  if (roundsSnapshot.empty) return;
  
  const currentRound = roundsSnapshot.docs[0];
  const roundData = currentRound.data();
  const roundId = currentRound.id;

  if (roundData.isScoresHidden === false) return;

  const usersSnapshot = await admin.firestore().collection("users").get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    if (!userData.fcmTokens || userData.fcmTokens.length === 0) continue;

    const userBetsSnapshot = await admin.firestore()
      .collection(`rounds/${roundId}/bets`)
      .where("userId", "==", userId)
      .get();

    if (userBetsSnapshot.size < 10) {
      const message = {
        notification: {
          title: "⚠️ PALPITES PENDENTES!",
          body: `Ei ${userData.username || 'campeão'}, você ainda não completou seus 10 palpites para a ${roundData.name}.`,
        },
        tokens: userData.fcmTokens,
        webpush: {
          fcmOptions: {
            link: `${APP_URL}/?tab=jogos`,
          },
        },
        data: {
          link: `${APP_URL}/?tab=jogos`,
        }
      };

      try {
        await admin.messaging().sendEachForMulticast(message);
      } catch (error) {
        console.error(`Erro ao enviar lembrete para ${userId}:`, error);
      }
    }
  }
});
