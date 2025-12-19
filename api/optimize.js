const rateLimit = new Map();
const MAX_RESUME_SIZE = 50 * 1024; // 50KB
const MAX_JOB_DESC_SIZE = 20 * 1024; // 20KB
const RATE_LIMIT_MAX = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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

function validateInputs(resumeInput, jobDescription) {
  const errors = [];
  
  if (!resumeInput || typeof resumeInput !== 'string') {
    errors.push('Resume text is required');
  } else if (resumeInput.length > MAX_RESUME_SIZE) {
    errors.push(`Resume exceeds maximum size of ${MAX_RESUME_SIZE / 1024}KB`);
  } else if (resumeInput.length < 50) {
    errors.push('Resume text is too short');
  }
  
  if (!jobDescription || typeof jobDescription !== 'string') {
    errors.push('Job description is required');
  } else if (jobDescription.length > MAX_JOB_DESC_SIZE) {
    errors.push(`Job description exceeds maximum size of ${MAX_JOB_DESC_SIZE / 1024}KB`);
  } else if (jobDescription.length < 50) {
    errors.push('Job description is too short');
  }
  
  return errors;
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

    const { resumeInput, jobDescription } = req.body;

    // Input validation
    const validationErrors = validateInputs(resumeInput, jobDescription);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors[0]
      });
    }

    // Sanitize inputs
    const cleanResume = sanitizeString(resumeInput);
    const cleanJobDesc = sanitizeString(jobDescription);

    // Timeout for API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        messages: [{
          role: "user",
          content: `You are an expert resume optimizer. Your task is to analyze the job description and strategically reword the candidate's EXISTING resume to make them appear as a better fit for this specific role.

CRITICAL RULES - NEVER VIOLATE:
1. DO NOT invent, fabricate, or add ANY job titles, companies, experiences, or accomplishments that aren't in the original resume
2. DO NOT add skills or technologies the candidate hasn't mentioned
3. ONLY reword and rephrase EXISTING bullet points to:
   - Emphasize skills and keywords from the job description
   - Highlight relevant accomplishments that match job requirements
   - Use terminology and language from the job posting
   - Reorder bullet points to put most relevant experience first
4. Keep ALL job titles, company names, dates, and education EXACTLY as written in the original
5. Maintain the candidate's authentic voice and real experience

YOUR OPTIMIZATION STRATEGY:
- Analyze the job description to identify key requirements, skills, and keywords
- For each bullet point in the resume, reword it to emphasize aspects that align with the job requirements
- Use action verbs and terminology from the job description where appropriate
- Quantify achievements when possible (but only with numbers already in the resume)
- Reorder bullets within each job to showcase most relevant experience first
- Keep the same overall structure and all sections

Resume Information:(THIS IS THE ONLY SOURCE OF TRUTH - preserve all actual experiences):
${resumeInput}

Job Description: (analyze for keywords and requirements)
${jobDescription}

Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "contact": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "linkedin": "LinkedIn URL (optional)",
    "address": "address (optional)"
  },
  "professionalSummary": "2-3 sentence summary optimized for this role",
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY or Present",
      "bullets": ["Optimized achievement 1", "Optimized achievement 2", "..."]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "institution": "Institution Name",
      "location": "City, State (optional)",
      "date": "Graduation Date"
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "date": "Date"
    }
  ],
  "skills": [
    {
      "category": "Category Name",
      "items": ["Skill 1", "Skill 2", "..."]
    }
  ]
}`
        }]
      })
    });

    clearTimeout(timeout);

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      throw new Error('No content returned from AI');
    }
    
    const content = data.content.find(c => c.type === 'text')?.text || '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    // Extract token usage from Claude API response
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const totalTokens = inputTokens + outputTokens;
    
    // Add token count to response
    parsed.tokensUsed = totalTokens;
    
    return res.status(200).json(parsed);
  } catch (error) {
    // Log error server-side, don't expose to client
    console.error('Optimization error:', error);
    
    if (error.name === 'AbortError') {
      return res.status(504).json({ error: 'Request timeout. Please try again.' });
    }
    
    return res.status(500).json({ error: 'Failed to optimize resume' });
  }
}