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

    const { resumeInput, jobDescription, language = 'en', sourceType = 'upload' } = req.body;
    const profileMode = sourceType === 'profile';

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
      'en': '\n\nIMPORTANT: Respond ONLY in English. All output must be in English.',
      'es': '\n\nIMPORTANTE: Responde SOLO en español. Toda la salida debe estar en español.'
    };
    const languageInstruction = languageInstructions[language] || languageInstructions['en'];

    // Timeout for API call
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50000); // stay under Vercel's 60s maxDuration so we return JSON, not Vercel's HTML error page

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 8000,
        thinking: { type: "disabled" },
        messages: [{
          role: "user",
          content: `You are an expert resume optimizer. ${profileMode
            ? "The candidate has provided their FULL career profile: an intentionally exhaustive record of every job, project, decision, course, and skill they have. Your task is to analyze the job description and SELECT the most relevant REAL content from this profile, then reword it for this role. You may only choose and reword what already exists; you may not create anything new."
            : "Your task is to analyze the job description and strategically reword the candidate's EXISTING resume so their REAL experience is presented in the most relevant way for this specific role."}${languageInstruction}

THE CANDIDATE WILL BE INTERVIEWED ON THIS RESUME. Every line must be something they can truthfully explain and discuss in depth. A single invented claim can cost them the job and their credibility. A shorter, fully truthful resume is ALWAYS better than a longer one containing anything unverifiable.

CRITICAL RULES - NEVER VIOLATE:
1. DO NOT invent, fabricate, or add ANY job titles, companies, experiences, projects, responsibilities, or accomplishments that aren't in the source
2. DO NOT add skills, technologies, tools, methodologies, or certifications the candidate hasn't explicitly mentioned
3. Job description terminology may ONLY be used to rename something the candidate ALREADY described (e.g. their "made monthly sales reports" can become the job's "sales reporting"). NEVER copy a skill, tool, duty, or requirement from the job description into the resume just because the job asks for it. If the candidate never mentioned it, it does not appear, PERIOD
4. DO NOT add numbers, percentages, team sizes, budgets, or any metric that is not in the source
5. ONLY reword, rephrase, reorder, and select from EXISTING content
6. Keep ALL job titles, company names, dates, and education EXACTLY as written in the source
7. Maintain the candidate's authentic voice and real experience
8. NEVER use the em dash character "—" anywhere in your output. Use a comma, colon, period, or the word "and" instead
9. NEVER decrease the candidate's stated years of experience. If the source says "8+ years", the output must say "8+ years" or higher, NEVER a smaller number. Stating MORE years is only allowed when the source's actual work history dates support it; stating FEWER is never allowed under any circumstances

YOUR OPTIMIZATION STRATEGY:
${profileMode ? `- The profile is exhaustive ON PURPOSE. Do NOT include everything: select only the content most relevant to this job
- Keep the employment history complete (every job with its title, company, and dates), but choose which of the candidate's REAL achievements to feature for each role: typically the 3-5 most relevant per role
- Include only the skills, certifications, and courses FROM THE PROFILE that strengthen this specific application; leave the rest out
- Reword the selected content so its genuine overlap with the job requirements is easy to see
- Quantify achievements when possible (but only with numbers already in the profile)
- If the profile contains little relevant content, return a SHORT resume. NEVER pad it with generic or invented material to fill a page` : `- Analyze the job description to identify key requirements, skills, and keywords
- For each bullet point in the resume, reword it to emphasize the aspects of the candidate's REAL work that align with the job requirements
- Use strong action verbs; borrow the job posting's terminology only where rule 3 allows it
- Quantify achievements when possible (but only with numbers already in the resume)
- Reorder bullets within each job to showcase most relevant experience first
- Keep the same overall structure and all sections`}

FINAL VERIFICATION - MANDATORY: Before returning your answer, check EVERY bullet point, skill, and claim in your output against the source material. If you cannot point to where the source states it, REMOVE it or reword it so it only claims what the source supports.

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
  "professionalSummary": "2-3 sentence summary optimized for this role, built ONLY from facts stated in the source",
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