const rateLimit = new Map();
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

    const { role, company, requirement, context } = req.body;

    // Input validation
    if (!role || typeof role !== 'string') {
      return res.status(400).json({ error: 'role is required' });
    }

    if (!company || typeof company !== 'string') {
      return res.status(400).json({ error: 'company is required' });
    }

    if (!requirement || typeof requirement !== 'string') {
      return res.status(400).json({ error: 'requirement is required' });
    }

    const cleanRole = sanitizeString(role);
    const cleanCompany = sanitizeString(company);
    const cleanRequirement = sanitizeString(requirement);
    const cleanContext = context ? sanitizeString(context) : '';

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
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Generate ONE professional resume bullet point for the role "${cleanRole}" at "${cleanCompany}" that demonstrates this skill/requirement: "${cleanRequirement}".

The bullet point should:
- Start with a strong action verb
- Be specific and quantifiable if possible
- Sound authentic to someone who actually worked in this role
- Be 1-2 sentences maximum

${cleanContext ? `Context about the candidate's background:\n${cleanContext}\n\n` : ''}

Return ONLY the bullet point text. No prefix, no bullet symbol, no explanation.`
        }]
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(500).json({ error: 'Failed to generate bullet point' });
    }

    const data = await response.json();
    const content = data.content.find(c => c.type === 'text')?.text || '';
    
    // Clean up the bullet point
    const bullet = content.trim().replace(/^[•\-\*]\s*/, '');
    
    if (!bullet || bullet.length === 0) {
      throw new Error('Empty response from AI');
    }
    
    return res.status(200).json({ bullet });
  } catch (error) {
    console.error('Generate bullet error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout. Please try again.' });
    }
    
    return res.status(500).json({ error: 'Failed to generate bullet point' });
  }
}