import { useState, useEffect } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

const API_URL = 'http://localhost:5000/api'

export default function MatchHistory() {
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchMatches()
  }, [])

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/user/me/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMatches(response.data.matches)
    } catch (err) {
      console.error('Failed to fetch matches:', err)
      setMessage('Failed to load match history')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMatch = async (matchId) => {
    if (!window.confirm('Are you sure you want to delete this match?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/user/me/matches/${matchId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      setMessage('Match deleted successfully!')
      fetchMatches() // Refresh list
      
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to delete match')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-400">Loading match history...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Match History</h1>
          <p className="text-gray-400">View all your recorded matches</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/add-match')}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            Add New Match
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded mb-6">
          {message}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="bg-gray-800/50 rounded-lg p-8 text-center">
          <p className="text-gray-400 text-lg mb-4">No matches recorded yet</p>
          <button
            onClick={() => navigate('/add-match')}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold transition-colors"
          >
            Add Your First Match
          </button>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-900">
                  <th className="text-left p-4 text-gray-300">Date</th>
                  <th className="text-left p-4 text-gray-300">Map</th>
                  <th className="text-left p-4 text-gray-300">Type</th>
                  <th className="text-left p-4 text-gray-300">Outcome</th>
                  <th className="text-left p-4 text-gray-300">K/D/A</th>
                  <th className="text-left p-4 text-gray-300">Rounds</th>
                  <th className="text-left p-4 text-gray-300">Damage</th>
                  <th className="text-left p-4 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr key={match._id} className="border-b border-gray-700 hover:bg-gray-750">
                    <td className="p-4">
                      <div className="font-medium">{formatDate(match.date)}</div>
                      <div className="text-sm text-gray-400">{match.time}</div>
                    </td>
                    <td className="p-4">{match.map}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        match.matchType === 'Ranked' ? 'bg-purple-900/50 text-purple-300' :
                        match.matchType === 'Tournament' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {match.matchType}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        match.outcome === 'Win' ? 'bg-green-900/50 text-green-300' :
                        match.outcome === 'Loss' ? 'bg-red-900/50 text-red-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {match.outcome}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{match.kills}/{match.deaths}/{match.assists}</div>
                      <div className="text-sm text-gray-400">
                        K/D: {(match.deaths > 0 ? (match.kills / match.deaths).toFixed(2) : match.kills.toFixed(2))}
                      </div>
                    </td>
                    <td className="p-4">
                      {match.rounds} ({match.roundsWon}-{match.roundsLost})
                    </td>
                    <td className="p-4">
                      <div className="font-bold">{match.damage}</div>
                      <div className="text-sm text-gray-400">
                        {Math.round(match.damage / match.rounds)}/round
                      </div>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => handleDeleteMatch(match._id)}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-gray-700 text-gray-400 text-sm">
            Showing {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </div>
        </div>
      )}
    </div>
  )
}