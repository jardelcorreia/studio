
export type TeamInfo = {
  abrev: string;
  nome: string;
  escudo: string;
};

export type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  utcDate: string;
  status: 'SCHEDULED' | 'LIVE' | 'PAUSED' | 'FINISHED' | 'POSTPONED' | 'SUSPENDED' | 'CANCELED';
  matchday: number;
};

export type StandingEntry = {
  position: number;
  teamName: string;
  teamCrest: string;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
};

export type Prediction = {
  homeScore: string;
  awayScore: string;
};

export type PlayerPredictions = Record<string, Prediction[]>;

export type GameSession = {
  roundName: string;
  predictions: PlayerPredictions;
  results: Prediction[];
  placaresOcultos: boolean;
};

export type PlayerScore = {
  name: string;
  points: number;
  exactScores: number;
  isWinner?: boolean;
  betsCompleted: boolean;
  photoUrl?: string;
};

export type ChampionshipWinner = {
  round: number;
  winners: string; // Ex: "Jardel, Werbet"
  value: number;
  pointsMap?: Record<string, number>; // Pontos reais ganhos por cada jogador na rodada
};

export type PlayerOverallStats = {
  name: string;
  wins: number;
  draws: number;
  points: number;
  balance: number;
};
