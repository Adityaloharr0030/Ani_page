/**
 * OpenAI API utility functions
 */
const axios = require('axios');

async function callOpenAIChat({ 
  messages, 
  model = 'gpt-4o-mini', 
  max_tokens = 1024,
  temperature = 0.7,
  apiKeyOverride = null,
  stream = false,
  organization = null,
  project = null
}) {
  const apiKey = apiKeyOverride || process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured');
  }
  
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  const orgId = organization || process.env.OPENAI_ORG_ID || null;
  const projectId = project || process.env.OPENAI_PROJECT_ID || null;
  if (orgId) headers['OpenAI-Organization'] = orgId;
  if (projectId) headers['OpenAI-Project'] = projectId;
  
  const body = {
    model,
    messages,
    max_tokens,
    temperature,
    stream
  };
  
  if (stream) {
    return axios.post(url, body, {
      headers,
      responseType: 'stream'
    });
  }
  
  const response = await axios.post(url, body, { headers });
  return response.data.choices[0].message.content;
}

module.exports = {
  callOpenAIChat
};

