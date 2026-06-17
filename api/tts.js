export default async function handler(req, res) {
  // CORS headers for local dev
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health Check
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'ok',
      service: 'ElevenLabs TTS Proxy',
      hasApiKey: !!process.env.ELEVENLABS_API_KEY,
    });
  }

  // POST handler
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse body
  let text = '';
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    text = body?.text || '';
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Missing "text" field' });
  }

  // API Key
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY?.trim();
  if (!ELEVENLABS_API_KEY) {
    return res.status(500).json({
      error: 'Configuration Error',
      hint: 'Set ELEVENLABS_API_KEY in Vercel project settings'
    });
  }

  // Voice & Model
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel default
  const MODEL_ID = 'eleven_multilingual_v2';

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v2/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.35,
            similarity_boost: 0.9,
            style: 0.2,
            use_speaker_boost: true,
          },
          optimization: {
            text_normalization: 'auto',
          },
        }),
      }
    );

    if (!response.ok) {
      let errorDetail = '';
      try {
        const errData = await response.json();
        errorDetail = errData?.detail?.message || errData?.message || JSON.stringify(errData);
      } catch (_) {
        errorDetail = `HTTP ${response.status}`;
      }
      console.error('ElevenLabs error:', response.status, errorDetail);
      return res.status(502).json({
        error: 'ElevenLabs API Error',
        status: response.status,
        detail: errorDetail,
      });
    }

    // Stream audio back
    const audioBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(audioBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);

  } catch (err) {
    console.error('Proxy error:', err.message);
    return res.status(500).json({
      error: 'Proxy Error',
      detail: err.message,
    });
  }
}
