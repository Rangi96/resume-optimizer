const rateLimit = new Map();
const MAX_RESUME_SIZE = 50 * 1024;
const MAX_JOB_DESC_SIZE = 20 * 1024;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60 * 1000;

function checkRateLimit(ip) {
  const now = Date.now();
  const key = ip;

  if (!rateLimit.has(key)) {
    rateLimit.set(key, []);
  }

  const timestamps = rateLimit.get(key).filter(t => now - t < RATE_LIMIT_WINDOW);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    return false;
  }

  timestamps.push(now);
  rateLimit.set(key, timestamps);

  if (rateLimit.size > 1000) {
    for (const [k, v] of rateLimit.entries()) {
      const filtered = v.filter(t => now - t < RATE_LIMIT_WINDOW);
      if (filtered.length === 0) {
        rateLimit.delete(k);
      } else {
        rateLimit.set(k, filtered);
      }
    }
  }

  return true;
}

function sanitizeString(str) {
  return str.trim().substring(0, 1000000);
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { originalResume, optimizedResume, jobDescription, language = 'en' } = req.body;

    if (!originalResume || typeof originalResume !== 'string') {
      return res.status(400).json({ error: 'Original resume is required' });
    }

    if (!optimizedResume || typeof optimizedResume !== 'string') {
      return res.status(400).json({ error: 'Optimized resume is required' });
    }

    if (!jobDescription || typeof jobDescription !== 'string') {
      return res.status(400).json({ error: 'Job description is required' });
    }

    if (originalResume.length > MAX_RESUME_SIZE || optimizedResume.length > MAX_RESUME_SIZE) {
      return res.status(400).json({ error: 'Resume exceeds maximum size' });
    }

    if (jobDescription.length > MAX_JOB_DESC_SIZE) {
      return res.status(400).json({ error: 'Job description exceeds maximum size' });
    }

    if (originalResume.length < 50 || optimizedResume.length < 50 || jobDescription.length < 50) {
      return res.status(400).json({ error: 'Input text is too short' });
    }

    const cleanOriginal = sanitizeString(originalResume);
    const cleanOptimized = sanitizeString(optimizedResume);
    const cleanJobDesc = sanitizeString(jobDescription);

    const languageInstructions = {
      'en': 'Respond in English.',
      'es': 'Responde en español.'
    };
    const languageInstruction = languageInstructions[language] || languageInstructions['en'];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 800,
        thinking: { type: "disabled" },
        messages: [{
          role: "user",
          content: `${languageInstruction}

You are evaluating how well two versions of a resume match a job description. Score each from 0-100 based on:
- Keyword and skill alignment with the job requirements
- Relevance of experience to the role
- Coverage of must-have qualifications
- Demonstrated impact relevant to the position

Job Description:
${cleanJobDesc}

ORIGINAL Resume:
${cleanOriginal}

OPTIMIZED Resume:
${cleanOptimized}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "originalScore": <integer 0-100>,
  "optimizedScore": <integer 0-100>,
  "originalReason": "Short one-sentence justification for the original score",
  "optimizedReason": "Short one-sentence justification for the optimized score"
}`
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to compute compatibility score' });
    }

    const data = await response.json();
    const content = data.content.find(c => c.type === 'text')?.text || '';

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({
      originalScore: clampScore(parsed.originalScore),
      optimizedScore: clampScore(parsed.optimizedScore),
      originalReason: typeof parsed.originalReason === 'string' ? parsed.originalReason : '',
      optimizedReason: typeof parsed.optimizedReason === 'string' ? parsed.optimizedReason : ''
    });
  } catch (error) {
    console.error('Score error:', error);

    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout. Please try again.' });
    }

    return res.status(500).json({ error: 'Failed to compute compatibility score' });
  }
}
