// Intelligent Model Selection System
// Automatically chooses the best AI model based on task type

const axios = require('axios');

// Available models and their strengths
const MODELS = {
    GROQ: {
        name: 'Groq (Fast & Free)',
        endpoint: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        apiKey: process.env.GROQ_API_KEY,
        strengths: ['code-generation', 'explanation', 'debugging', 'optimization', 'general'],
        priority: 0
    },
    OPENAI: {
        name: 'OpenAI GPT-3.5-Turbo',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-3.5-turbo',
        apiKey: process.env.OPENAI_API_KEY,
        strengths: ['code-generation', 'explanation', 'debugging'],
        priority: 1
    },
    OPENROUTER: {
        name: 'OpenRouter',
        endpoint: 'https://openrouter.ai/api/v1/chat/completions',
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
        apiKey: process.env.OPENROUTER_API_KEY,
        strengths: ['code-generation', 'optimization', 'general'],
        priority: 2
    },
    GOOGLE: {
        name: 'Google Gemini',
        endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        model: 'gemini-pro',
        apiKey: process.env.GOOGLE_API_KEY,
        strengths: ['explanation', 'analysis'],
        priority: 3
    },
    PERPLEXITY: {
        name: 'Perplexity',
        endpoint: 'https://api.perplexity.ai/chat/completions',
        model: process.env.PERPLEXITY_MODEL || 'sonar',
        apiKey: process.env.PERPLEXITY_API_KEY,
        strengths: ['search', 'research'],
        priority: 4
    }
};

// Task types mapped to best models
const TASK_PREFERENCES = {
    'code-generation': ['GROQ', 'OPENAI', 'OPENROUTER', 'GOOGLE'],
    'explanation': ['GROQ', 'OPENAI', 'GOOGLE', 'OPENROUTER'],
    'debugging': ['GROQ', 'OPENAI', 'OPENROUTER', 'GOOGLE'],
    'optimization': ['GROQ', 'OPENAI', 'OPENROUTER', 'GOOGLE'],
    'search': ['PERPLEXITY', 'GROQ', 'GOOGLE'],
    'general': ['GROQ', 'OPENAI', 'OPENROUTER', 'GOOGLE']
};

/**
 * Select the best available model for a given task
 * @param {string} taskType - Type of task (code-generation, explanation, etc.)
 * @returns {Object} Selected model configuration
 */
function selectBestModel(taskType = 'general') {
    const preferences = TASK_PREFERENCES[taskType] || TASK_PREFERENCES.general;

    // Try each preferred model in order
    for (const modelKey of preferences) {
        const model = MODELS[modelKey];
        if (model && model.apiKey) {
            console.log(`🤖 Auto-selected: ${model.name} for ${taskType}`);
            return model;
        }
    }

    // Fallback: return first available model
    for (const modelKey in MODELS) {
        const model = MODELS[modelKey];
        if (model.apiKey) {
            console.log(`🤖 Fallback to: ${model.name}`);
            return model;
        }
    }

    throw new Error('No AI models available. Please configure at least one API key.');
}

/**
 * Make an AI API call with automatic model selection
 * @param {string} taskType - Type of task
 * @param {Array} messages - Chat messages
 * @param {Object} options - Additional options
 * @returns {Promise<string>} AI response
 */
async function callAI(taskType, messages, options = {}) {
    const model = selectBestModel(taskType);

    try {
        // Handle Google Gemini differently (different API format)
        if (model === MODELS.GOOGLE) {
            return await callGoogleGemini(messages, options);
        }

        // Standard OpenAI-compatible API call
        const response = await axios.post(
            model.endpoint,
            {
                model: model.model,
                messages: messages,
                temperature: options.temperature || 0.7,
                max_tokens: options.maxTokens || 2000
            },
            {
                headers: {
                    'Authorization': `Bearer ${model.apiKey}`,
                    'Content-Type': 'application/json',
                    ...(model === MODELS.OPENROUTER ? { 'HTTP-Referer': 'http://localhost:5173' } : {})
                },
                timeout: 30000
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error(`❌ ${model.name} failed:`, error.message);

        // Try fallback to next available model
        const fallbackModels = Object.values(MODELS).filter(m => m !== model && m.apiKey);
        if (fallbackModels.length > 0) {
            console.log('🔄 Trying fallback model...');
            // iterate through each fallback until success
            for (const fallback of fallbackModels) {
                try {
                    if (fallback === MODELS.GOOGLE) {
                        return await callGoogleGemini(messages, options);
                    }
                    const response = await axios.post(
                        fallback.endpoint,
                        {
                            model: fallback.model,
                            messages: messages,
                            temperature: options.temperature || 0.7,
                            max_tokens: options.maxTokens || 2000
                        },
                        {
                            headers: {
                                'Authorization': `Bearer ${fallback.apiKey}`,
                                'Content-Type': 'application/json'
                            },
                            timeout: 30000
                        }
                    );
                    return response.data.choices[0].message.content;
                } catch (fallbackError) {
                    console.warn(`⚠️ Fallback ${fallback.name} failed: ${fallbackError.message}`);
                    // continue to next fallback
                }
            }
            // If we exhausted all fallbacks
            throw new Error('All AI models failed. No fallback succeeded.');
        }

        // No fallback models configured
        throw error;
    }
}

/**
 * Call Google Gemini API (different format)
 */
async function callGoogleGemini(messages, options) {
    const prompt = messages.map(m => m.content).join('\n\n');

    const response = await axios.post(
        `${MODELS.GOOGLE.endpoint}?key=${MODELS.GOOGLE.apiKey}`,
        {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                maxOutputTokens: options.maxTokens || 2000
            }
        },
        {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        }
    );

    return response.data.candidates[0].content.parts[0].text;
}

/**
 * Get status of all configured models
 */
function getModelStatus() {
    const status = {};
    for (const [key, model] of Object.entries(MODELS)) {
        status[key] = {
            name: model.name,
            configured: !!model.apiKey,
            strengths: model.strengths
        };
    }
    return status;
}

module.exports = {
    selectBestModel,
    callAI,
    getModelStatus,
    TASK_TYPES: Object.keys(TASK_PREFERENCES)
};
