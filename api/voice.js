// api/voice.js
export default async function handler(req, res) {
  // Log the request method and URL (visible in Vercel logs)
  console.log(`📥 Method: ${req.method}, URL: ${req.url}`);

  // Allow both GET (for testing) and POST (for the app)
  if (req.method === 'GET') {
    // Simple GET response to verify the function is alive
    return res.status(200).json({
      status: 'ok',
      message: 'Voice API is live. Send a POST request with { "text": "..." }'
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Parse JSON body
  let text = '';
  try {
    const body = req.body;
    if (typeof body === 'string') {
      text = JSON.parse(body).text;
    } else {
      text = body.text;
    }
  } catch (e) {
    console.error('❌ Failed to parse body:', e);
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing "text" in request body' });
  }

  // Get the API key from environment
  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVEN_KEY) {
    console.error('❌ ELEVENLABS_API_KEY is not set');
    return res.status(500).json({ error: 'Server configuration: missing API key' });
  }

  // Voice ID (Rachel)
  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM';

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVEN_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.4,
            similarity_boost: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ ElevenLabs error (${response.status}): ${errorText}`);
      return res.status(response.status).json({
        error: `ElevenLabs API error: ${response.status}`,
        details: errorText.substring(0, 200),
      });
    }

    // Stream audio back
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('❌ Internal error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
