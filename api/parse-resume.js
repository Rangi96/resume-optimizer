const rateLimit = new Map();
const MAX_RESUME_SIZE = 50 * 1024;
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

    const { resumeText, language = 'en', mode = 'resume' } = req.body;
    const narrationMode = mode === 'narration';

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return res.status(400).json({ error: 'Resume text is required (at least 50 characters)' });
    }
    if (resumeText.length > MAX_RESUME_SIZE) {
      return res.status(400).json({ error: 'Resume text is too large' });
    }

    const languageInstructions = {
      'en': '\n\nIMPORTANT: Respond ONLY in English.',
      'es': '\n\nIMPORTANTE: Responde SOLO en español.'
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
        max_tokens: 6000,
        thinking: { type: "disabled" },
        messages: [{
          role: "user",
          content: `${narrationMode
            ? 'Structure this spoken narration of a candidate talking about their career into JSON for a career profile. This is a transcription-to-structure task.'
            : 'Structure this resume into JSON for a career profile. This is a pure extraction task.'}${languageInstruction}

RULES:
1. Do NOT invent, embellish, or omit anything. ${narrationMode
            ? 'Remove filler words, false starts, and repetitions from the spoken transcript, but preserve every fact, name, number, and detail exactly as stated'
            : "Preserve the candidate's original wording"}
2. For each job, put ALL its ${narrationMode ? 'described work' : 'bullet points and descriptions'} into a single "details" string, one item per line
3. Classify certifications AND courses into "courses"
4. Personal/side/freelance projects that are not tied to an employer go into "personalProjects"
5. Anything that does not fit any section (volunteering, languages, publications, awards, references) goes into "notes"
6. Use empty strings or empty arrays for missing sections. Never use null${narrationMode ? '\n7. Only fill sections the narration actually mentions. If the person only talked about one job, return only that one experience entry' : ''}

${narrationMode ? 'Narration transcript' : 'Resume'}:
${resumeText}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "contact": { "name": "", "email": "", "phone": "", "linkedin": "", "location": "" },
  "professionalSummary": "",
  "experience": [ { "title": "", "company": "", "location": "", "startDate": "", "endDate": "", "details": "" } ],
  "education": [ { "degree": "", "institution": "", "location": "", "date": "", "details": "" } ],
  "personalProjects": [ { "name": "", "period": "", "link": "", "details": "" } ],
  "courses": [ { "name": "", "provider": "", "date": "", "details": "" } ],
  "skills": [ { "category": "", "items": "comma, separated, skills" } ],
  "notes": ""
}`
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to parse resume' });
    }

    const data = await response.json();
    const content = data.content?.find(c => c.type === 'text')?.text || '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return res.status(200).json({ profile: parsed });
  } catch (error) {
    console.error('Resume parsing error:', error);
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout. Please try again.' });
    }
    return res.status(500).json({ error: 'Failed to parse resume' });
  }
}
