/**
 * Enhanced AI routes with better error handling, caching, and streaming
 */
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const fs = require('fs');
const path = require('path');
const { callOpenAIChat } = require("../utils/openai");
const {
  callPerplexity,
  callPerplexityForCode,
  callPerplexityForResearch,
  callPerplexityForExplanation
} = require("../utils/perplexity");
const { sanitizeInput } = require("../utils/sanitize");

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

// Ensure uploads directory exists and provide helper to load from disk
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
function ensureUploadsDir() {
  try {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function loadUploadsFromDisk(app) {
  ensureUploadsDir();
  try {
    const files = fs.readdirSync(UPLOADS_DIR).filter((f) => f.endsWith('.json'));
    if (!app.locals.uploads) app.locals.uploads = {};
    for (const fn of files) {
      try {
        const content = fs.readFileSync(path.join(UPLOADS_DIR, fn), 'utf8');
        const parsed = JSON.parse(content);
        if (parsed && parsed.id) app.locals.uploads[parsed.id] = parsed;
      } catch (e) {
        console.error('Failed to load upload file', fn, e && e.message);
      }
    }
  } catch (e) {
    // no-op
  }
}

// Validate keys with caching
router.post("/auth/validate-keys", auth, async (req, res) => {
  const cache = req.app.locals.cache;
  const { openaiKey } = req.body;
  const cacheKey = `validate_${openaiKey?.substring(0, 10)}`;

  // Check cache first
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json({ ok: true, cached: true });
  }

  try {
    await callOpenAIChat({
      messages: [{ role: "user", content: 'Respond with just "ok"' }],
      max_tokens: 5,
      apiKeyOverride: openaiKey,
    });

    cache.set(cacheKey, true, 300); // Cache for 5 minutes
    res.json({ ok: true, provider: "openai" });
  } catch (err) {
    res.status(401).json({
      ok: false,
      error: "Invalid API key or service unavailable",
    });
  }
});

// Enhanced code generation with streaming support
router.post("/generate-code", auth, validatePrompt, async (req, res) => {
  try {
    const {
      prompt,
      model = "gpt-4o",
      openaiKey,
      perplexityKey,
      language = "javascript",
      stream = false,
    } = req.body;
    const sanitized = sanitizeInput(prompt);

    // Check which API keys are available
    const hasOpenAI = openaiKey || process.env.OPENAI_API_KEY;
    const hasPerplexity = perplexityKey || process.env.PERPLEXITY_API_KEY;

    if (!hasOpenAI && !hasPerplexity) {
      return res.status(400).json({
        ok: false,
        error: "No AI API keys configured",
        help: {
          message:
            "To use AI features, you need either OpenAI or Perplexity API keys",
          openai: "Get OpenAI key: https://platform.openai.com/api-keys",
          perplexity:
            "Get Perplexity key: https://www.perplexity.ai/settings/api",
          setup: "Add keys to your .env file or pass them in the request",
        },
      });
    }

    // Try OpenAI first if available
    if (hasOpenAI) {
      try {
        const systemPrompt = `You are an expert senior programmer with 15+ years of experience.

Your task: Generate the BEST possible ${language} code.

REQUIREMENTS:
1. Code Quality:
   - Write clean, readable, well-structured code
   - Use meaningful variable and function names
   - Follow industry best practices and conventions
   - Add helpful comments for complex logic
   - Include proper error handling and validation

2. Best Practices:
   - Use modern language features and patterns
   - Optimize for performance and maintainability
   - Include edge case handling
   - Avoid common anti-patterns

3. Documentation:
   - Add JSDoc/docstring comments where appropriate
   - Explain non-obvious logic with inline comments
   - Include usage examples for functions/components

4. Output Format:
   - Return ONLY the code, no explanations before/after
   - Ready to run/use immediately
   - All imports/dependencies included
   - No placeholder comments like "your code here"

Generate production-ready code that developers would be proud to use.`;

        const messages = [
          { role: "system", content: systemPrompt },
          { role: "user", content: sanitized },
        ];

        if (stream) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");

          const axiosStream = await callOpenAIChat({
            messages,
            model,
            apiKeyOverride: openaiKey,
            stream: true,
            max_tokens: 2048,
          });

          axiosStream.data.on("data", (chunk) => {
            res.write(`data: ${chunk.toString()}\n\n`);
          });

          axiosStream.data.on("end", () => {
            res.write("event: done\ndata: done\n\n");
            res.end();
          });

          return;
        }

        const resp = await callOpenAIChat({
          messages,
          model,
          apiKeyOverride: openaiKey,
          max_tokens: 2048,
          temperature: 0.3,
        });

        res.json({ ok: true, resp, provider: "openai" });
        return;
      } catch (openaiError) {
        console.log("OpenAI failed:", openaiError.message);

        // If OpenAI fails and we have Perplexity, try it as fallback
        if (hasPerplexity) {
          try {
            const resp = await callPerplexityForCode({
              prompt: sanitized,
              language,
              perplexityKey,
            });

            res.json({
              ok: true,
              resp,
              provider: "perplexity",
              note: "Generated using Perplexity AI with enhanced prompts",
            });
            return;
          } catch (perplexityError) {
            console.log("Perplexity fallback failed:", perplexityError.message);
          }
        }

        // If we get here, OpenAI failed and either no Perplexity or it failed too
        const errorMsg = openaiError.message.toLowerCase();
        if (errorMsg.includes("quota") || errorMsg.includes("429")) {
          return res.status(429).json({
            ok: false,
            error: "OpenAI quota exceeded",
            help: {
              message: "Your OpenAI usage limit has been reached",
              solutions: [
                "Check your billing at https://platform.openai.com/account/billing",
                "Add payment method if needed",
                "Wait for quota reset",
                "Try using Perplexity API as alternative",
              ],
            },
          });
        } else if (
          errorMsg.includes("401") ||
          errorMsg.includes("unauthorized")
        ) {
          return res.status(401).json({
            ok: false,
            error: "Invalid OpenAI API key",
            help: {
              message: "Your OpenAI API key is invalid or expired",
              solution:
                "Get a new key from https://platform.openai.com/api-keys",
            },
          });
        } else {
          return res.status(500).json({
            ok: false,
            error: `OpenAI error: ${openaiError.message}`,
            fallback: hasPerplexity
              ? "Perplexity also failed"
              : "No fallback API available",
          });
        }
      }
    }

    // If we only have Perplexity, try it directly
    if (hasPerplexity && !hasOpenAI) {
      try {
        const resp = await callPerplexityForCode({
          prompt: sanitized,
          language,
          perplexityKey,
        });

        res.json({
          ok: true,
          resp,
          provider: "perplexity",
          note: "Generated using enhanced Perplexity AI"
        });
        return;
      } catch (perplexityError) {
        return res.status(500).json({
          ok: false,
          error: "Perplexity API error",
          details: perplexityError.message,
          help: {
            message: "Check your Perplexity API key and model configuration",
            docs: "https://docs.perplexity.ai/getting-started/models",
            key: "Get key from https://www.perplexity.ai/settings/api",
          },
        });
      }
    }
  } catch (error) {
    console.error("generate-code error:", error);
    res.status(500).json({
      ok: false,
      error: "Internal server error",
      details: error.message,
    });
  }
});

// Enhanced code explanation
router.post("/explain-code", auth, validatePrompt, async (req, res) => {
  try {
    const {
      code,
      question = "Explain what this code does",
      openaiKey,
      perplexityKey,
    } = req.body;
    const sanitizedCode = sanitizeInput(code);
    const sanitizedQuestion = sanitizeInput(question);

    try {
      // Try OpenAI first
      const prompt = `Analyze and explain this code thoroughly. ${sanitizedQuestion}

Provide a comprehensive analysis:
1. **Purpose**: What does this code do?
2. **Key Components**: Main functions/classes and their responsibilities
3. **How It Works**: Step-by-step execution flow
4. **Important Details**: Key logic and algorithms used
5. **Best Practices**: Whether code follows best practices
6. **Potential Issues**: Any bugs, security issues, or performance concerns
7. **Improvements**: Suggestions for optimization or better approaches

Format your response clearly with sections and examples. Be detailed but concise.

Code:
\`\`\`
${sanitizedCode}
\`\`\``;

      const messages = [
        {
          role: "system",
          content:
            "You are an expert code analyst with deep knowledge of programming patterns, best practices, and performance optimization. Provide clear, structured, detailed explanations that help developers understand code deeply.",
        },
        { role: "user", content: prompt },
      ];

      const resp = await callOpenAIChat({
        messages,
        model: "gpt-4o",
        apiKeyOverride: openaiKey,
        max_tokens: 1500,
        temperature: 0.2,
      });

      res.json({ ok: true, resp, provider: "openai" });
    } catch (openaiError) {
      // Fallback to Perplexity
      console.log(
        "OpenAI failed, trying Perplexity for code explanation:",
        openaiError.message,
      );

      const resp = await callPerplexityForExplanation({
        topic: sanitizedQuestion,
        code: sanitizedCode,
        perplexityKey,
      });

      res.json({
        ok: true,
        resp,
        provider: "perplexity",
        note: "Explained using enhanced Perplexity AI",
      });
    }
  } catch (error) {
    console.error("explain-code error:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Enhanced research with Perplexity
router.post("/research", auth, validatePrompt, async (req, res) => {
  const cache = req.app.locals.cache;
  try {
    const { query, perplexityKey } = req.body;
    const sanitized = sanitizeInput(query);
    const cacheKey = `research_${Buffer.from(sanitized).toString("base64").substring(0, 20)}`;

    // Check if we have a Perplexity key
    const hasPerplexity = perplexityKey || process.env.PERPLEXITY_API_KEY;

    if (!hasPerplexity) {
      return res.status(400).json({
        ok: false,
        error: "Perplexity API key required for research",
        help: {
          message: "Research feature requires Perplexity API key",
          getKey: "https://www.perplexity.ai/settings/api",
          setup: "Add PERPLEXITY_API_KEY to your .env file",
        },
      });
    }

    // Check cache
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json({ ok: true, resp: cached, cached: true });
    }

    try {
      const resp = await callPerplexityForResearch({
        query: sanitized,
        perplexityKey,
      });

      cache.set(cacheKey, resp, 1800); // Cache for 30 minutes
      res.json({
        ok: true,
        resp,
        provider: "perplexity",
        note: "Research powered by enhanced Perplexity AI"
      });
    } catch (perplexityError) {
      console.error("Perplexity API error:", perplexityError);

      const errorMsg = perplexityError.message || "";
      const responseError = perplexityError.response?.data?.error;

      if (responseError?.message?.includes("Invalid model")) {
        return res.status(400).json({
          ok: false,
          error: "Invalid Perplexity model configuration",
          help: {
            message: "The configured model is not supported",
            docs: "Check supported models at https://docs.perplexity.ai/getting-started/models",
            currentModel: "llama-3.1-sonar-small-128k-online",
            suggestion: "Try updating to a supported model name",
          },
        });
      } else if (
        responseError?.code === 401 ||
        errorMsg.includes("unauthorized")
      ) {
        return res.status(401).json({
          ok: false,
          error: "Invalid Perplexity API key",
          help: {
            message: "Your Perplexity API key is invalid or expired",
            getKey: "https://www.perplexity.ai/settings/api",
          },
        });
      } else {
        return res.status(500).json({
          ok: false,
          error: "Perplexity API temporarily unavailable",
          details: responseError?.message || errorMsg,
          help: {
            message: "Please try again in a moment",
            docs: "https://docs.perplexity.ai/",
          },
        });
      }
    }
  } catch (err) {
    console.error("research error:", err);
    res.status(500).json({
      ok: false,
      error: "Internal server error",
      details: err.message,
    });
  }
});

// Enhanced bug fixing
router.post("/fix-bug", auth, validatePrompt, async (req, res) => {
  try {
    const { code, context = "", error = "", openaiKey } = req.body;
    const sanitizedCode = sanitizeInput(code);
    const sanitizedContext = sanitizeInput(context);
    const sanitizedError = sanitizeInput(error);

    const prompt = `Debug and fix this code. Your goal is to return PERFECT, working code.

Problem Context: ${sanitizedContext || "Fix all bugs and errors"}
${sanitizedError ? `Error Message: ${sanitizedError}` : "Identify and fix all issues"}

Your Task:
1. **Identify All Issues**: Logic errors, syntax errors, runtime errors, edge cases
2. **Fix Each Issue**: Provide corrected code with explanations
3. **Preserve Functionality**: Keep the original intent and behavior
4. **Improve Quality**: While fixing, also improve code quality
5. **Document Changes**: Add comments explaining what was fixed

Fix Quality Checklist:
- ✓ All errors corrected
- ✓ Edge cases handled
- ✓ Input validation included
- ✓ Error handling robust
- ✓ Code follows best practices
- ✓ Performance optimized

Return ONLY the corrected, production-ready code with fix comments.

Buggy Code:
\`\`\`
${sanitizedCode}
\`\`\``;

    const messages = [
      {
        role: "system",
        content:
          "You are an expert debugger. Fix code carefully and explain changes.",
      },
      { role: "user", content: prompt },
    ];

    const result = await callOpenAIChat({
      messages,
      max_tokens: 2048,
      apiKeyOverride: openaiKey,
      temperature: 0.2,
    });

    res.json({ ok: true, result });
  } catch (err) {
    console.error("fix-bug error:", err);
    res.status(500).json({
      ok: false,
      error: err.response?.data?.error?.message || err.message,
    });
  }
});

// Code optimization
router.post("/optimize-code", auth, validatePrompt, async (req, res) => {
  try {
    const { code, focusArea = "performance", openaiKey } = req.body;
    const sanitized = sanitizeInput(code);

    const prompt = `Optimize this code comprehensively.

Focus Area: ${focusArea} (performance, readability, maintainability, bundle-size, etc.)

Optimization Goals:
1. **Performance**: Faster execution, reduced memory usage, efficient algorithms
2. **Readability**: Clear structure, meaningful names, easy to understand
3. **Maintainability**: Easier to modify, test, and debug
4. **Best Practices**: Modern patterns, proper error handling, clean architecture

Your Task:
1. Analyze the current code for optimization opportunities
2. Apply advanced optimization techniques
3. Maintain or improve functionality
4. Add detailed comments explaining each optimization
5. Show performance improvement metrics if applicable

Optimization Checklist:
- ✓ Algorithm efficiency improved
- ✓ Resource usage optimized
- ✓ Code duplication eliminated
- ✓ Unnecessary computations removed
- ✓ Best patterns applied
- ✓ Edge cases preserved

Return the fully optimized, production-ready code with optimization comments.

Original Code:
\`\`\`
${sanitized}
\`\`\``;

    const messages = [
      { role: "system", content: "You are a performance optimization expert." },
      { role: "user", content: prompt },
    ];

    const result = await callOpenAIChat({
      messages,
      max_tokens: 2048,
      apiKeyOverride: openaiKey,
    });

    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Code review
router.post("/review-code", auth, validatePrompt, async (req, res) => {
  try {
    const { code, openaiKey } = req.body;
    const sanitized = sanitizeInput(code);

    const prompt = `Perform a comprehensive, professional code review.

Review Criteria:
1. **Code Quality**: Structure, readability, maintainability
2. **Best Practices**: Industry standards, design patterns
3. **Performance**: Efficiency, optimization opportunities
4. **Security**: Vulnerabilities, injection risks, data handling
5. **Testing**: Testability, edge cases, error handling
6. **Documentation**: Comments, clarity, documentation

Detailed Analysis Required:
- Identify strengths and positive aspects
- Point out all potential issues with severity (critical/major/minor)
- Provide specific improvement suggestions with examples
- Rate code quality (1-10) with explanation
- List priority recommendations

Format Response As:
1. **Overall Quality**: Rating and summary
2. **Strengths**: What's done well
3. **Issues Found**: 
   - Critical: Must fix
   - Major: Should fix
   - Minor: Nice to improve
4. **Security Analysis**: Any security concerns
5. **Performance Analysis**: Optimization opportunities
6. **Recommendations**: Top 5 actionable improvements
7. **Example Improvements**: Show before/after for key suggestions

Be thorough, professional, and constructive.

Code to Review:
\`\`\`
${sanitized}
\`\`\``;

    const messages = [
      {
        role: "system",
        content:
          "You are a senior code reviewer with expertise in security and best practices.",
      },
      { role: "user", content: prompt },
    ];

    const result = await callOpenAIChat({
      messages,
      max_tokens: 1500,
      apiKeyOverride: openaiKey,
    });

    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

  // Accept project snapshot uploads for testing / analysis
  router.post('/upload', express.json(), async (req, res) => {
    try {
      const snapshot = req.body;

      // Optional server-side upload API key protection
      const configuredKey = process.env.UPLOAD_API_KEY;
      if (configuredKey) {
        const provided = (req.headers['x-upload-key'] || '').toString();
        if (!provided || provided !== configuredKey) {
          return res.status(401).json({ ok: false, error: 'Missing or invalid upload key' });
        }
      }

      if (!snapshot || !Array.isArray(snapshot.files)) {
        return res.status(400).json({ ok: false, error: 'Invalid snapshot payload' });
      }

      // Basic validation limits
      const MAX_FILES = Number(process.env.UPLOAD_MAX_FILES) || 200;
      const MAX_TOTAL_CHARS = Number(process.env.UPLOAD_MAX_CHARS) || 200000; // 200k chars

      if (snapshot.files.length > MAX_FILES) {
        return res.status(413).json({ ok: false, error: `Too many files (max ${MAX_FILES})` });
      }

      let totalChars = 0;
      for (const f of snapshot.files) {
        const content = (f && f.content) ? String(f.content) : '';
        totalChars += content.length;
        if (totalChars > MAX_TOTAL_CHARS) {
          return res.status(413).json({ ok: false, error: `Snapshot too large (max ${MAX_TOTAL_CHARS} chars)` });
        }
      }

      // store in memory (for demo/testing) and return an id
      if (!req.app.locals.uploads) req.app.locals.uploads = {};

      const crypto = require('crypto');
      const id = crypto.randomUUID ? crypto.randomUUID() : `upload-${Date.now()}`;

      // sanitize filenames and compute checksum (sha256)
      const sanitizedFiles = snapshot.files.map((f) => ({
        name: (f && f.name) ? String(f.name).replace(/\\|\/+|\0/g, '_') : 'unnamed',
        size: (f && f.content) ? String(f.content).length : 0,
      }));

      const hash = crypto.createHash('sha256');
      for (const f of snapshot.files) {
        hash.update((f && f.content) ? String(f.content) : '');
      }
      const checksum = hash.digest('hex');

      // privacy: don't store raw IP, store hashed IP if available
      let ipHash = null;
      try {
        if (req.ip) {
          const ipHashObj = crypto.createHash('sha256');
          ipHashObj.update(String(req.ip));
          ipHash = ipHashObj.digest('hex').slice(0, 16); // truncated
        }
      } catch (e) {
        ipHash = null;
      }

      const storeContent = process.env.ALLOW_UPLOAD_CONTENT === 'true';

      req.app.locals.uploads[id] = {
        id,
        projectName: snapshot.projectName || 'unnamed',
        receivedAt: new Date().toISOString(),
        files: sanitizedFiles,
        totalFiles: snapshot.files.length,
        totalChars,
        checksum,
        ipHash,
        storedContent: storeContent ? snapshot.files.map((f) => ({ name: f.name, content: f.content })) : undefined,
      };

      // persist to disk (safe local storage for dev)
      try {
        ensureUploadsDir();
        const filePath = path.join(UPLOADS_DIR, `${id}.json`);
        fs.writeFileSync(filePath, JSON.stringify(req.app.locals.uploads[id], null, 2), 'utf8');
      } catch (e) {
        console.error('Failed to persist upload to disk:', e && e.message);
      }

      // Do not echo back raw snapshot to client to avoid leaking secrets
      res.json({ ok: true, id, message: 'Snapshot received', totalFiles: snapshot.files.length, totalChars, checksum });
    } catch (err) {
      console.error('Snapshot upload error:', err.message || err);
      res.status(500).json({ ok: false, error: 'Internal server error' });
    }
  });

  // Dev helper: list stored uploads (only in non-production)
  router.get('/uploads', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Not allowed' });
    }
    // load from disk if needed
    if ((!req.app.locals.uploads || Object.keys(req.app.locals.uploads).length === 0)) {
      loadUploadsFromDisk(req.app);
    }
    const uploads = req.app.locals.uploads || {};
    const keys = Object.keys(uploads).map((k) => ({ id: k, receivedAt: uploads[k].receivedAt, projectName: uploads[k].projectName, totalFiles: uploads[k].totalFiles, totalChars: uploads[k].totalChars }));
    res.json({ ok: true, uploads: keys });
  });

  router.get('/uploads/:id', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ ok: false, error: 'Not allowed' });
    }
    // ensure uploads loaded
    if ((!req.app.locals.uploads || Object.keys(req.app.locals.uploads).length === 0)) {
      loadUploadsFromDisk(req.app);
    }
    const uploads = req.app.locals.uploads || {};
    const entry = uploads[req.params.id];
    if (!entry) return res.status(404).json({ ok: false, error: 'Not found' });
    // Only return full content when explicitly enabled
    if (process.env.ALLOW_UPLOAD_CONTENT === 'true') {
      return res.json({ ok: true, entry });
    }

    // otherwise, redact the storedContent field
    const { storedContent, ...meta } = entry;
    res.json({ ok: true, entry: meta, note: 'Content redacted. Set ALLOW_UPLOAD_CONTENT=true to include content (dev only).' });
  });

module.exports = router;
