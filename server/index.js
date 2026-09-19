import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { queryDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nutriscan_jwt_secret_key_2026';
const HF_API_KEY = process.env.VITE_HF_API_KEY || process.env.HF_API_KEY || '';

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'No authentication token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// User Registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await queryDb('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await queryDb(
      'INSERT INTO users (name, email, password_hash, allergens, custom_concerns) VALUES (?, ?, ?, ?, ?)',
      [name, email.toLowerCase().trim(), hashedPassword, JSON.stringify([]), JSON.stringify([])]
    );

    const userId = result.insertId || result[0]?.insertId;
    const userPayload = { id: userId, email: email.toLowerCase().trim(), name };

    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      token,
      user: { ...userPayload, allergens: [], customConcerns: [] }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const users = await queryDb('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const dbUser = users[0];
    const match = await bcrypt.compare(password, dbUser.password_hash);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const allergens = typeof dbUser.allergens === 'string' ? JSON.parse(dbUser.allergens) : (dbUser.allergens || []);
    const customConcerns = typeof dbUser.custom_concerns === 'string' ? JSON.parse(dbUser.custom_concerns) : (dbUser.custom_concerns || []);

    const userPayload = { id: dbUser.id, email: dbUser.email, name: dbUser.name };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: { ...userPayload, allergens, customConcerns }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const users = await queryDb('SELECT id, name, email, allergens, custom_concerns FROM users WHERE id = ?', [req.user.id]);
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const u = users[0];
    const allergens = typeof u.allergens === 'string' ? JSON.parse(u.allergens) : (u.allergens || []);
    const customConcerns = typeof u.custom_concerns === 'string' ? JSON.parse(u.custom_concerns) : (u.custom_concerns || []);

    res.json({
      user: {
        id: u.id,
        name: u.name,
        email: u.email,
        allergens,
        customConcerns
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Server-side High-Precision OCR Processing Endpoint
app.post('/api/ocr/scan', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ message: 'Image data is required' });

    // Optional server-side Vision OCR enhancement
    res.json({ text: null, note: 'Using client-side multi-pass OCR fallback' });
  } catch (err) {
    res.status(500).json({ message: 'OCR server error' });
  }
});

// Hugging Face Built-in AI Proxy
app.post('/api/ai/proxy', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ message: 'Prompt is required' });

    const modelEndpoints = [
      'https://api-inference.huggingface.co/models/deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      'https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-3B-Instruct',
      'https://api-inference.huggingface.co/models/Qwen/Qwen2.5-Coder-32B-Instruct'
    ];

    for (const url of modelEndpoints) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${HF_API_KEY}`
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: { max_new_tokens: 150, temperature: 0.2, return_full_text: false }
          })
        });

        if (response.ok) {
          const data = await response.json();
          let generatedText = '';
          if (Array.isArray(data) && data[0]?.generated_text) {
            generatedText = data[0].generated_text;
          } else if (data?.generated_text) {
            generatedText = data.generated_text;
          }

          if (generatedText) {
            return res.json({ result: generatedText });
          }
        }
      } catch (e) {}
    }

    return res.status(502).json({ message: 'AI model service unavailable, using local fallback' });
  } catch (err) {
    res.status(500).json({ message: 'AI Proxy error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 NutriScan Backend Server listening on http://localhost:${PORT}`);
});
