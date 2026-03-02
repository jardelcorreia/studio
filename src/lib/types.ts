
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
};
