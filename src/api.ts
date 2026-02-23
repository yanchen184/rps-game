import type { Choice, PlayResponse, GameRecord, PlayerStats } from './types';

const API_BASE = 'https://love-letter-server-production.up.railway.app';

export async function playGame(
  playerId: string,
  playerName: string,
  choice: Choice
): Promise<PlayResponse> {
  const response = await fetch(`${API_BASE}/api/rps/play`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      playerId,
      playerName,
      choice,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to play game');
  }

  return response.json();
}

export async function getHistory(
  playerId?: string,
  limit: number = 20
): Promise<GameRecord[]> {
  let url = `${API_BASE}/api/rps/history?limit=${limit}`;
  if (playerId) {
    url += `&playerId=${playerId}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  const data = await response.json();
  return data.games || [];
}

export async function getStats(playerId: string): Promise<PlayerStats> {
  const response = await fetch(`${API_BASE}/api/rps/stats/${playerId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }

  const data = await response.json();
  return data.stats;
}
