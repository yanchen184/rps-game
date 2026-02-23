import { useState, useEffect, useCallback } from 'react';
import type { Choice, Result, GameRecord, PlayerStats } from './types';
import { playGame, getHistory, getStats } from './api';

const VERSION = '1.0.0';

const CHOICES: { choice: Choice; emoji: string; label: string }[] = [
  { choice: 'rock', emoji: '✊', label: 'Rock' },
  { choice: 'paper', emoji: '✋', label: 'Paper' },
  { choice: 'scissors', emoji: '✌️', label: 'Scissors' },
];

const RESULT_COLORS: Record<Result, string> = {
  win: 'text-green-400',
  lose: 'text-red-400',
  draw: 'text-yellow-400',
};

const RESULT_LABELS: Record<Result, string> = {
  win: 'You Win!',
  lose: 'You Lose!',
  draw: 'Draw!',
};

function getPlayerId(): string {
  let id = localStorage.getItem('rps-player-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('rps-player-id', id);
  }
  return id;
}

function getPlayerName(): string {
  return localStorage.getItem('rps-player-name') || 'Player';
}

function App() {
  const [playerId] = useState(getPlayerId);
  const [playerName, setPlayerName] = useState(getPlayerName);
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastResult, setLastResult] = useState<{
    playerChoice: Choice;
    aiChoice: Choice;
    result: Result;
  } | null>(null);
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [historyData, statsData] = await Promise.all([
        getHistory(playerId, 10),
        getStats(playerId),
      ]);
      setHistory(historyData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    localStorage.setItem('rps-player-name', playerName);
  }, [playerName]);

  const handlePlay = async (choice: Choice) => {
    if (isPlaying) return;

    setIsPlaying(true);
    setShowAnimation(true);
    setLastResult(null);
    setError(null);

    // Animation delay
    await new Promise((r) => setTimeout(r, 800));

    try {
      const response = await playGame(playerId, playerName, choice);
      setLastResult({
        playerChoice: response.playerChoice,
        aiChoice: response.aiChoice,
        result: response.result,
      });
      await loadData();
    } catch (err) {
      setError('Connection failed. Please try again.');
      console.error(err);
    } finally {
      setIsPlaying(false);
      setShowAnimation(false);
    }
  };

  const winRate = stats && stats.total > 0
    ? Math.round((stats.wins / stats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Rock Paper Scissors</h1>
        <p className="text-gray-400">vs AI - v{VERSION}</p>
      </div>

      {/* Player Name Input */}
      <div className="mb-6">
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value || 'Player')}
          placeholder="Enter your name"
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-center text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-6 mb-8 text-center">
          <div className="bg-green-500/20 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-green-400">{stats.wins}</div>
            <div className="text-xs text-gray-400">Wins</div>
          </div>
          <div className="bg-red-500/20 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-red-400">{stats.losses}</div>
            <div className="text-xs text-gray-400">Losses</div>
          </div>
          <div className="bg-yellow-500/20 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-yellow-400">{stats.draws}</div>
            <div className="text-xs text-gray-400">Draws</div>
          </div>
          <div className="bg-blue-500/20 rounded-lg px-4 py-2">
            <div className="text-2xl font-bold text-blue-400">{winRate}%</div>
            <div className="text-xs text-gray-400">Win Rate</div>
          </div>
        </div>
      )}

      {/* Game Area */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-8 w-full max-w-md">
        {/* Result Display */}
        <div className="flex justify-center items-center gap-8 mb-8 h-32">
          {showAnimation ? (
            <div className="text-6xl animate-bounce">🤜🤛</div>
          ) : lastResult ? (
            <>
              <div className="text-center">
                <div className="text-6xl mb-2">
                  {CHOICES.find((c) => c.choice === lastResult.playerChoice)?.emoji}
                </div>
                <div className="text-sm text-gray-400">You</div>
              </div>
              <div className="text-2xl font-bold">VS</div>
              <div className="text-center">
                <div className="text-6xl mb-2">
                  {CHOICES.find((c) => c.choice === lastResult.aiChoice)?.emoji}
                </div>
                <div className="text-sm text-gray-400">AI</div>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-lg">Choose your move!</div>
          )}
        </div>

        {/* Result Text */}
        {lastResult && !showAnimation && (
          <div className={`text-center text-3xl font-bold mb-6 ${RESULT_COLORS[lastResult.result]}`}>
            {RESULT_LABELS[lastResult.result]}
          </div>
        )}

        {/* Choice Buttons */}
        <div className="flex justify-center gap-4">
          {CHOICES.map(({ choice, emoji, label }) => (
            <button
              key={choice}
              onClick={() => handlePlay(choice)}
              disabled={isPlaying}
              className={`
                flex flex-col items-center justify-center
                w-24 h-24 rounded-2xl
                bg-white/10 hover:bg-white/20
                border-2 border-transparent hover:border-blue-400
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                ${isPlaying ? 'scale-95' : 'hover:scale-105'}
              `}
              data-testid={`btn-${choice}`}
            >
              <span className="text-4xl mb-1">{emoji}</span>
              <span className="text-xs text-gray-400">{label}</span>
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 text-center text-red-400 text-sm">{error}</div>
        )}
      </div>

      {/* History */}
      <div className="w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-center">Recent Games</h2>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden">
          {history.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No games yet</div>
          ) : (
            <div className="divide-y divide-white/10">
              {history.map((game, index) => (
                <div
                  key={game.id || index}
                  className="flex items-center justify-between p-3 hover:bg-white/5"
                  data-testid="history-item"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{game.playerEmoji}</span>
                    <span className="text-gray-500">vs</span>
                    <span className="text-2xl">{game.aiEmoji}</span>
                  </div>
                  <span className={`font-bold ${RESULT_COLORS[game.result]}`}>
                    {game.result.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Game Hub - Rock Paper Scissors v{VERSION}</p>
      </div>
    </div>
  );
}

export default App;
