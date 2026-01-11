const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "https://nolu-f781.vercel.app",
    credentials: true, 
  })
);
app.use(express.json());

// MongoDB Connection (for Vercel deployment)
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("❌ MONGODB_URI is not defined in environment variables");
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
}
connectDB();

// ======================
// SCHEMAS
// ======================

// User Schema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  // Aggregated stats (calculated from matches)
  kdRatio: {
    type: Number,
    default: 0.0
  },
  damagePerRound: {
    type: Number,
    default: 0.0
  },
  winPercentage: {
    type: Number,
    default: 0.0
  },
  killsPerRound: {
    type: Number,
    default: 0.0
  },
  wins: {
    type: Number,
    default: 0
  },
  kills: {
    type: Number,
    default: 0
  },
  deaths: {
    type: Number,
    default: 0
  },
  assists: {
    type: Number,
    default: 0
  },
  totalGames: {
    type: Number,
    default: 0
  },
  totalRounds: {
    type: Number,
    default: 0
  },
  totalDamage: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Match Schema (Individual matches)
const matchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  matchType: {
    type: String,
    required: true,
    enum: ['Ranked', 'Casual', 'Tournament', 'Practice']
  },
  outcome: {
    type: String,
    required: true,
    enum: ['Win', 'Loss', 'Draw']
  },
  map: {
    type: String,
    required: true
  },
  roundsWon: {
    type: Number,
    required: true,
    min: 0
  },
  roundsLost: {
    type: Number,
    required: true,
    min: 0
  },
  damage: {
    type: Number,
    required: true,
    min: 0
  },
  kills: {
    type: Number,
    required: true,
    min: 0
  },
  deaths: {
    type: Number,
    required: true,
    min: 0
  },
  assists: {
    type: Number,
    required: true,
    min: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for total rounds (roundsWon + roundsLost)
matchSchema.virtual('rounds').get(function() {
  return this.roundsWon + this.roundsLost;
});

// Ensure virtuals are included in JSON output
matchSchema.set('toJSON', { virtuals: true });
matchSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
const Match = mongoose.model('Match', matchSchema);

// ======================
// HELPER FUNCTIONS
// ======================

// Hash password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Calculate user stats from all matches
const calculateUserStats = async (userId) => {
  try {
    const matches = await Match.find({ userId });
    
    if (matches.length === 0) {
      return {
        kdRatio: 0,
        damagePerRound: 0,
        winPercentage: 0,
        killsPerRound: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        totalGames: 0,
        totalRounds: 0,
        totalDamage: 0
      };
    }
    
    // Calculate totals
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalDamage = 0;
    let totalRounds = 0;
    let wins = 0;
    let totalGames = matches.length;
    
    matches.forEach(match => {
      totalKills += match.kills;
      totalDeaths += match.deaths;
      totalAssists += match.assists;
      totalDamage += match.damage;
      totalRounds += (match.roundsWon + match.roundsLost);
      if (match.outcome === 'Win') wins++;
    });
    
    // Calculate derived stats
    const kdRatio = totalDeaths > 0 ? parseFloat((totalKills / totalDeaths).toFixed(2)) : totalKills;
    const damagePerRound = totalRounds > 0 ? parseFloat((totalDamage / totalRounds).toFixed(0)) : 0;
    const winPercentage = parseFloat(((wins / totalGames) * 100).toFixed(1));
    const killsPerRound = totalRounds > 0 ? parseFloat((totalKills / totalRounds).toFixed(2)) : 0;
    
    return {
      kdRatio,
      damagePerRound,
      winPercentage,
      killsPerRound,
      wins,
      kills: totalKills,
      deaths: totalDeaths,
      assists: totalAssists,
      totalGames,
      totalRounds,
      totalDamage
    };
  } catch (error) {
    console.error('Calculate stats error:', error);
    throw error;
  }
};

// ======================
// AUTHENTICATION MIDDLEWARE
// ======================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }
  
  const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
  
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    
    req.user = decoded;
    next();
  });
};

// ======================
// ROUTES
// ======================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Nolu Stats API',
    version: '1.0.0',
    endpoints: {
      auth: ['POST /api/signup', 'POST /api/login'],
      public: [
        'GET /api/user/:userId',
        'GET /api/search/players?query=searchTerm',
        'GET /api/maps'
      ],
      protected: [
        'GET /api/user/me/stats',
        'GET /api/user/me/matches',
        'POST /api/user/me/matches',
        'PUT /api/user/me/privacy',
        'DELETE /api/user/me/matches/:id',
        'DELETE /api/user/me/stats',
        'DELETE /api/user/me'
      ]
    }
  });
});

// ======================
// AUTHENTICATION ROUTES
// ======================

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { userId, username, password } = req.body;
    
    // Validation
    if (!userId || !username || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID, username, and password are required'
      });
    }
    
    // Check if user exists
    const existingUser = await User.findOne({ userId });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User ID already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = new User({
      userId,
      username,
      password: hashedPassword,
      isPublic: true
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user.userId, 
        id: user._id,
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        isPublic: user.isPublic,
        stats: {
          kdRatio: 0,
          damagePerRound: 0,
          winPercentage: 0,
          killsPerRound: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          totalGames: 0,
          totalRounds: 0,
          totalDamage: 0
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User ID already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Server error during signup',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { userId, password } = req.body;
    
    if (!userId || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID and password are required'
      });
    }
    
    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: user.userId, 
        id: user._id,
        username: user.username 
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        userId: user.userId,
        username: user.username,
        isPublic: user.isPublic,
        stats: {
          kdRatio: user.kdRatio,
          damagePerRound: user.damagePerRound,
          winPercentage: user.winPercentage,
          killsPerRound: user.killsPerRound,
          wins: user.wins,
          kills: user.kills,
          deaths: user.deaths,
          assists: user.assists,
          totalGames: user.totalGames,
          totalRounds: user.totalRounds,
          totalDamage: user.totalDamage
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// ======================
// PUBLIC ROUTES
// ======================

// Search players (NEW ROUTE)
app.get('/api/search/players', async (req, res) => {
  try {
    const { query, limit = 10 } = req.query;
    
    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }
    
    const searchQuery = query.trim();
    
    // Search in both userId and username fields for public profiles
    const players = await User.find({
      $and: [
        { isPublic: true },
        {
          $or: [
            { userId: { $regex: searchQuery, $options: 'i' } },
            { username: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      ]
    })
    .select('userId username kdRatio winPercentage totalGames wins kills deaths')
    .limit(parseInt(limit))
    .sort({ totalGames: -1 });
    
    res.json({
      success: true,
      count: players.length,
      players: players.map(player => ({
        userId: player.userId,
        username: player.username,
        stats: {
          kdRatio: player.kdRatio,
          winPercentage: player.winPercentage,
          totalGames: player.totalGames,
          wins: player.wins,
          kills: player.kills,
          deaths: player.deaths
        }
      }))
    });
    
  } catch (error) {
    console.error('❌ Search players error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching players'
    });
  }
});

// Get player by userId
app.get('/api/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    if (!user.isPublic) {
      return res.status(403).json({
        success: false,
        message: 'This player profile is private'
      });
    }
    
    // Get recent matches
    const recentMatches = await Match.find({ userId: user._id })
      .sort({ date: -1 })
      .limit(5)
      .select('date outcome map kills deaths assists damage roundsWon roundsLost');
    
    res.json({
      success: true,
      userId: user.userId,
      username: user.username,
      stats: {
        kdRatio: user.kdRatio,
        damagePerRound: user.damagePerRound,
        winPercentage: user.winPercentage,
        killsPerRound: user.killsPerRound,
        wins: user.wins,
        kills: user.kills,
        deaths: user.deaths,
        assists: user.assists,
        totalGames: user.totalGames,
        totalRounds: user.totalRounds,
        totalDamage: user.totalDamage
      },
      recentMatches: recentMatches || []
    });
    
  } catch (error) {
    console.error('❌ Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching player data'
    });
  }
});

// Get available maps
app.get('/api/maps', (req, res) => {
  const maps = [
    'Ascent', 'Bind', 'Haven', 'Split', 'Icebox', 'Breeze', 
    'Fracture', 'Pearl', 'Lotus', 'Sunset', 'Abyss', 'District',
    'Mirage', 'Inferno', 'Dust2', 'Nuke', 'Overpass', 'Vertigo'
  ];
  
  res.json({
    success: true,
    maps
  });
});

// ======================
// PROTECTED ROUTES
// ======================

// Get my stats
app.get('/api/user/me/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      stats: {
        kdRatio: user.kdRatio,
        damagePerRound: user.damagePerRound,
        winPercentage: user.winPercentage,
        killsPerRound: user.killsPerRound,
        wins: user.wins,
        kills: user.kills,
        deaths: user.deaths,
        assists: user.assists,
        totalGames: user.totalGames,
        totalRounds: user.totalRounds,
        totalDamage: user.totalDamage
      },
      settings: {
        isPublic: user.isPublic
      },
      user: {
        userId: user.userId,
        username: user.username
      }
    });
    
  } catch (error) {
    console.error('❌ Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your stats'
    });
  }
});

// Get my matches
app.get('/api/user/me/matches', authenticateToken, async (req, res) => {
  try {
    const matches = await Match.find({ userId: req.user.id })
      .sort({ date: -1, createdAt: -1 })
      .limit(100);
    
    res.json({
      success: true,
      matches
    });
    
  } catch (error) {
    console.error('❌ Get matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching matches'
    });
  }
});

// Add new match
app.post('/api/user/me/matches', authenticateToken, async (req, res) => {
  try {
    const {
      date,
      time,
      matchType,
      outcome,
      map,
      roundsWon,
      roundsLost,
      damage,
      kills,
      deaths,
      assists
    } = req.body;
    
    // Validate required fields
    if (!date || !time || !matchType || !outcome || !map || 
        roundsWon === undefined || roundsLost === undefined ||
        damage === undefined || kills === undefined || 
        deaths === undefined || assists === undefined) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Validate rounds
    if (roundsWon < 0 || roundsLost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Rounds won and lost cannot be negative'
      });
    }
    
    // Create match
    const match = new Match({
      userId: req.user.id,
      date,
      time,
      matchType,
      outcome,
      map,
      roundsWon: parseInt(roundsWon),
      roundsLost: parseInt(roundsLost),
      damage: parseInt(damage),
      kills: parseInt(kills),
      deaths: parseInt(deaths),
      assists: parseInt(assists)
    });
    
    await match.save();
    
    // Recalculate user stats
    const updatedStats = await calculateUserStats(req.user.id);
    
    // Update user with new stats
    await User.findByIdAndUpdate(req.user.id, updatedStats);
    
    res.status(201).json({
      success: true,
      message: 'Match added successfully!',
      match,
      updatedStats
    });
    
  } catch (error) {
    console.error('❌ Add match error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete match
app.delete('/api/user/me/matches/:id', authenticateToken, async (req, res) => {
  try {
    const match = await Match.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Recalculate user stats
    const updatedStats = await calculateUserStats(req.user.id);
    
    // Update user with new stats
    await User.findByIdAndUpdate(req.user.id, updatedStats);
    
    res.json({
      success: true,
      message: 'Match deleted successfully!',
      updatedStats
    });
    
  } catch (error) {
    console.error('❌ Delete match error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting match'
    });
  }
});

// Update privacy
app.put('/api/user/me/privacy', authenticateToken, async (req, res) => {
  try {
    const { isPublic } = req.body;
    
    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isPublic must be true or false'
      });
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    user.isPublic = isPublic;
    await user.save();
    
    res.json({
      success: true,
      message: `Profile is now ${isPublic ? 'public' : 'private'}`,
      isPublic: user.isPublic
    });
    
  } catch (error) {
    console.error('❌ Update privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating privacy'
    });
  }
});

// Get privacy
app.get('/api/user/me/privacy', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      isPublic: user.isPublic
    });
    
  } catch (error) {
    console.error('❌ Get privacy error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching privacy settings'
    });
  }
});

// Reset all stats (delete all matches)
app.delete('/api/user/me/stats', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete all matches
    await Match.deleteMany({ userId: req.user.id });
    
    // Reset user stats
    user.kdRatio = 0;
    user.damagePerRound = 0;
    user.winPercentage = 0;
    user.killsPerRound = 0;
    user.wins = 0;
    user.kills = 0;
    user.deaths = 0;
    user.assists = 0;
    user.totalGames = 0;
    user.totalRounds = 0;
    user.totalDamage = 0;
    
    await user.save();
    
    res.json({
      success: true,
      message: 'All stats reset successfully!',
      stats: {
        kdRatio: 0,
        damagePerRound: 0,
        winPercentage: 0,
        killsPerRound: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        totalGames: 0,
        totalRounds: 0,
        totalDamage: 0
      }
    });
    
  } catch (error) {
    console.error('❌ Reset stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting stats'
    });
  }
});

// Delete account
app.delete('/api/user/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Delete all matches first
    await Match.deleteMany({ userId: req.user.id });
    
    // Delete user
    await User.findByIdAndDelete(req.user.id);
    
    res.json({
      success: true,
      message: 'Account deleted successfully!'
    });
    
  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting account'
    });
  }
});

// ======================
// ERROR HANDLING
// ======================

// Global error handler
app.use((error, req, res, next) => {
  console.error('🔥 Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ======================
// START SERVER (Local only)
// ======================
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Nolu Player Stats API`);
    console.log(`🔗 http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;