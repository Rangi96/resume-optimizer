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

  const { resumeText, jobDescription } = req.body;

  if (!resumeText || !jobDescription) {
    return res.status(400).json({ error: 'Missing resumeText or jobDescription' });
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
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: `Analyze the job description and identify skills or requirements that are NOT clearly demonstrated in the resume. Find gaps where the candidate could strengthen their application.

Resume:
${resumeText}

Job Description:
${jobDescription}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "gaps": [
    {
      "requirement": "The missing skill or requirement from the job description",
      "prompt": "Brief suggestion on how to address this gap"
    }
  ]
}

Identify 3-6 gaps maximum. Focus on the most important missing qualifications.`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Anthropic API error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.error?.message || 'Failed to call Anthropic API' 
      });
    }

    const data = await response.json();
    const content = data.content.find(c => c.type === 'text')?.text || '';
    
    // Clean and parse JSON
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    
    return res.status(200).json({ gaps: parsed.gaps || [] });
  } catch (error) {
    console.error('Gaps error:', error);
    return res.status(500).json({ 
      error: 'Failed to analyze gaps', 
      details: error.message 
    });
  }
}