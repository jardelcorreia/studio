
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * Notifica os usuários quando os palpites são revelados.
 * Ocorre quando isScoresHidden muda de true para false no documento da rodada.
 */
export const onRevealScores = onDocumentUpdated("rounds/{roundId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  // Verifica se isScoresHidden mudou de true para false
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
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`${response.successCount} notificações enviadas para revelação de placar.`);
    } catch (error) {
      console.error("Erro ao enviar notificações de revelação:", error);
    }
  }
});

/**
 * Notifica um usuário específico se ele acertou um placar em cheio (3 pontos).
 * Disparado quando o Admin atualiza o status de uma partida para 'finished'.
 */
export const onMatchScoreUpdate = onDocumentUpdated("rounds/{roundId}", async (event) => {
  const after = event.data?.after.data();
  if (!after || !after.matches) return;

  const roundId = event.params.roundId;
  const matches = after.matches;

  // Busca todos os palpites desta rodada para verificar acertos
  const betsSnapshot = await admin.firestore().collection(`rounds/${roundId}/bets`).get();

  for (const betDoc of betsSnapshot.docs) {
    const bet = betDoc.data();
    const userId = bet.userId;
    
    // Procura a partida correspondente no array de partidas da rodada
    const match = matches.find((m: any) => m.id === bet.matchId);
    
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
          } catch (error) {
            console.error(`Erro ao notificar acerto exato para ${userId}:`, error);
          }
        }
      }
    }
  }
});

/**
 * Função Agendada (Cron Job): Lembrete de Palpites Pendentes.
 * Executa a cada hora para verificar se alguém esqueceu de "quilar" (palpitar).
 */
export const notifyRoundStart = onSchedule("every 60 minutes", async (event) => {
  // 1. Descobrir qual a rodada atual (baseado no que o Admin configurou por último)
  const roundsSnapshot = await admin.firestore()
    .collection("rounds")
    .orderBy("roundNumber", "desc")
    .limit(1)
    .get();

  if (roundsSnapshot.empty) return;
  
  const currentRound = roundsSnapshot.docs[0];
  const roundData = currentRound.data();
  const roundId = currentRound.id;

  // Se a rodada já teve os palpites revelados, não precisa de lembrete
  if (roundData.isScoresHidden === false) return;

  // 2. Buscar todos os usuários
  const usersSnapshot = await admin.firestore().collection("users").get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;
    
    if (!userData.fcmTokens || userData.fcmTokens.length === 0) continue;

    // 3. Verificar se o usuário já fez os 10 palpites
    const userBetsSnapshot = await admin.firestore()
      .collection(`rounds/${roundId}/bets`)
      .where("userId", "==", userId)
      .get();

    // Se faltar qualquer palpite (menos de 10)
    if (userBetsSnapshot.size < 10) {
      const message = {
        notification: {
          title: "⚠️ PALPITES PENDENTES!",
          body: `Ei ${userData.username || 'campeão'}, você ainda não completou seus 10 palpites para a ${roundData.name}. Corre que o tempo está acabando!`,
        },
        tokens: userData.fcmTokens,
      };

      try {
        await admin.messaging().sendEachForMulticast(message);
        console.log(`Lembrete enviado para ${userId} (Palpites: ${userBetsSnapshot.size}/10)`);
      } catch (error) {
        console.error(`Erro ao enviar lembrete para ${userId}:`, error);
      }
    }
  }
});
