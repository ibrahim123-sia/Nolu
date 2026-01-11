import { Link, useNavigate } from 'react-router-dom'

export default function Navbar({ isAuthenticated, user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/')
  }

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-blue-400">
            Nolu Stats
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/" className="hover:text-blue-400 transition-colors">
              Home
            </Link>
            
            {isAuthenticated ? (
              <>
                <span className="text-gray-300">Welcome, {user?.username}</span>
                <Link 
                  to="/dashboard" 
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition-colors"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}