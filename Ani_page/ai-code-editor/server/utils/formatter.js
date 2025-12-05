/**
 * Code formatting utility
 * Handles automatic formatting for different code types
 */
const prettier = require('prettier');
const beautify = require('js-beautify');

/**
 * Format code based on language type
 * @param {string} code - The code to format
 * @param {string} language - Language type (html, javascript, css, json, etc)
 * @returns {string} Formatted code
 */
async function formatCode(code, language = 'javascript') {
  try {
    // Remove any HTML comments that were added during text extraction
    let cleaned = code.replace(/<!--[\s\S]*?-->\n?/g, '').trim();

    // Try using Prettier first (supports most languages)
    try {
      const parserMap = {
        javascript: 'babel',
        js: 'babel',
        jsx: 'babel',
        typescript: 'typescript',
        ts: 'typescript',
        tsx: 'typescript',
        html: 'html',
        css: 'css',
        scss: 'scss',
        less: 'less',
        json: 'json',
        markdown: 'markdown',
        md: 'markdown',
      };

      const parser = parserMap[language] || 'babel';

      const formatted = await prettier.format(cleaned, {
        parser,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
        tabWidth: 2,
        useTabs: false,
        printWidth: 100,
        arrowParens: 'always',
      });

      return formatted.trim();
    } catch (prettierError) {
      console.log(`Prettier formatting failed for ${language}:`, prettierError.message);

      // Fallback to js-beautify for HTML/CSS/JS
      if (language === 'html') {
        return beautify.html(cleaned, {
          indent_size: 2,
          indent_char: ' ',
          wrap_line_length: 100,
          preserve_newlines: true,
          max_preserve_newlines: 2,
        });
      } else if (language === 'css' || language === 'scss') {
        return beautify.css(cleaned, {
          indent_size: 2,
          indent_char: ' ',
        });
      } else if (language === 'javascript' || language === 'js' || language === 'jsx') {
        return beautify.js(cleaned, {
          indent_size: 2,
          indent_char: ' ',
          preserve_newlines: true,
          max_preserve_newlines: 2,
          space_before_conditional: true,
        });
      }

      return cleaned;
    }
  } catch (error) {
    console.error('Code formatting error:', error);
    // Return original code if formatting fails
    return code;
  }
}

/**
 * Validate code syntax
 * @param {string} code - Code to validate
 * @param {string} language - Language type
 * @returns {object} Validation result {valid: boolean, error?: string}
 */
function validateCode(code, language) {
  try {
    if (language === 'json') {
      JSON.parse(code);
      return { valid: true };
    }

    if (language === 'javascript' || language === 'js' || language === 'jsx') {
      // Basic JavaScript validation
      try {
        new Function(code);
        return { valid: true };
      } catch (e) {
        return { valid: false, error: e.message };
      }
    }

    if (language === 'html') {
      // Basic HTML validation - check for balanced tags
      const openTags = (code.match(/<[^/][^>]*>/g) || []).length;
      const closeTags = (code.match(/<\/[^>]+>/g) || []).length;
      if (openTags === closeTags || openTags === closeTags + 1) {
        return { valid: true };
      }
      return { valid: false, error: 'Unbalanced HTML tags' };
    }

    // For other languages, assume valid
    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get language from file extension
 * @param {string} filename - Filename with extension
 * @returns {string} Language type
 */
function getLanguageFromFilename(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const langMap = {
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    less: 'less',
    json: 'json',
    md: 'markdown',
    py: 'python',
    sql: 'sql',
  };
  return langMap[ext] || 'javascript';
}

module.exports = {
  formatCode,
  validateCode,
  getLanguageFromFilename,
};

