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

  const { pdfBase64 } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ error: 'No PDF data provided' });
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
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdfBase64
              }
            },
            {
              type: "text",
              text: "Extract all text content from this resume PDF and return it as plain text. Include all sections: contact info, summary, experience, education, skills, certifications, etc."
            }
          ]
        }]
      })
    });

    const data = await response.json();
    const extractedText = data.content?.find(c => c.type === 'text')?.text || '';
    
    return res.status(200).json({ text: extractedText });
  } catch (error) {
    console.error('PDF extraction error:', error);
    return res.status(500).json({ 
      error: 'Failed to extract PDF text',
      details: error.message 
    });
  }
}
