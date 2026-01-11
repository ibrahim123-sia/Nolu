import { useState } from 'react'
import axios from 'axios'

const API_URL = 'https://nolu-lemon.vercel.app/api';

export default function Home() {
  const [playerId, setPlayerId] = useState('')
  const [playerStats, setPlayerStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const searchPlayer = async () => {
    if (!playerId.trim()) {
      setError('Please enter a player ID')
      return
    }

    setLoading(true)
    setError('')
    setPlayerStats(null)

    try {
      const response = await axios.get(`${API_URL}/user/${playerId.trim()}`)
      setPlayerStats(response.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Player not found or profile is private')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchPlayer()
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">Nolu Player Stats</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Player Stats</h2>
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Player ID (e.g., 'nolu', 'player123')"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchPlayer}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>

      {playerStats && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">{playerStats.username}</h2>
              <p className="text-gray-400">ID: {playerStats.userId}</p>
            </div>
          </div>

          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
              title="K/D Ratio" 
              value={playerStats.stats.kdRatio.toFixed(2)} 
              color="blue"
            />
            <StatCard 
              title="Damage/Round" 
              value={playerStats.stats.damagePerRound.toFixed(0)} 
              color="green"
            />
            <StatCard 
              title="Win %" 
              value={`${playerStats.stats.winPercentage.toFixed(1)}%`} 
              color="purple"
            />
          </div>

          {/* Sub Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-gray-700/50 p-4 rounded">
              <p className="text-gray-400 text-sm">Wins</p>
              <p className="text-2xl font-bold">{playerStats.stats.wins}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded">
              <p className="text-gray-400 text-sm">Kills</p>
              <p className="text-2xl font-bold">{playerStats.stats.kills}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded">
              <p className="text-gray-400 text-sm">Deaths</p>
              <p className="text-2xl font-bold">{playerStats.stats.deaths}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded">
              <p className="text-gray-400 text-sm">Assists</p>
              <p className="text-2xl font-bold">{playerStats.stats.assists}</p>
            </div>
            <div className="bg-gray-700/50 p-4 rounded">
              <p className="text-gray-400 text-sm">Kills/Round</p>
              <p className="text-2xl font-bold">{playerStats.stats.killsPerRound.toFixed(2)}</p>
            </div>
          </div>

          {/* Recent Matches */}
          {playerStats.recentMatches && playerStats.recentMatches.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-4">Recent Matches</h3>
              <div className="space-y-2">
                {playerStats.recentMatches.map((match, index) => (
                  <div key={index} className="bg-gray-700/50 rounded p-3">
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-semibold ${match.outcome === 'Win' ? 'text-green-400' : match.outcome === 'Loss' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {match.outcome}
                      </span>
                      <span className="text-gray-400 text-sm">{new Date(match.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{match.map}</p>
                        <p className="text-sm text-gray-400">Score: {match.roundsWon || 0}-{match.roundsLost || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">
                          K/D/A: <span className="font-medium">{match.kills}/{match.deaths}/{match.assists}</span>
                        </p>
                        <p className="text-sm text-gray-400">{match.damage} damage</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-12 text-center text-gray-400">
        <p>Enter a player ID to view their public stats</p>
        <p className="text-sm mt-2">Sign up to create your own stats dashboard!</p>
      </div>
    </div>
  )
}

function StatCard({ title, value, color }) {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-400',
    green: 'border-green-500 text-green-400',
    purple: 'border-purple-500 text-purple-400',
  }

  return (
    <div className={`bg-gray-700/50 border-l-4 ${colorClasses[color]} p-6 rounded`}>
      <p className="text-gray-300 mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  )
}