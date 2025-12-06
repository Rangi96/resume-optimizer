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

  const { role, company, requirement, context } = req.body;

  if (!role || !company || !requirement) {
    return res.status(400).json({ error: 'Missing required fields: role, company, or requirement' });
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
        max_tokens: 300,
        messages: [{
          role: "user",
          content: `Generate ONE professional resume bullet point for the role "${role}" at "${company}" that demonstrates this skill/requirement: "${requirement}".

The bullet point should:
- Start with a strong action verb
- Be specific and quantifiable if possible
- Sound authentic to someone who actually worked in this role
- Be 1-2 sentences maximum

${context ? `Context about the candidate's background:\n${context}\n\n` : ''}

Return ONLY the bullet point text. No prefix, no bullet symbol, no explanation.`
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
    
    // Clean up the bullet point (remove any leading bullet symbols or dashes)
    const bullet = content.trim().replace(/^[•\-\*]\s*/, '');
    
    return res.status(200).json({ bullet });
  } catch (error) {
    console.error('Generate bullet error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate bullet point', 
      details: error.message 
    });
  }
}