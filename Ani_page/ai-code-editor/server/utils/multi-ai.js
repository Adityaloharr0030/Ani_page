// Multi-Model AI System 
const aiModels = { 
  openai: { name: 'OpenAI GPT', endpoint: 'https://api.openai.com/v1/chat/completions' }, 
  perplexity: { name: 'Perplexity', endpoint: 'https://api.perplexity.ai/chat/completions' }, 
  claude: { name: 'Claude', endpoint: 'https://api.anthropic.com/v1/messages' }, 
  gemini: { name: 'Gemini', endpoint: 'https://generativelanguage.googleapis.com/v1/models' } 
}; 
module.exports = { aiModels }; 

