/**
 * Code formatting and validation routes
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { formatCode, validateCode } = require('../utils/formatter');

/**
 * Format code endpoint
 */
router.post('/format', auth, async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Code is required',
      });
    }

    const formatted = await formatCode(code, language);

    res.json({
      ok: true,
      formatted,
      message: `Code formatted successfully as ${language}`,
    });
  } catch (error) {
    console.error('Format error:', error);
    res.status(500).json({
      ok: false,
      error: 'Formatting failed',
      details: error.message,
    });
  }
});

/**
 * Validate code endpoint
 */
router.post('/validate', auth, async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Code is required',
      });
    }

    const validation = validateCode(code, language);

    res.json({
      ok: validation.valid,
      valid: validation.valid,
      error: validation.error || null,
      message: validation.valid
        ? `${language} code is valid`
        : `Validation error in ${language}`,
    });
  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({
      ok: false,
      error: 'Validation failed',
      details: error.message,
    });
  }
});

/**
 * Format and validate together
 */
router.post('/format-and-validate', auth, async (req, res) => {
  try {
    const { code, language = 'javascript' } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Code is required',
      });
    }

    // Validate first
    const validation = validateCode(code, language);
    if (!validation.valid) {
      return res.json({
        ok: false,
        valid: false,
        error: validation.error,
        formatted: null,
        message: `Cannot format invalid ${language}`,
      });
    }

    // Then format if valid
    const formatted = await formatCode(code, language);

    res.json({
      ok: true,
      valid: true,
      formatted,
      message: `${language} code formatted and validated successfully`,
    });
  } catch (error) {
    console.error('Format and validate error:', error);
    res.status(500).json({
      ok: false,
      error: 'Operation failed',
      details: error.message,
    });
  }
});

module.exports = router;

