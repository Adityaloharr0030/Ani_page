// Route to test automatic fallback when primary key fails
// GET /api/ai/fallback-test
// Returns the response from the first successful model after forcing the primary to error

const express = require('express');
const router = express.Router();
const { callAI, getModelStatus } = require('../utils/modelSelector');

router.get('/fallback-test', async (req, res) => {
    // Simulate primary key failure by temporarily clearing the first model's API key
    const originalOpenAIKey = process.env.OPENAI_API_KEY;
    process.env.OPENAI_API_KEY = '';

    try {
        const result = await callAI('code-generation', [{ role: 'user', content: 'Write a hello world function in JavaScript.' }]);
        res.json({ ok: true, result, fallbackUsed: true, modelStatus: getModelStatus() });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message, modelStatus: getModelStatus() });
    } finally {
        // Restore original key
        process.env.OPENAI_API_KEY = originalOpenAIKey;
    }
});

module.exports = router;
