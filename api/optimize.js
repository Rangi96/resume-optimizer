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

  const { resumeInput, jobDescription } = req.body;

  if (!resumeInput || !jobDescription) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
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

    const data = await response.json();
    
    if (!data.content || data.content.length === 0) {
      throw new Error('No content returned from AI');
    }
    
    const content = data.content.find(c => c.type === 'text')?.text || '';
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Optimization error:', error);
    return res.status(500).json({ 
      error: 'Failed to optimize resume', 
      details: error.message 
    });
  }
}