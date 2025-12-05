import React, { useState } from 'react';

const API_URL = '/api';

// Helper function to convert explanatory text to comments
const cleanResponseText = (text, mode) => {
  let cleaned = text.trim();

  if (mode === 'generate' || mode === 'optimize' || mode === 'fix') {
    // Check if text is HTML
    if (cleaned.includes('<!DOCTYPE') || cleaned.includes('<html')) {
      // Extract HTML content
      const htmlMatch = cleaned.match(/<!DOCTYPE[\s\S]*?<\/html>|<html[\s\S]*?<\/html>/i);
      if (htmlMatch) {
        return htmlMatch[0];
      }

      // If there's text before HTML, convert it to HTML comment
      const beforeHtml = cleaned.substring(0, cleaned.search(/<!DOCTYPE|<html/i));
      const htmlPart = cleaned.substring(cleaned.search(/<!DOCTYPE|<html/i));

      if (beforeHtml.trim()) {
        const comment = `<!-- ${beforeHtml.trim().replace(/-->/g, '').replace(/<!--/g, '')} -->\n`;
        return comment + htmlPart;
      }
      return htmlPart;
    }

    // Check if text is JavaScript
    if (cleaned.includes('function') || cleaned.includes('const ') || cleaned.includes('let ') || cleaned.includes('var ')) {
      const jsMatch = cleaned.match(/(function[\s\S]*|const[\s\S]*|let[\s\S]*|var[\s\S]*)/i);
      if (jsMatch) {
        const jsPart = jsMatch[0];
        const beforeJs = cleaned.substring(0, cleaned.indexOf(jsPart));

        if (beforeJs.trim()) {
          const comment = `// ${beforeJs.trim().replace(/\/\/+/g, '//')}\n`;
          return comment + jsPart;
        }
        return jsPart;
      }
    }

    // Check if text is CSS
    if (cleaned.includes('{') && cleaned.includes('}')) {
      const cssMatch = cleaned.match(/[\w\-\.#\[\]]+\s*\{[\s\S]*?\}/);
      if (cssMatch) {
        const cssPart = cssMatch[0];
        const beforeCss = cleaned.substring(0, cleaned.indexOf(cssPart));

        if (beforeCss.trim()) {
          const comment = `/* ${beforeCss.trim().replace(/\/\*|^\*\//g, '')} */\n`;
          return comment + cssPart;
        }
        return cssPart;
      }
    }
  }

  return cleaned;
};

export default function AIAssistant({ code, language, onInsert, onToast }) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('generate'); // generate, explain, fix, optimize, review
  const [provider, setProvider] = useState('auto');
  const [model, setModel] = useState('gpt-4o');
  const [openaiKey, setOpenaiKey] = useState('');
  const [perplexityKey, setPerplexityKey] = useState('');
  const [googleKey, setGoogleKey] = useState('');
  const [openaiOrgId, setOpenaiOrgId] = useState('');
  const [openaiProjectId, setOpenaiProjectId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Only require prompt for generate/explain modes
    if (!prompt.trim() && (mode === 'generate' || mode === 'explain')) {
      const msg = `Please enter a prompt for ${mode} mode`;
      console.warn(msg);
      onToast(msg, 'warning');
      return;
    }

    console.log(`Starting AI request - Mode: ${mode}, Provider: ${provider}`);
    setLoading(true);
    // Don't clear previous response - let users keep it for reference
    // setResponse('');

    try {
      let endpoint = '';
      let body = {};

      switch (mode) {
        case 'generate':
          endpoint = `${API_URL}/ai/generate-code`;
          body = { prompt, language, preferredProvider: provider, model, openaiKey: openaiKey || undefined, perplexityKey: perplexityKey || undefined, perplexityModel: provider === 'perplexity' ? model : undefined, openaiOrgId: openaiOrgId || undefined, openaiProjectId: openaiProjectId || undefined };
          break;
        case 'explain':
          endpoint = `${API_URL}/ai/explain-code`;
          body = { code, question: prompt || 'Explain what this code does', preferredProvider: provider, model, openaiKey: openaiKey || undefined, perplexityKey: perplexityKey || undefined, perplexityModel: provider === 'perplexity' ? model : undefined, openaiOrgId: openaiOrgId || undefined, openaiProjectId: openaiProjectId || undefined };
          break;
        case 'fix':
          endpoint = `${API_URL}/ai/fix-bug`;
          body = { code, context: prompt, preferredProvider: provider, model, openaiKey: openaiKey || undefined, perplexityKey: perplexityKey || undefined, openaiOrgId: openaiOrgId || undefined, openaiProjectId: openaiProjectId || undefined };
          break;
        case 'optimize':
          endpoint = `${API_URL}/ai/optimize-code`;
          body = { code, focusArea: prompt || 'performance', preferredProvider: provider, model, openaiKey: openaiKey || undefined, perplexityKey: perplexityKey || undefined, openaiOrgId: openaiOrgId || undefined, openaiProjectId: openaiProjectId || undefined };
          break;
        case 'review':
          endpoint = `${API_URL}/ai/review-code`;
          body = { code, preferredProvider: provider, model, openaiKey: openaiKey || undefined, perplexityKey: perplexityKey || undefined, openaiOrgId: openaiOrgId || undefined, openaiProjectId: openaiProjectId || undefined };
          break;
      }

      console.log('Sending request to:', endpoint, 'with body:', JSON.stringify(body));

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      console.log('Response status:', res.status, res.statusText);
      const data = await res.json();

      console.log('AI Response Data:', data);

      if (data.ok) {
        let responseText = data.resp || data.result || data.response;

        // Extract code from markdown code blocks if present
        if (responseText.includes('```')) {
          const codeBlockMatch = responseText.match(/```(?:html|javascript|css|js|jsx)?\n?([\s\S]*?)```/);
          if (codeBlockMatch) {
            responseText = codeBlockMatch[1].trim();
          }
        }

        // Clean and process the response
        responseText = cleanResponseText(responseText, mode);

        console.log('Setting response:', responseText.substring(0, 100) + '...');
        setResponse(responseText);

        if (data.provider) {
          onToast(`AI response received from ${data.provider}`, 'success');
        } else {
          onToast('AI response received', 'success');
        }

        if (data.note) {
          console.log('AI Note:', data.note);
        }
      } else {
        console.error('AI Error:', data);
        const errorMsg = data.error || data.details || 'AI request failed';
        onToast(errorMsg, 'error');

        // Show helpful error information
        if (data.help && data.help.message) {
          console.log('AI Help:', data.help.message);
          onToast(data.help.message, 'warning');
        }
      }
    } catch (error) {
      console.error('AI request error:', error);
      onToast(error.message || 'Failed to connect to AI service', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInsert = () => {
    console.log('Insert clicked. Response length:', response ? response.length : 0);
    if (response) {
      console.log('Calling onInsert with response');
      onInsert(response);
      onToast('Code inserted into editor', 'success');
      // Don't clear the response so user can still see it
      console.log('Code inserted successfully');
    } else {
      console.warn('No response to insert');
      onToast('No AI response to insert', 'warning');
    }
  };

  return (
    <div className="card ai-assistant">
      <h3>🤖 AI Assistant</h3>

      <div className="mode-selector">
        <button
          className={mode === 'generate' ? 'active' : 'secondary'}
          onClick={() => setMode('generate')}
        >
          Generate
        </button>
        <button
          className={mode === 'explain' ? 'active' : 'secondary'}
          onClick={() => setMode('explain')}
        >
          Explain
        </button>
        <button
          className={mode === 'fix' ? 'active' : 'secondary'}
          onClick={() => setMode('fix')}
        >
          Fix
        </button>
        <button
          className={mode === 'optimize' ? 'active' : 'secondary'}
          onClick={() => setMode('optimize')}
        >
          Optimize
        </button>
        <button
          className={mode === 'review' ? 'active' : 'secondary'}
          onClick={() => setMode('review')}
        >
          Review
        </button>
      </div>

      <div className="settings">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            <option value="auto">Auto (Best Available)</option>
            <option value="groq">Groq (Fast & Free)</option>
            <option value="openai">OpenAI</option>
            <option value="perplexity">Perplexity</option>
          </select>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={provider === 'perplexity' ? 'Perplexity model (e.g. sonar)' : 'OpenAI model (e.g. gpt-4o)'}
          />
          <input
            type="password"
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            placeholder="OpenAI key (optional)"
            autoComplete="off"
          />
          <input
            type="password"
            value={perplexityKey}
            onChange={(e) => setPerplexityKey(e.target.value)}
            placeholder="Perplexity key (optional)"
            autoComplete="off"
          />
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 8 }}>
          <input
            type="text"
            value={openaiOrgId}
            onChange={(e) => setOpenaiOrgId(e.target.value)}
            placeholder="OpenAI Org ID (optional)"
            autoComplete="off"
          />
          <input
            type="text"
            value={openaiProjectId}
            onChange={(e) => setOpenaiProjectId(e.target.value)}
            placeholder="OpenAI Project ID (optional)"
            autoComplete="off"
          />
        </div>
      </div>

      {loading && (
        <div className="ai-loading" style={{
          textAlign: 'center',
          padding: '20px',
          color: '#0891b2',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          <div style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '3px solid rgba(8, 145, 178, 0.3)',
            borderTop: '3px solid #0891b2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '10px',
            verticalAlign: 'middle'
          }}></div>
          Generating code...
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ marginTop: '12px' }}>     <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder={
          mode === 'generate' ? 'Describe what code you want to generate...' :
            mode === 'explain' ? 'Ask a question about the code (optional)...' :
              mode === 'fix' ? 'Describe the issue or leave empty...' :
                mode === 'optimize' ? 'Specify optimization focus (performance, readability, etc.)...' :
                  'Code review will analyze current editor content...'
        }
        rows={4}
      />
        <button type="submit" disabled={loading}>
          {loading ? <span className="spinner"></span> : ''}✨ Send
        </button>
      </form>

      {response && (
        <div className="response-area">
          <div className="response-header">
            <h4>AI Response:</h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleInsert} className="secondary">
                📋 Insert to Editor
              </button>
              <button onClick={() => setResponse('')} className="secondary">
                🗑️ Clear
              </button>
            </div>
          </div>
          <div className="response-content">
            {typeof response === 'string' ? (
              <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {response}
              </pre>
            ) : (
              <pre>{JSON.stringify(response, null, 2)}</pre>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <span>Getting AI response...</span>
        </div>
      )}
    </div>
  );
}
