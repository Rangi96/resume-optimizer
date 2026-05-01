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

    const { resumeInput, jobDescription, language = 'en' } = req.body;

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

    // Language instruction for AI response
    const languageInstructions = {
      'en': 'Respond ONLY in English. All output must be in English.',
      'es': 'Responde SOLO en español. Toda la salida debe estar en español.'
    };
    const languageInstruction = languageInstructions[language] || languageInstructions['en'];

    const systemPrompt = `You are an expert resume optimizer who helps candidates present their real experience in the strongest possible light for a specific job.

YOUR TASK (do this in order):
1. First, mentally extract the 8–12 most important keywords, skills, and competencies from the job description.
2. Then rewrite the candidate's resume so those keywords and competencies surface naturally — but ONLY using facts grounded in the original resume.

CRITICAL RULES — NEVER VIOLATE:
- DO NOT invent job titles, companies, employers, dates, or accomplishments that are not in the original resume.
- DO NOT fabricate metrics, percentages, dollar amounts, team sizes, or any quantitative result. If a number is not in the original, do not invent one.
- Keep all job titles, company names, employment dates, degree names, and graduation dates EXACTLY as written in the original.
- Maintain the candidate's authentic voice and only describe work they actually did.

WHAT YOU CAN DO:
- Rewrite weak or vague bullets into strong impact statements using STAR-style structure (action verb → what was done → outcome/scope), as long as every claim is supported by the original text.
- Merge redundant bullets, or split a bulky bullet into clearer separate ones.
- Reorder bullets within each role to put the most job-relevant work first.
- Use action verbs and terminology from the job description where they accurately describe what the candidate already did.
- Surface skills as a separate Skills section when they are clearly demonstrated by the existing bullets (e.g., a bullet about "migrated infrastructure to AWS" supports listing "AWS" as a skill, even if it wasn't in a Skills list before).
- Tighten the professional summary to a 2–3 sentence pitch that aligns the candidate's actual background with this specific role.

EXAMPLE — bullet rewrite:
Original: "Worked on the customer database and helped with reporting."
Job description emphasizes: SQL, data pipelines, stakeholder reporting.
Rewritten: "Maintained customer database in SQL and built recurring reports to support stakeholder decision-making."
(No fabricated metrics, no new technologies — only re-framed using JD vocabulary that the original work supports.)

OUTPUT FORMAT:
Return ONLY a valid JSON object — no markdown fences, no commentary, no preamble. Use this exact structure:
{
  "contact": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "linkedin": "LinkedIn URL (omit field if not in original)",
    "address": "address (omit field if not in original)"
  },
  "professionalSummary": "2-3 sentence summary tailored to this role",
  "experience": [
    {
      "title": "Job Title (verbatim from original)",
      "company": "Company Name (verbatim)",
      "location": "City, State",
      "startDate": "MMM YYYY",
      "endDate": "MMM YYYY or Present",
      "bullets": ["Optimized achievement 1", "Optimized achievement 2"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name (verbatim)",
      "institution": "Institution Name (verbatim)",
      "location": "City, State (optional)",
      "date": "Graduation Date (verbatim)"
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
      "category": "Category Name (e.g., Languages, Tools, Frameworks, Domain)",
      "items": ["Skill 1", "Skill 2"]
    }
  ]
}`;

    const userMessage = `${languageInstruction}

Resume (THIS IS THE ONLY SOURCE OF TRUTH — preserve all actual experiences):
${cleanResume}

Job Description (analyze for keywords and requirements):
${cleanJobDesc}`;

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
      signal: controller.signal,
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 16000,
        system: [
          {
            type: "text",
            text: systemPrompt,
            cache_control: { type: "ephemeral" }
          }
        ],
        messages: [{
          role: "user",
          content: userMessage
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