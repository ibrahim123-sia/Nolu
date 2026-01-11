import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

const API_URL ='https://nolu-lemon.vercel.app/api';

export default function Dashboard({ user, onLogout }) {
  const [stats, setStats] = useState(null)
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStats()
    fetchPrivacy()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/user/me/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data.stats)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
      setMessage('Failed to load stats. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const fetchPrivacy = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/user/me/privacy`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setIsPublic(response.data.isPublic)
    } catch (err) {
      console.error('Failed to fetch privacy:', err)
    }
  }

  const handlePrivacyChange = async (publicStatus) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/user/me/privacy`,
        { isPublic: publicStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setIsPublic(publicStatus)
      setMessage(`Profile is now ${publicStatus ? 'public' : 'private'}`)
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to update privacy')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleDeleteStats = async () => {
    if (!window.confirm('Are you sure you want to reset all stats? This will delete all your matches!')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`${API_URL}/user/me/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setStats(response.data.stats)
      setMessage('All stats have been reset!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to reset stats')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone!')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/user/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Clear local storage
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Notify parent component
      onLogout()
      
      // Redirect to home
      navigate('/')
      setMessage('Account deleted successfully!')
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to delete account')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-400">Loading stats...</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400">Welcome back, {user?.username}!</p>
          <p className="text-gray-400 text-sm">Your ID: {user?.userId}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-300">Profile:</span>
            <button
              onClick={() => handlePrivacyChange(!isPublic)}
              className={`px-4 py-2 rounded font-semibold transition-colors ${
                isPublic 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isPublic ? 'Public' : 'Private'}
            </button>
          </div>
          
          <div className="flex gap-2">
            <Link
              to="/add-match"
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Add Match
            </Link>
            <Link
              to="/match-history"
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Match History
            </Link>
            <button
              onClick={handleDeleteStats}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Reset Stats
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {message && (
        <div className={`${message.includes('success') ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'} border px-4 py-3 rounded mb-6`}>
          {message}
        </div>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          title="K/D Ratio" 
          value={stats?.kdRatio?.toFixed(2)} 
          color="blue"
          helpText="Total Kills ÷ Total Deaths"
        />
        <StatCard 
          title="Damage/Round" 
          value={stats?.damagePerRound?.toFixed(0)} 
          color="green"
          helpText="Total Damage ÷ Total Rounds"
        />
        <StatCard 
          title="Win %" 
          value={`${stats?.winPercentage?.toFixed(1)}%`} 
          color="purple"
          helpText="(Wins ÷ Total Matches) × 100"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800/50 p-4 rounded">
          <p className="text-gray-400 text-sm">Kills/Round</p>
          <p className="text-2xl font-bold">{stats?.killsPerRound?.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-1">Kills ÷ Rounds</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded">
          <p className="text-gray-400 text-sm">Total Matches</p>
          <p className="text-2xl font-bold">{stats?.totalGames}</p>
          <p className="text-xs text-gray-500 mt-1">Games played</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded">
          <p className="text-gray-400 text-sm">Win Rate</p>
          <p className="text-2xl font-bold">{stats?.wins}W-{stats?.totalGames - stats?.wins}L</p>
          <p className="text-xs text-gray-500 mt-1">Wins - Losses</p>
        </div>
        <div className="bg-gray-800/50 p-4 rounded">
          <p className="text-gray-400 text-sm">Total Rounds</p>
          <p className="text-2xl font-bold">{stats?.totalRounds}</p>
          <p className="text-xs text-gray-500 mt-1">Rounds played</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-6">Combat Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatItem title="Total Kills" value={stats?.kills} color="blue" />
          <StatItem title="Total Deaths" value={stats?.deaths} color="red" />
          <StatItem title="Total Assists" value={stats?.assists} color="green" />
          <StatItem title="Total Damage" value={stats?.totalDamage?.toLocaleString()} color="purple" />
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-300">Add Match Stats</h3>
          <p className="text-gray-300 mb-4">Record your latest match to update your statistics automatically.</p>
          <Link
            to="/add-match"
            className="inline-block bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            Add New Match
          </Link>
        </div>
        
        <div className="bg-purple-900/20 border border-purple-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-purple-300">Match History</h3>
          <p className="text-gray-300 mb-4">View, edit, or delete your previous matches.</p>
          <Link
            to="/match-history"
            className="inline-block bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-semibold transition-colors"
          >
            View History
          </Link>
        </div>
        
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleDeleteStats}
              className="w-full bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded font-semibold transition-colors text-sm"
            >
              Reset All Stats
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold transition-colors text-sm"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-red-400 mb-4">Delete Account</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete your account? This action cannot be undone. 
              All your matches and stats will be permanently deleted.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">How Stats are Calculated</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-300 mb-2">From Your Matches:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Each match updates your overall stats automatically</li>
              <li>• Stats are calculated from all your recorded matches</li>
              <li>• Deleting a match will recalculate your stats</li>
              <li>• Adding matches improves your stat accuracy</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-300 mb-2">Formulas:</h4>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• <span className="text-blue-400">K/D Ratio</span> = Total Kills ÷ Total Deaths</li>
              <li>• <span className="text-green-400">Damage/Round</span> = Total Damage ÷ Total Rounds</li>
              <li>• <span className="text-purple-400">Win %</span> = (Wins ÷ Total Matches) × 100</li>
              <li>• <span className="text-yellow-400">Kills/Round</span> = Total Kills ÷ Total Rounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, color, helpText }) {
  const colorClasses = {
    blue: 'border-blue-500 text-blue-400',
    green: 'border-green-500 text-green-400',
    purple: 'border-purple-500 text-purple-400',
  }

  return (
    <div className={`bg-gray-700/50 border-l-4 ${colorClasses[color]} p-6 rounded`}>
      <p className="text-gray-300 mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
      {helpText && <p className="text-xs text-gray-500 mt-2">{helpText}</p>}
    </div>
  )
}

function StatItem({ title, value, color }) {
  const colorClasses = {
    blue: 'text-blue-400',
    red: 'text-red-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
  }

  return (
    <div className="bg-gray-700/50 p-4 rounded">
      <p className="text-gray-400 text-sm">{title}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  )
}