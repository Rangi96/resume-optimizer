const rateLimit = new Map();
const MAX_RESUME_SIZE = 50 * 1024;
const MAX_JOB_DESC_SIZE = 20 * 1024;
const MAX_INSTRUCTIONS_SIZE = 4 * 1024;
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

const TONE_GUIDES = {
  professional: 'Professional and confident: direct, competent, respectful. States qualifications plainly and connects them to the role without exaggeration.',
  enthusiastic: 'Enthusiastic and energetic: conveys genuine excitement about the role and company while staying grounded in real experience. Warm, positive language, never gushing or desperate.',
  conversational: 'Conversational and personable: reads like a smart, friendly human wrote it. Natural phrasing, first-person storytelling, minimal corporate jargon, while remaining workplace-appropriate.',
  formal: 'Formal and traditional: classic business-letter conventions, measured language, full sentences, no contractions. Suited to conservative industries such as law, finance, or government.'
};

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

    const {
      resumeText,
      jobDescription,
      company = '',
      tone = 'professional',
      instructions = '',
      language = 'en'
    } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Resume text is required (at least 50 characters)' });
    }
    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 50) {
      return res.status(400).json({ error: 'Job description is required (at least 50 characters)' });
    }
    if (resumeText.length > MAX_RESUME_SIZE || jobDescription.length > MAX_JOB_DESC_SIZE) {
      return res.status(400).json({ error: 'Input too large' });
    }
    if (typeof instructions !== 'string' || instructions.length > MAX_INSTRUCTIONS_SIZE) {
      return res.status(400).json({ error: 'Instructions too large' });
    }

    const toneGuide = TONE_GUIDES[tone] || TONE_GUIDES.professional;

    const languageInstructions = {
      'en': '\n\nIMPORTANT: Write the cover letter ONLY in English.',
      'es': '\n\nIMPORTANTE: Escribe la carta de presentación SOLO en español.'
    };
    const languageInstruction = languageInstructions[language] || languageInstructions['en'];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2000,
        thinking: { type: "disabled" },
        messages: [{
          role: "user",
          content: `Write a cover letter for this candidate applying to the job below.${languageInstruction}

THE CANDIDATE WILL BE INTERVIEWED ON THIS LETTER. Every claim must be something they can truthfully explain. NEVER invent experiences, skills, projects, metrics, or motivations that are not supported by the resume. Referencing the company's mission or the role's requirements is fine; claiming the candidate has done something the resume does not state is not.

TONE: ${toneGuide}

STRUCTURE AND STYLE RULES:
1. 250-350 words unless the custom instructions say otherwise
2. Open with a hook specific to this role${company ? ` at ${company.substring(0, 200)}` : ''}, not a generic "I am applying for..."  (unless the formal tone or custom instructions call for the traditional opening)
3. Body: connect the candidate's REAL experience from the resume to the top 2-3 requirements of the job. Be concrete, cite their actual work
4. Close with a confident call to action, no begging
5. NEVER use the em dash character "—" anywhere. Use a comma, colon, or period instead
6. Do not use placeholder brackets like [Company] or [Hiring Manager]. If the company name is not provided, phrase around it naturally
7. Do not invent an addressee name; use a natural greeting that works without one

${instructions ? `CUSTOM INSTRUCTIONS FROM THE CANDIDATE (follow these; they override the style rules above except the truthfulness and em dash rules):\n${instructions}\n` : ''}
Candidate's resume (THE ONLY SOURCE OF TRUTH about the candidate):
${resumeText}

Job description:
${jobDescription}

Return ONLY the cover letter text. No subject line, no explanations, no markdown formatting.`
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to generate cover letter' });
    }

    const data = await response.json();
    const coverLetter = data.content?.find(c => c.type === 'text')?.text?.trim() || '';

    if (!coverLetter) {
      return res.status(500).json({ error: 'No cover letter generated' });
    }

    return res.status(200).json({ coverLetter });
  } catch (error) {
    console.error('Cover letter error:', error);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout. Please try again.' });
    }
    return res.status(500).json({ error: 'Failed to generate cover letter' });
  }
}
