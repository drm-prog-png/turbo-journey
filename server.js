import express from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// DEBUG: Check if GROQ_API_KEY is loaded
console.log('🔍 [DEBUG] GROQ_API_KEY loaded:', process.env.GROQ_API_KEY ? '✅ YES' : '❌ NO - Check your .env file!');

const app = express();
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// Initialize Groq client with API key
// DEBUG: Will fail if GROQ_API_KEY is not set
let groq;
try {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
  console.log('✅ [DEBUG] Groq client initialized successfully');
} catch (error) {
  console.error('❌ [ERROR] Failed to initialize Groq:', error.message);
  process.exit(1); // Exit if Groq client can't be created
}

// Route: Serve the main HTML page
app.get('/', (req, res) => {
  console.log('📄 [DEBUG] GET / - Serving index.html');
  res.sendFile('./index.html', { root: '.' });
});

// Route: API endpoint for generating text with Groq
app.post('/api/generate', async (req, res) => {
  console.log('📨 [DEBUG] POST /api/generate - Request received');
  
  try {
    const { prompt } = req.body;
    
    // DEBUG: Log the incoming prompt
    if (!prompt) {
      console.warn('⚠️ [WARNING] Empty prompt received');
      return res.status(400).json({ error: 'Prompt is required' });
    }
    console.log('📝 [DEBUG] Prompt:', prompt.substring(0, 50) + '...');
    
    // DEBUG: Log API call details
    console.log('🔄 [DEBUG] Calling Groq API with model: llama-3.3-70b-versatile');
    console.log('🔄 [DEBUG] Groq client:', typeof groq);
    console.log('🔄 [DEBUG] Groq.chat:', typeof groq.chat);
    
    // Using correct Groq SDK API: groq.chat.completions.create()
    const message = await groq.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
    });

    // DEBUG: Log successful response
    console.log('✅ [DEBUG] Groq API response successful');
    const responseText = message.choices[0].message.content;
    console.log('📊 [DEBUG] Response length:', responseText.length, 'characters');
    
    res.json({ result: responseText });
  } catch (error) {
    // DEBUG: Different error types
    console.error('❌ [ERROR] API Error Type:', error.constructor.name);
    console.error('❌ [ERROR] Message:', error.message);
    console.error('❌ [ERROR] Status:', error.status || 'N/A');
    
    // Check for specific API key error
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.error('🔑 [ERROR] Authentication failed - Check your GROQ_API_KEY!');
      return res.status(401).json({ error: 'Invalid API key' });
    }
    
    // Check for rate limit
    if (error.status === 429) {
      console.error('⏱️ [ERROR] Rate limit exceeded - Please try again later');
      return res.status(429).json({ error: 'Rate limit exceeded' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Route: API endpoint for translation
app.post('/api/translate', async (req, res) => {
  try {
    const { text, target = 'en', source = 'auto' } = req.body || {};

    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Text is required for translation' });
    }

    const params = new URLSearchParams({
      client: 'gtx',
      sl: String(source),
      tl: String(target),
      dt: 't',
      q: String(text),
    });

    const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
    if (!response.ok) {
      return res.status(502).json({ error: `Translate API HTTP ${response.status}` });
    }

    const data = await response.json();
    const translatedText = Array.isArray(data?.[0])
      ? data[0].map((part) => part?.[0] || '').join('')
      : '';

    if (!translatedText) {
      return res.status(502).json({ error: 'Translate API returned empty text' });
    }

    return res.json({
      translatedText,
      sourceLanguage: data?.[2] || source,
      targetLanguage: target,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
});
// Health check endpoint (useful for testing server is running)
app.get('/health', (req, res) => {
  console.log('💚 [DEBUG] GET /health - Health check');
  res.json({ status: 'Server is running', apiKeyConfigured: !!process.env.GROQ_API_KEY });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🚀 Open browser to: http://localhost:${PORT}`);
  console.log(`🚀 Health check: http://localhost:${PORT}/health`);
  console.log(`🚀 ========================================\n`);
});
