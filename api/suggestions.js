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

  const { resumeText } = req.body;

  if (!resumeText) {
    return res.status(400).json({ error: 'Missing resumeText' });
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
        max_tokens: 1500,
        messages: [{
          role: "user",
          content: `Provide 4-6 specific, actionable improvement suggestions for this resume. Focus on content, wording, and impact. Return as a numbered list.

Resume:
${resumeText}`
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
    
    // Parse numbered list into array
    const suggestionList = content
      .split('\n')
      .filter(line => /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    return res.status(200).json({ suggestions: suggestionList });
  } catch (error) {
    console.error('Suggestions error:', error);
    return res.status(500).json({ 
      error: 'Failed to get suggestions', 
      details: error.message 
    });
  }
}