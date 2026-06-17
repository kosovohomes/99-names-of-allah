// api/tts.js
export default async function handler(req, res) {
  // 1. Log Request for Debugging
  console.log(`📥 [${new Date().toISOString()}] ${req.method} ${req.url}`);

  // 2. Health Check (GET)
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      message: 'Voice API is live.',
      config: {
        hasApiKey: !!process.env.ELEVENLABS_API_KEY,
        nodeVersion: process.version
      }
    });
  }

  // 3. Method Guard
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 4. Parse Body Safely
  let text = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    text = body?.text || '';
  } catch (e) {
    console.error('❌ Body Parse Error:', e.message);
    return res.status(400).json({ error: 'Invalid JSON body', details: e.message });
  }

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing "text" in request body' });
  }

  // 5. API Key Check
  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY?.trim();
  if (!ELEVEN_KEY) {
    console.error('❌ ELEVENLABS_API_KEY is missing in environment variables');
    return res.status(500).json({ 
      error: 'API Key Missing', 
      details: 'Please set ELEVENLABS_API_KEY in your Vercel Project Settings.' 
    });
  }

  // 6. ElevenLabs Request
  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
  const MODEL_ID = 'eleven_multilingual_v2';

  try {
    console.log(`📡 Requesting ElevenLabs: "${text.substring(0, 20)}..."`);
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_KEY,
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text,
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      const errorMsg = errorJson.detail?.message || `HTTP ${response.status}`;
      console.error(`❌ ElevenLabs API Error (${response.status}):`, errorMsg);
      
      return res.status(response.status).json({
        error: `ElevenLabs Error: ${response.status}`,
        details: errorMsg
      });
    }

    // 7. Stream Audio Response
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log(`✅ Success: Generated ${buffer.length} bytes of audio`);
    
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 's-maxage=86400'); // Cache for 24h on Vercel Edge
    return res.status(200).send(buffer);

  } catch (error) {
    console.error('❌ Server Error:', error.message);
    return res.status(500).json({
      error: 'Internal Server Error',
      details: error.message
    });
  }
}
