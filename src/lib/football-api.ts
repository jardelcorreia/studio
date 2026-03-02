
'use server';

import { Match } from './types';

const API_KEY = process.env.FOOTBALL_DATA_API_KEY;
const BASE_URL = 'https://api.football-data.org/v4';

/**
 * Busca os jogos de uma rodada específica do Brasileirão (BSA).
 */
export async function getBrasileiraoMatches(matchday: number): Promise<Match[]> {
  if (!API_KEY) {
    console.error('API Key do Football-Data não configurada.');
    return [];
  }

  try {
    const response = await fetch(`${BASE_URL}/competitions/BSA/matches?matchday=${matchday}`, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
      next: { revalidate: 3600 }, // Cache de 1 hora
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.statusText}`);
    }

    const data = await response.json();

    return data.matches.map((m: any) => ({
      id: m.id,
      homeTeam: m.homeTeam.name,
      awayTeam: m.awayTeam.name,
      homeScore: m.score.fullTime.home,
      awayScore: m.score.fullTime.away,
      utcDate: m.utcDate,
      status: m.status,
      matchday: m.matchday,
    }));
  } catch (error) {
    console.error('Erro ao buscar jogos:', error);
    return [];
  }
}
