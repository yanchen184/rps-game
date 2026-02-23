import { useState, useEffect, useCallback } from 'react';
import type { Choice, Result, GameRecord, PlayerStats } from './types';
import { playGame, getHistory, getStats } from './api';

const VERSION = '1.1.0';

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

// Login Page Component
function LoginPage({ onLogin }: { onLogin: (name: string) => void }) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }
    if (trimmedName.length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    onLogin(trimmedName);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">✊✋✌️</div>
          <h1 className="text-3xl font-bold mb-2">Rock Paper Scissors</h1>
          <p className="text-gray-400">vs AI - v{VERSION}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Enter your name to play</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Your name..."
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 text-lg"
              autoFocus
              data-testid="login-input"
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200 text-lg"
            data-testid="login-button"
          >
            Start Playing
          </button>
        </form>

        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Your game history will be saved</p>
        </div>
      </div>
    </div>
  );
}

// Game Page Component
function GamePage({ playerName, onLogout }: { playerName: string; onLogout: () => void }) {
  const [playerId] = useState(() => {
    // Use playerName as part of the ID for consistent history
    let id = localStorage.getItem(`rps-player-id-${playerName}`);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(`rps-player-id-${playerName}`, id);
    }
    return id;
  });
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
  const [isLoading, setIsLoading] = useState(true);

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
    } finally {
      setIsLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold mb-2">Rock Paper Scissors</h1>
        <p className="text-gray-400">vs AI - v{VERSION}</p>
      </div>

      {/* Player Info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="text-gray-400">Player:</span>
          <span className="font-bold text-lg">{playerName}</span>
        </div>
        <button
          onClick={onLogout}
          className="bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white px-3 py-2 rounded-lg transition-colors text-sm"
          data-testid="logout-button"
        >
          Change Player
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="flex gap-4 mb-6 text-center">
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
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 mb-6 w-full max-w-md">
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
        <h2 className="text-xl font-bold mb-4 text-center">
          {playerName}'s Recent Games
        </h2>
        <div className="bg-white/5 backdrop-blur-sm rounded-xl overflow-hidden">
          {history.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No games yet - start playing!</div>
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
      <div className="mt-6 text-center text-gray-500 text-sm">
        <p>Game Hub - Rock Paper Scissors v{VERSION}</p>
      </div>
    </div>
  );
}

// Main App Component
function App() {
  const [playerName, setPlayerName] = useState<string | null>(() => {
    return localStorage.getItem('rps-current-player');
  });

  const handleLogin = (name: string) => {
    localStorage.setItem('rps-current-player', name);
    setPlayerName(name);
  };

  const handleLogout = () => {
    localStorage.removeItem('rps-current-player');
    setPlayerName(null);
  };

  if (!playerName) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <GamePage playerName={playerName} onLogout={handleLogout} />;
}

export default App;
