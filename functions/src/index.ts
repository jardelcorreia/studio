
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * URL base do App. 
 * Utiliza o ID do projeto do Firebase para garantir que os links funcionem no ambiente de teste e produção.
 */
const PROJECT_ID = process.env.GCLOUD_PROJECT || "studio-7344387368-26e1e";
const APP_URL = `https://${PROJECT_ID}.web.app`;

/**
 * Verifica se estamos no horário de silêncio (22h às 08h BRT).
 * Isso evita incomodar os usuários durante a madrugada com lembretes automáticos.
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
 * Lógica de Janela de Validade (Replicada do Client)
 * Identifica jogos que estão fora da janela de 3 dias da data principal da rodada.
 */
function getValidMatchesCount(matches: any[]): number {
  if (!matches || matches.length === 0) return 0;
  
  const matchesToProcess = matches.slice(0, 10);
  
  // 1. Encontrar a Data Principal (dia com mais jogos)
  const dateCounts: Record<string, number> = {};
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

  if (!mainDateStr) return matchesToProcess.filter(m => m.status !== 'cancelled').length;

  const mainDate = new Date(`${mainDateStr}T12:00:00Z`).getTime();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

  // 2. Contar jogos que não são 'cancelled' E estão na janela
  return matchesToProcess.filter(m => {
    if (m.status === 'cancelled') return false;
    if (!m.utcDate) return true; // Se não tem data mas tá na lista, assume válido por precaução

    const matchTime = new Date(m.utcDate).getTime();
    const diff = Math.abs(matchTime - mainDate);
    return diff <= (threeDaysInMs + 12 * 60 * 60 * 1000); // Janela de 3 dias + tolerância de fuso
  }).length;
}

/**
 * Notifica os usuários quando os palpites são revelados.
 */
export const onRevealScores = onDocumentUpdated("rounds/{roundId}", async (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  if (!before || !after) return;

  // Só dispara quando isScoresHidden muda de true para false
  if (before.isScoresHidden === true && after.isScoresHidden === false) {
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

    if (tokens.length === 0) {
      console.log("onRevealScores: Nenhum token FCM encontrado.");
      return;
    }

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
      console.log(`onRevealScores: Notificações enviadas para ${tokens.length} dispositivos.`);
    } catch (error) {
      console.error("onRevealScores: Erro ao enviar notificações:", error);
    }
  }
});

/**
 * Notifica um usuário específico se ele acertou um placar em cheio.
 * IGNORA o horário de silêncio para garantir feedback imediato do jogo.
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
    
    // Verifica se a partida acabou e se o palpite foi certeiro
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
            console.log(`onMatchScoreUpdate: Sucesso para o usuário ${userId}`);
          } catch (error) {
            console.error(`onMatchScoreUpdate: Erro para o usuário ${userId}:`, error);
          }
        }
      }
    }
  }
});

/**
 * Lembrete de Palpites Pendentes.
 * Roda a cada 30 minutos para maior precisão no lembrete pré-jogo.
 */
export const notifyRoundStart = onSchedule("every 30 minutes", async (event) => {
  if (isQuietHours()) {
    console.log("notifyRoundStart: Job cancelado (horário de silêncio).");
    return;
  }

  // Pega a rodada mais recente
  const roundsSnapshot = await admin.firestore()
    .collection("rounds")
    .orderBy("roundNumber", "desc")
    .limit(1)
    .get();

  if (roundsSnapshot.empty) return;
  
  const currentRound = roundsSnapshot.docs[0];
  const roundData = currentRound.data();
  const roundId = currentRound.id;

  // Se os palpites já foram revelados, a rodada já começou
  if (roundData.isScoresHidden === false) return;

  const matches = roundData.matches || [];
  const targetCount = getValidMatchesCount(matches);
  
  if (targetCount === 0) {
    console.log("notifyRoundStart: Nenhum jogo válido para esta rodada no momento.");
    return;
  }

  // Filtra partidas para encontrar o início real (ignora canceladas)
  const firstMatchTime = matches
    .filter((m: any) => m.status !== 'cancelled' && m.utcDate)
    .reduce((earliest: number, m: any) => {
      const d = new Date(m.utcDate).getTime();
      return (d > 0 && d < earliest) ? d : earliest;
    }, Infinity);

  if (!Number.isFinite(firstMatchTime)) {
    console.log("notifyRoundStart: Nenhuma partida válida encontrada para calcular o tempo.");
    return;
  }

  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  // Só envia lembrete nas 24h que antecedem o primeiro jogo
  if (now < (firstMatchTime - twentyFourHours) || now >= firstMatchTime) {
    console.log(`notifyRoundStart: Fora da janela de lembrete. Início: ${new Date(firstMatchTime).toISOString()}`);
    return;
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

    // Notifica quem não completou os palpites obrigatórios (agora dinâmico)
    if (userBetsSnapshot.size < targetCount) {
      const remaining = targetCount - userBetsSnapshot.size;
      const message = {
        notification: {
          title: "⚠️ PALPITES PENDENTES!",
          body: `Ei ${userData.username || 'campeão'}, faltam ${remaining} palpite${remaining > 1 ? 's' : ''} para a ${roundData.name}. O primeiro jogo já vai começar!`,
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
        console.log(`notifyRoundStart: Lembrete enviado para ${userId} (${userBetsSnapshot.size}/${targetCount})`);
      } catch (error) {
        console.error(`notifyRoundStart: Erro ao notificar ${userId}:`, error);
      }
    }
  }
});
