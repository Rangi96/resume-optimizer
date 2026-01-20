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

function sanitizeString(str) {
  return str.trim().substring(0, 1000000);
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
    // Rate limiting
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }

    const { resumeText } = req.body;

    // Input validation
    if (!resumeText || typeof resumeText !== 'string') {
      return res.status(400).json({ error: 'Resume text is required' });
    }

    if (resumeText.length > MAX_RESUME_SIZE) {
      return res.status(400).json({ error: 'Resume exceeds maximum size' });
    }

    if (resumeText.length < 50) {
      return res.status(400).json({ error: 'Resume text is too short' });
    }

    const cleanResume = sanitizeString(resumeText);

    // Timeout for API call
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
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `Analyze this resume and provide 4-6 specific, actionable improvement suggestions. Each suggestion should follow this format:

**[Bold heading summarizing the improvement]** - [Detailed explanation with specific examples]

Example format:
**Add a compelling headline below your name** - Include a targeted headline like "Senior Data Analyst | Business Intelligence Specialist | $67M+ Budget Impact" to immediately communicate your value proposition and catch recruiters' attention.

Focus on high-impact improvements like:
- Adding quantifiable metrics and achievements
- Strengthening action verbs and impact statements
- Improving headline and professional summary
- Highlighting relevant skills and keywords
- Better formatting and structure

Resume:
${cleanResume}`
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to get suggestions' });
    }

    const data = await response.json();
    const content = data.content.find(c => c.type === 'text')?.text || '';
    
    // Parse numbered list into array
    const suggestionList = content
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    return res.status(200).json({ suggestions: suggestionList });
  } catch (error) {
    console.error('Suggestions error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout. Please try again.' });
    }
    
    return res.status(500).json({ error: 'Failed to get suggestions' });
  }
}