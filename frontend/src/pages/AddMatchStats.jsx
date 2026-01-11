import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

// Update this URL for production
const API_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-domain.vercel.app/api' 
  : 'http://localhost:5000/api';

export default function AddMatchStats() {
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    matchType: 'Ranked',
    outcome: 'Win',
    map: '',
    roundsWon: '',
    roundsLost: '',
    damage: '',
    kills: '',
    deaths: '',
    assists: ''
  })
  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    fetchMaps()
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0]
    const now = new Date().toTimeString().slice(0, 5)
    setFormData(prev => ({
      ...prev,
      date: today,
      time: now
    }))
  }, [])

  const fetchMaps = async () => {
    try {
      const response = await axios.get(`${API_URL}/maps`)
      setMaps(response.data.maps)
    } catch (err) {
      console.error('Failed to fetch maps:', err)
      // Fallback maps if API fails
      setMaps(['Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 'Fracture'])
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validation
    if (parseInt(formData.roundsWon) < 0 || parseInt(formData.roundsLost) < 0) {
      setMessage({
        type: 'error',
        text: 'Rounds won and lost cannot be negative'
      })
      setLoading(false)
      return
    }

    try {
      const token = localStorage.getItem('token')
      
      // Convert string values to numbers
      const dataToSend = {
        ...formData,
        roundsWon: parseInt(formData.roundsWon) || 0,
        roundsLost: parseInt(formData.roundsLost) || 0,
        damage: parseInt(formData.damage) || 0,
        kills: parseInt(formData.kills) || 0,
        deaths: parseInt(formData.deaths) || 0,
        assists: parseInt(formData.assists) || 0
      }

      const response = await axios.post(
        `${API_URL}/user/me/matches`,
        dataToSend,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setMessage({
        type: 'success',
        text: 'Match added successfully! Stats have been updated.'
      })

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        matchType: 'Ranked',
        outcome: 'Win',
        map: '',
        roundsWon: '',
        roundsLost: '',
        damage: '',
        kills: '',
        deaths: '',
        assists: ''
      })

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)

    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to add match'
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate total rounds
  const totalRounds = (parseInt(formData.roundsWon) || 0) + (parseInt(formData.roundsLost) || 0);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Add Match Stats</h1>
        <p className="text-gray-400">Add a new match to update your statistics</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded ${
          message.type === 'success' 
            ? 'bg-green-900/50 border border-green-700 text-green-200' 
            : 'bg-red-900/50 border border-red-700 text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-gray-800 rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Match Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Date *</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Time *</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Match Type *</label>
              <select
                name="matchType"
                value={formData.matchType}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Ranked">Ranked</option>
                <option value="Casual">Casual</option>
                <option value="Tournament">Tournament</option>
                <option value="Practice">Practice</option>
              </select>
            </div>
          </div>

          {/* Outcome and Map */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Outcome *</label>
              <select
                name="outcome"
                value={formData.outcome}
                onChange={handleChange}
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Win">Win</option>
                <option value="Loss">Loss</option>
                <option value="Draw">Draw</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Map *</label>
              <select
                name="map"
                value={formData.map}
                onChange={handleChange}
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a map</option>
                {maps.map((map) => (
                  <option key={map} value={map}>{map}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Round Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Rounds Won *</label>
              <input
                type="number"
                name="roundsWon"
                value={formData.roundsWon}
                onChange={handleChange}
                min="0"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 7"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Rounds Lost *</label>
              <input
                type="number"
                name="roundsLost"
                value={formData.roundsLost}
                onChange={handleChange}
                min="0"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 6"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Total Rounds</label>
              <div className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2">
                <p className="text-white text-lg font-bold">{totalRounds}</p>
              </div>
              <p className="text-xs text-gray-400 mt-1">Calculated automatically</p>
            </div>
          </div>

          {/* Damage and K/D/A */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Total Damage *</label>
              <input
                type="number"
                name="damage"
                value={formData.damage}
                onChange={handleChange}
                min="0"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3200"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Kills *</label>
              <input
                type="number"
                name="kills"
                value={formData.kills}
                onChange={handleChange}
                min="0"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Deaths *</label>
              <input
                type="number"
                name="deaths"
                value={formData.deaths}
                onChange={handleChange}
                min="0"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 10"
              />
            </div>

            <div>
              <label className="block text-gray-300 mb-2">Assists *</label>
              <input
                type="number"
                name="assists"
                value={formData.assists}
                onChange={handleChange}
                min="0"
                required
                className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
            </div>
          </div>

         

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Adding Match...' : 'Add Match'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* How it works */}
      <div className="mt-8 bg-gray-800/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">How Stats are Calculated</h3>
        <div className="text-sm text-gray-400 space-y-2">
          <p>• <span className="text-blue-400">Total Rounds</span> = Rounds Won + Rounds Lost</p>
          <p>• <span className="text-blue-400">K/D Ratio</span> = Total Kills ÷ Total Deaths</p>
          <p>• <span className="text-green-400">Damage/Round</span> = Total Damage ÷ Total Rounds</p>
          <p>• <span className="text-purple-400">Win %</span> = (Total Wins ÷ Total Matches) × 100</p>
          <p>• <span className="text-yellow-400">Kills/Round</span> = Total Kills ÷ Total Rounds</p>
        </div>
      </div>
    </div>
  )
}