const axios = require('axios')

async function callGeminiGenerate({ prompt, model = 'gemini-1.5-flash', apiKeyOverride = null }) {
  const apiKey = apiKeyOverride || process.env.GOOGLE_API_KEY
  if (!apiKey) throw new Error('Google API key not configured')
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`
  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: String(prompt) }]
      }
    ]
  }
  const resp = await axios.post(url, body, { headers: { 'Content-Type': 'application/json' }, timeout: 30000 })
  const candidates = resp.data && resp.data.candidates
  const content = candidates && candidates[0] && candidates[0].content
  const parts = content && content.parts
  const text = parts && parts[0] && (parts[0].text || (parts[0].generatedText))
  if (!text) throw new Error('Invalid Gemini response')
  return text
}

module.exports = { callGeminiGenerate }