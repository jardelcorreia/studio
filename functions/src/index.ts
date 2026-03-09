
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

// URL base do App (substituir pela URL real de produção se necessário)
const APP_URL = "https://alphabet-league.web.app";

/**
 * Verifica se estamos no horário de silêncio (22h às 08h BRT).
 */
function isQuietHours(): boolean {
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
 * Notifica os usuários quando os palpites são revelados.
 */
export const onRevealScores = onDocumentUpdated("rounds/{roundId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  if (before.isScoresHidden === true && after.isScoresHidden === false) {
    // Respeita o horário de silêncio
    if (isQuietHours()) {
      console.log("onRevealScores: Notificação cancelada (horário de silêncio).");
      return;
    }

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

  // Respeita o horário de silêncio
  if (isQuietHours()) {
    console.log("onMatchScoreUpdate: Notificação cancelada (horário de silêncio).");
    return;
  }

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
 * Roda a cada 60 minutos, mas só notifica nas 24h que antecedem o primeiro jogo.
 */
export const notifyRoundStart = onSchedule("every 60 minutes", async (event) => {
  // Respeita o horário de silêncio
  if (isQuietHours()) {
    console.log("notifyRoundStart: Job cancelado (horário de silêncio).");
    return;
  }

  const roundsSnapshot = await admin.firestore()
    .collection("rounds")
    .orderBy("roundNumber", "desc")
    .limit(1)
    .get();

  if (roundsSnapshot.empty) return;
  
  const currentRound = roundsSnapshot.docs[0];
  const roundData = currentRound.data();
  const roundId = currentRound.id;

  // Se a rodada já começou (palpites revelados), não precisa de lembrete
  if (roundData.isScoresHidden === false) return;

  // Lógica Inteligente de Tempo:
  // Só envia lembrete se estivermos nas 24h antes do primeiro jogo da rodada
  const matches = roundData.matches || [];
  if (matches.length > 0) {
    const firstMatchTime = matches.reduce((earliest: number, m: any) => {
      const d = new Date(m.utcDate).getTime();
      return (d > 0 && d < earliest) ? d : earliest;
    }, Infinity);

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    // Se ainda falta mais de 24h para o primeiro jogo, ou o jogo já começou, encerra silenciosamente
    if (now < (firstMatchTime - twentyFourHours) || now >= firstMatchTime) {
      return;
    }
  }

  const usersSnapshot = await admin.firestore().collection("users").get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    if (!userData.fcmTokens || userData.fcmTokens.length === 0) continue;

    const userBetsSnapshot = await admin.firestore()
      .collection(`rounds/${roundId}/bets`)
      .where("userId", "==", userId)
      .get();

    // Se faltar algum dos 10 palpites
    if (userBetsSnapshot.size < 10) {
      const message = {
        notification: {
          title: "⚠️ PALPITES PENDENTES!",
          body: `Ei ${userData.username || 'campeão'}, você ainda não completou seus 10 palpites para a ${roundData.name}. Corre que o primeiro jogo já vai começar!`,
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
