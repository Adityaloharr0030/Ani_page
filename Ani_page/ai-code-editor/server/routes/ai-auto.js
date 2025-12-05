const express = require('express');
const router = express.Router();
const { callAI, getModelStatus } = require('../utils/modelSelector');
const { sanitizeInput } = require('../utils/sanitize');

// Input validation middleware
const validatePrompt = (req, res, next) => {
    const { prompt, code, query } = req.body;
    const input = prompt || code || query;

    if (!input || typeof input !== "string") {
        return res.status(400).json({ error: "Invalid input" });
    }

    if (input.length > 10000) {
        return res
            .status(400)
            .json({ error: "Input too long (max 10000 characters)" });
    }

    next();
};

// Add this route to show model status
router.get('/models/status', (req, res) => {
    try {
        const status = getModelStatus();
        res.json({
            ok: true,
            models: status,
            autoMode: true,
            message: 'Auto-model selection enabled. Best model will be chosen automatically for each task.'
        });
    } catch (error) {
        res.status(500).json({ ok: false, error: error.message });
    }
});

// Enhanced generate-code route with auto-model selection
router.post('/generate-code-auto', validatePrompt, async (req, res) => {
    try {
        const { prompt, language = 'javascript' } = req.body;
        const sanitized = sanitizeInput(prompt);

        const systemPrompt = `You are an expert senior programmer with 15+ years of experience.

Your task: Generate the BEST possible ${language} code.

REQUIREMENTS:
1. **Chain of Thought**: Before writing code, briefly plan your approach in a comment block.
   - **CRITICAL**: Use correct comment syntax for ${language} (e.g., <!-- --> for HTML, // for JS, # for Python).
   - If generating HTML, ensure the comment is OUTSIDE the <!DOCTYPE html> tag or validly placed.

2. **Code Quality**:
   - Write clean, readable, well-structured code
   - Use meaningful variable and function names
   - Follow industry best practices and conventions
   - Add helpful comments for complex logic
   - Include proper error handling and validation

3. **Modern Standards**:
   - Use modern ES6+ syntax (arrow functions, const/let, async/await)
   - Optimize for performance and maintainability
   - Include edge case handling
   - Avoid common anti-patterns

4. **Documentation**:
   - Add JSDoc/docstring comments where appropriate
   - Explain non-obvious logic with inline comments
   - Include usage examples for functions/components

5. **Output Format**:
   - Return ONLY the code, no explanations before/after
   - Ready to run/use immediately
   - All imports/dependencies included
   - No placeholder comments like "your code here"
   - **CRITICAL**: Do NOT wrap HTML in JavaScript variables unless explicitly asked. Return raw HTML for web pages.

Generate production-ready code that developers would be proud to use.`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: sanitized }
        ];

        const code = await callAI('code-generation', messages);

        res.json({
            ok: true,
            code,
            message: '✨ Code generated with auto-selected model'
        });
    } catch (error) {
        console.error('Auto code generation error:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

// Enhanced explain-code route with auto-model selection
router.post('/explain-code-auto', validatePrompt, async (req, res) => {
    try {
        const { code } = req.body;
        const sanitized = sanitizeInput(code);

        const systemPrompt = `You are an expert code educator who makes complex concepts simple and fun to understand.

Analyze and explain the provided code following this structure:

1. **Overview** (2-3 sentences):
   - What does this code do at a high level?
   - What is its main purpose?

2. **EL5 (Explain Like I'm 5)** Analogy:
   - Compare the code to a real-world situation
   - Use simple, relatable examples
   - Make it fun and memorable!

3. **Line-by-Line Breakdown**:
   - Explain key parts of the code
   - Highlight important patterns or techniques
   - Point out any clever tricks or gotchas

4. **Key Concepts**:
   - What programming concepts are demonstrated?
   - Why were these approaches chosen?

Make your explanation clear, engaging, and educational!`;

        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Explain this code:\n\n${sanitized}` }
        ];

        const explanation = await callAI('explanation', messages);

        res.json({
            ok: true,
            explanation,
            message: '📚 Explanation generated with auto-selected model'
        });
    } catch (error) {
        console.error('Auto explain error:', error);
        res.status(500).json({
            ok: false,
            error: error.message
        });
    }
});

module.exports = router;
