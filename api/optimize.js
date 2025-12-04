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
          content: `You are an expert resume optimizer. Given a person's resume information and a job description, optimize the resume to better match the job requirements.

CRITICAL RULES:
1. DO NOT invent new experiences, skills, or accomplishments
2. ONLY rework existing content to highlight relevant aspects
3. Rewrite bullet points to emphasize relevant skills and match job keywords
4. Reorder sections/items to prioritize most relevant content
5. Ensure all dates, companies, and core facts remain accurate

Resume Information:
${resumeInput}

Job Description:
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