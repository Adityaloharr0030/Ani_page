/**
 * Enhanced Perplexity API utility with improved prompts and response handling
 */
const axios = require("axios");

async function callPerplexity({ query, apiKeyOverride = null, mode = "search", modelOverride = null }) {
  const apiKey = apiKeyOverride || process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error("Perplexity API key not configured");
  }

  const url = "https://api.perplexity.ai/chat/completions";
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  // Enhanced system prompts based on mode
  const systemPrompts = {
    search: "You are a knowledgeable assistant that provides accurate, well-structured information. Format your responses clearly with headings, bullet points, and examples where appropriate. Be comprehensive but concise.",

    code: "You are an expert programmer. When explaining code or generating solutions, provide clear explanations, use proper formatting, include comments, and follow best practices. Structure your response with clear sections.",

    research: "You are a research assistant. Provide detailed, accurate information with proper structure. Use headings, subheadings, and organize information logically. Include practical examples and actionable insights.",

    explanation: "You are a technical educator. Break down complex topics into understandable parts. Use analogies, examples, and clear explanations. Structure your response with clear sections and bullet points."
  };

  const systemPrompt = systemPrompts[mode] || systemPrompts.search;

  // Enhanced query formatting
  const enhancedQuery = formatQueryForMode(query, mode);

  const body = {
    model: modelOverride || process.env.PERPLEXITY_MODEL || "sonar",
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: enhancedQuery,
      },
    ],
    max_tokens: 2048,
    temperature: 0.1, // Lower temperature for more consistent responses
    top_p: 0.9,
  };

  try {
    const response = await axios.post(url, body, {
      headers,
      timeout: 30000 // 30 second timeout
    });

    if (response.data && response.data.choices && response.data.choices[0]) {
      let content = response.data.choices[0].message.content;

      // Post-process the response for better formatting
      content = enhanceResponseFormatting(content);

      return content;
    } else {
      throw new Error("Invalid response format from Perplexity API");
    }
  } catch (error) {
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      // Enhanced error handling with specific messages
      if (status === 401) {
        throw new Error("Invalid Perplexity API key. Please check your API key at https://www.perplexity.ai/settings/api");
      } else if (status === 429) {
        throw new Error("Perplexity API rate limit exceeded. Please wait a moment and try again.");
      } else if (status === 400) {
        const errorMsg = errorData?.error?.message || "Bad request to Perplexity API";
        throw new Error(`Perplexity API error: ${errorMsg}`);
      } else {
        throw new Error(`Perplexity API error (${status}): ${errorData?.error?.message || 'Unknown error'}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error("Perplexity API request timeout. Please try again.");
    } else {
      throw new Error(`Network error connecting to Perplexity: ${error.message}`);
    }
  }
}

function formatQueryForMode(query, mode) {
  switch (mode) {
    case "code":
      return `As a programming expert, ${query}. Please provide a comprehensive answer with code examples, explanations, and best practices.`;

    case "research":
      return `Provide detailed research on: ${query}. Include key concepts, current trends, practical applications, and relevant examples.`;

    case "explanation":
      return `Explain in detail: ${query}. Break it down into clear sections with examples and make it easy to understand.`;

    case "search":
    default:
      return `${query}. Please provide a well-structured, comprehensive answer.`;
  }
}

function enhanceResponseFormatting(content) {
  // Clean up and enhance the response formatting
  let enhanced = content;

  // Ensure proper spacing after headings
  enhanced = enhanced.replace(/^(#{1,6}\s+.+)$/gm, '$1\n');

  // Ensure proper spacing around bullet points
  enhanced = enhanced.replace(/^(\s*[-*+]\s+.+)$/gm, '$1\n');

  // Clean up excessive line breaks
  enhanced = enhanced.replace(/\n{3,}/g, '\n\n');

  // Ensure code blocks have proper spacing
  enhanced = enhanced.replace(/```(\w+)?\n/g, '\n```$1\n');
  enhanced = enhanced.replace(/\n```$/gm, '\n```\n');

  return enhanced.trim();
}

// Enhanced function for code-specific queries
async function callPerplexityForCode({ prompt, language = "javascript", perplexityKey = null, model = null }) {
  const codeQuery = `Generate clean, well-commented ${language} code for: ${prompt}.

Requirements:
- Provide complete, working code
- Include clear comments explaining the logic
- Follow ${language} best practices and conventions
- Add error handling where appropriate
- Explain key concepts if complex

Format the response with:
1. Brief explanation of the approach
2. Complete code with comments
3. Usage example if applicable
4. Any important notes or considerations`;

  return await callPerplexity({
    query: codeQuery,
    apiKeyOverride: perplexityKey,
    mode: "code",
    modelOverride: model
  });
}

// Enhanced function for research queries
async function callPerplexityForResearch({ query, perplexityKey = null, model = null }) {
  return await callPerplexity({
    query: query,
    apiKeyOverride: perplexityKey,
    mode: "research",
    modelOverride: model
  });
}

// Enhanced function for explanations
async function callPerplexityForExplanation({ topic, code = null, perplexityKey = null, model = null }) {
  let explanationQuery;

  if (code) {
    explanationQuery = `Explain this code in detail: ${topic}

Code to analyze:
\`\`\`
${code}
\`\`\`

Please provide:
1. Overview of what the code does
2. Step-by-step breakdown of the logic
3. Explanation of key concepts and patterns used
4. Potential improvements or considerations
5. Common use cases or applications`;
  } else {
    explanationQuery = `Provide a comprehensive explanation of: ${topic}

Please structure your response with:
1. Clear definition and overview
2. Key concepts and components
3. How it works (step-by-step if applicable)
4. Practical examples
5. Common use cases and best practices
6. Important considerations or limitations`;
  }

  return await callPerplexity({
    query: explanationQuery,
    apiKeyOverride: perplexityKey,
    mode: "explanation",
    modelOverride: model
  });
}

module.exports = {
  callPerplexity,
  callPerplexityForCode,
  callPerplexityForResearch,
  callPerplexityForExplanation,
};

