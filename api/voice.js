// api/voice.js
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Missing "text" in request body' });
  }

  // Get the API key from environment variables
  const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;

  if (!ELEVEN_KEY) {
    console.error('❌ ELEVENLABS_API_KEY environment variable is not set');
    return res.status(500).json({ 
      error: 'Server configuration error: missing API key' 
    });
  }

  // ElevenLabs voice ID – you can change this
  const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel (natural English)

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
          text: text,
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
      console.error(`❌ ElevenLabs API error (${response.status}): ${errorText}`);
      return res.status(response.status).json({
        error: `ElevenLabs API error: ${response.status}`,
        details: errorText.substring(0, 200),
      });
    }

    // Get the audio data as a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Set proper headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.status(200).send(buffer);
  } catch (error) {
    console.error('❌ Internal server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
