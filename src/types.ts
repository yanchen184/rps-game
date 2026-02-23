export type Choice = 'rock' | 'paper' | 'scissors';
export type Result = 'win' | 'lose' | 'draw';

export interface GameRecord {
  id?: string;
  playerId: string;
  playerName: string;
  playerChoice: Choice;
  aiChoice: Choice;
  result: Result;
  timestamp: string;
  playerEmoji: string;
  aiEmoji: string;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  draws: number;
  total: number;
}

export interface PlayResponse {
  success: boolean;
  playerChoice: Choice;
  aiChoice: Choice;
  result: Result;
  record: GameRecord;
}
