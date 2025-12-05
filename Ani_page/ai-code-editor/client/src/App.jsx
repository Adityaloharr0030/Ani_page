import React, { useState, useRef, useEffect } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Editor from './components/Editor';
import AIAssistant from './components/AIAssistant';
import Preview from './components/Preview';
import SQLEditor from './components/SQLEditor';
import AdvancedFileManager from './components/AdvancedFileManager';
import Terminal from './components/Terminal';
import ExportManager from './components/ExportManager';
import SnippetsLibrary from './components/SnippetsLibrary';
import Toast from './components/Toast';
import { useLocalStorage } from './hooks/useLocalStorage';
import './pro-ui.css';
import './input-dark.css';

// New state for fullscreen preview
const useFullScreenPreview = () => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  return { isFullScreen, setIsFullScreen };
};

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Editor</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    h1 { font-size: 3rem; margin: 0; }
    .card {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border-radius: 1rem;
      padding: 2rem;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <h1>✨ Welcome to AI Code Writer </h1>
  <div class="card">
    <h2>Features:</h2>
    <ul>
      <li>AI-powered code generation</li>
      <li>Smart code explanations</li>
      <li>Live preview</li>
      <li>SQL query execution</li>
    </ul>
  </div>
  <script>
    console.log('🚀 AI Editor initialized!');
  </script>
</body>
</html>`;

export default function App() {
  const [files, setFiles] = useLocalStorage('editor-files', [
    { id: '1', name: 'index.html', language: 'html', content: DEFAULT_HTML }
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [theme, setTheme] = useLocalStorage('editor-theme', 'dark');
  const [activePanel, setActivePanel] = useState('terminal'); // terminal, output, problems
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [sidebarView, setSidebarView] = useState('files'); // files, ai
  const [toast, setToast] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [quickAIPrompt, setQuickAIPrompt] = useState('');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const iframeRef = useRef();
  const [fontFamily, setFontFamily] = useState('Inter, sans-serif');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.body.style.fontFamily = fontFamily;
  }, [fontFamily]);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const { isFullScreen, setIsFullScreen } = useFullScreenPreview();

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  // Auto-update preview
  useEffect(() => {
    const timer = setTimeout(() => {
      const htmlFile = files.find(f => f.language === 'html');
      if (htmlFile && activeFileId === htmlFile.id) {
        setPreviewHtml(htmlFile.content);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [files, activeFileId]);

  const updateFileContent = (content) => {
    console.log('updateFileContent called. Active file:', activeFileId, 'Content length:', content?.length);

    if (!activeFileId || files.length === 0) {
      // No file open - create a new one
      const newFileId = Date.now();
      const newFile = {
        id: newFileId,
        name: 'ai-generated.html',
        language: 'html',
        content: content
      };

      // Add file and set as active IMMEDIATELY
      const newFiles = [...files, newFile];
      setFiles(newFiles);
      setActiveFileId(newFileId);

      console.log('Created new file with ID:', newFileId);
      showToast('✨ Created new file with AI code', 'success');

      // Auto-run preview after creating file
      setTimeout(() => {
        setPreviewHtml(content);
        if (iframeRef.current) {
          iframeRef.current.srcdoc = content;
        }
        showToast('🖥️ Preview auto-loaded', 'info');
      }, 600);
    } else {
      // Update existing active file
      console.log('Updating file ID:', activeFileId, 'with content length:', content?.length);
      const updated = files.map(f =>
        f.id === activeFileId ? { ...f, content: content } : f
      );
      setFiles(updated);
      showToast('✅ Code inserted into editor', 'success');

      // Auto-run preview if current file is HTML
      const activeFile = files.find(f => f.id === activeFileId);
      if (activeFile?.language === 'html' || activeFile?.name.endsWith('.html')) {
        setTimeout(() => {
          setPreviewHtml(content);
          if (iframeRef.current) {
            iframeRef.current.srcdoc = content;
          }
          showToast('🖥️ Preview updated', 'info');
        }, 600);
      }
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleExportZip = async () => {
    try {
      const zip = new JSZip();
      files.forEach(file => {
        zip.file(file.name, file.content);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'project-export.zip');
      showToast('📦 Project exported successfully!', 'success');
    } catch (error) {
      console.error('Export failed:', error);
      showToast('Export failed', 'error');
    }
  };

  const handleRun = () => {
    console.log('Run clicked. Active file ID:', activeFileId);

    // Try active file first
    const activeFile = files.find(f => f.id === activeFileId);

    // If active file is HTML, use it; otherwise find any HTML file
    let fileToRun = null;
    if (activeFile?.language === 'html' || activeFile?.name.endsWith('.html')) {
      fileToRun = activeFile;
    } else {
      fileToRun = files.find(f => f.language === 'html' || f.name.endsWith('.html'));
    }

    if (fileToRun) {
      console.log('Running file:', fileToRun.name);
      setPreviewHtml(fileToRun.content);
      // Force iframe reload
      if (iframeRef.current) {
        iframeRef.current.srcdoc = fileToRun.content;
      }
      showToast(`✨ Previewing ${fileToRun.name}`, 'success');
    } else {
      console.warn('No HTML file found');
      showToast('No HTML file to run. Create an HTML file first!', 'warning');
    }
  };

  const handleQuickAI = async () => {
    if (!quickAIPrompt.trim()) return;
    setIsProcessingAI(true);
    showToast('✨ AI is thinking...', 'info');

    try {
      const response = await fetch('/api/ai/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Modify this code: ${quickAIPrompt}`,
          context: activeFile.content,
          language: activeFile.language
        })
      });
      const data = await response.json();
      if (data.code) {
        updateFileContent(data.code);
        showToast('✨ Code updated by AI!', 'success');
        setQuickAIPrompt('');
      } else {
        showToast('AI failed to generate code', 'error');
      }
    } catch (error) {
      console.error('AI error:', error);
      showToast('AI request failed', 'error');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleFormat = () => {
    fetch('/api/format/format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: activeFile.content,
        language: activeFile.language
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          updateFileContent(data.formatted);
          showToast('✨ Code formatted perfectly!', 'success');
        } else {
          showToast(data.error || 'Formatting failed', 'error');
        }
      })
      .catch(err => {
        console.error('Format error:', err);
        showToast('Format request failed', 'error');
      });
  };

  return (
    <div className="container">
      {/* Menu Bar */}
      <div className="menu-bar">
        <div className="menu-item">File
          <div className="dropdown-menu">
            <div className="dropdown-item" data-testid="download-file-btn" onClick={() => {
              const blob = new Blob([activeFile.content], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = activeFile.name;
              a.click();
            }}>📥 Download File</div>
            <div className="dropdown-item" data-testid="export-zip-btn" onClick={handleExportZip}>📦 Export ZIP</div>
          </div>
        </div>
        <div className="menu-item">View
          <div className="dropdown-menu">
            <div className="dropdown-item" data-testid="theme-menu-btn" onClick={() => setShowThemeModal(true)}>🎨 Theme</div>
            <div className="dropdown-item" data-testid="settings-menu-btn" onClick={() => setShowSettingsModal(true)}>⚙️ Settings</div>
          </div>
        </div>
        <div className="menu-item">AI
          <div className="dropdown-menu">
            <div className="dropdown-item" data-testid="ai-generate-menu-btn" onClick={() => setSidebarView('ai')}>✨ Generate</div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="header-logo">&lt;/&gt; Ani_page AI Editor</div>
        <div className="header-controls">
          <button className="btn" data-testid="settings-header-btn" onClick={() => setShowSettingsModal(true)}>⚙️ Settings</button>
          <button className="btn" data-testid="theme-header-btn" onClick={() => setShowThemeModal(true)}>🎨 Theme</button>
          <button className="btn primary" data-testid="run-btn" onClick={handleRun}>▶️ Run</button>
          <button className={`btn ${showPreview ? 'active' : ''}`} onClick={() => setShowPreview(!showPreview)}>👁️ Preview</button>
          <button className="btn" data-testid="fullscreen-btn" onClick={() => setIsFullScreen(true)}>📺 Full</button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="main-wrapper">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="sidebar-header">🗂️ Project</div>
            <div className={`sidebar-item ${sidebarView === 'files' ? 'active' : ''}`} onClick={() => setSidebarView('files')}>
              📁 Files
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-header">✨ AI</div>
            <div className={`sidebar-item ${sidebarView === 'ai' ? 'active' : ''}`} onClick={() => setSidebarView('ai')}>
              💡 Assistant
            </div>
          </div>
          <div className="sidebar-section">
            <div className="sidebar-header">🗄️ Data</div>
            <div className={`sidebar-item ${sidebarView === 'sql' ? 'active' : ''}`} onClick={() => setSidebarView('sql')}>
              🗄️ SQL DB
            </div>
          </div>
        </div>

        {/* Editor Area */}
        <div className="editor-area">
          {/* Tabs */}
          <div className="editor-tabs">
            {files.map(file => (
              <div
                key={file.id}
                className={`tab ${activeFileId === file.id ? 'active' : ''}`}
                onClick={() => setActiveFileId(file.id)}
              >
                📄 {file.name}
                <span className="tab-close" onClick={(e) => {
                  e.stopPropagation();
                  // Handle close logic if needed
                }}>×</span>
              </div>
            ))}
          </div>

          <div className="editor-container">
            {/* Inner Sidebar Content */}
            {sidebarView === 'files' && (
              <div className="file-explorer">
                <div className="explorer-title">📂 Project Files</div>
                <AdvancedFileManager
                  files={files}
                  activeFileId={activeFileId}
                  onFileSelect={setActiveFileId}
                  onFileAdd={(file) => setFiles([...files, file])}
                  onFileDelete={(id) => {
                    setFiles(files.filter(f => f.id !== id));
                    if (activeFileId === id) setActiveFileId(files[0]?.id);
                  }}
                  onFileRename={(id, name) => {
                    setFiles(files.map(f => f.id === id ? { ...f, name } : f));
                  }}
                />
              </div>
            )}

            {sidebarView === 'ai' && (
              <div className="file-explorer" style={{ width: '350px' }}>
                <AIAssistant
                  code={activeFile?.content || ''}
                  language={activeFile?.language || 'javascript'}
                  onInsert={updateFileContent}
                  onToast={showToast}
                />
              </div>
            )}

            {sidebarView === 'sql' && (
              <div className="file-explorer" style={{ width: '100%' }}>
                <SQLEditor onToast={showToast} />
              </div>
            )}

            {/* Main Editor Content */}
            {sidebarView !== 'sql' && (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div className="editor-content" style={{ display: 'flex', flexDirection: 'row' }}>
                  <div style={{ flex: 1, height: '100%', overflow: 'hidden' }}>
                    <Editor
                      value={activeFile?.content || ''}
                      onChange={updateFileContent}
                      language={activeFile?.language || 'html'}
                      theme={theme}
                    />
                  </div>
                  {showPreview && (
                    <div style={{ width: '40%', height: '100%', borderLeft: '1px solid var(--border-light)', background: 'white' }}>
                      <Preview html={previewHtml} iframeRef={iframeRef} isFullScreen={false} />
                    </div>
                  )}
                </div>

                {/* Prompt Bar (Quick AI) */}
                <div className="prompt-bar">
                  <input
                    type="text"
                    className="prompt-input"
                    data-testid="quick-ai-input"
                    placeholder="✨ Quick AI Edit (e.g., 'Change background to blue')..."
                    value={quickAIPrompt}
                    onChange={(e) => setQuickAIPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleQuickAI()}
                    disabled={isProcessingAI}
                  />
                  <button
                    className="prompt-send"
                    data-testid="quick-ai-send-btn"
                    onClick={handleQuickAI}
                    disabled={isProcessingAI}
                  >
                    {isProcessingAI ? 'Thinking...' : 'Send'}
                  </button>
                  <button className="btn" data-testid="format-btn" onClick={handleFormat} style={{ marginLeft: '10px' }}>✨ Format</button>
                </div>
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="output-panel">
            <div className="panel-header">
              <div className="panel-tabs">
                <div className={`panel-tab ${activePanel === 'terminal' ? 'active' : ''}`} onClick={() => setActivePanel('terminal')}>📺 Terminal</div>
                <div className={`panel-tab ${activePanel === 'output' ? 'active' : ''}`} onClick={() => setActivePanel('output')}>📤 Output</div>
              </div>
              <div className="panel-actions">
                <button className="panel-btn" onClick={() => showToast('Cleared', 'success')}>🗑️ Clear</button>
              </div>
            </div>

            <div className={`panel-content ${activePanel === 'terminal' ? 'active' : ''}`}>
              <Terminal files={files} onClose={() => { }} />
            </div>
            <div className={`panel-content ${activePanel === 'output' ? 'active' : ''}`}>
              <div className="output-line">Output logs will appear here...</div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}


      // ... (rest of the component)

      {/* Modals */}
      <div className={`modal-overlay ${showThemeModal ? 'active' : ''}`} onClick={() => setShowThemeModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">🎨 Theme <button className="modal-close" onClick={() => setShowThemeModal(false)}>×</button></div>
          <div className="modal-body">
            <div className="theme-grid">
              <div className={`theme-card ${theme === 'dark' ? 'active' : ''}`} onClick={() => setTheme('dark')}>
                <div className="theme-preview dark"></div>
                <span>Midnight</span>
              </div>
              <div className={`theme-card ${theme === 'ocean' ? 'active' : ''}`} onClick={() => setTheme('ocean')}>
                <div className="theme-preview ocean"></div>
                <span>Ocean</span>
              </div>
              <div className={`theme-card ${theme === 'dracula' ? 'active' : ''}`} onClick={() => setTheme('dracula')}>
                <div className="theme-preview dracula"></div>
                <span>Dracula</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`modal-overlay ${showSettingsModal ? 'active' : ''}`} onClick={() => setShowSettingsModal(false)}>
        <div className="modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">⚙️ Settings <button className="modal-close" onClick={() => setShowSettingsModal(false)}>×</button></div>
          <div className="modal-body">
            <div className="setting-group">
              <label className="setting-label">Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="setting-select"
              >
                <option value="'Inter', sans-serif">Inter (Default)</option>
                <option value="'Fira Code', monospace">Fira Code</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                <option value="'Roboto Mono', monospace">Roboto Mono</option>
                <option value="'Courier New', monospace">Courier New</option>
              </select>
            </div>
            <div className="setting-group">
              <label className="setting-label">Font Size</label>
              <input type="range" min="10" max="24" defaultValue="14" className="setting-input" />
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={() => setShowSettingsModal(false)}>Close</button>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Overlay */}
      {isFullScreen && (
        <div className="fullscreen-preview" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: 'white' }}>
          <button
            onClick={() => setIsFullScreen(false)}
            style={{ position: 'absolute', top: 10, right: 10, zIndex: 10000, padding: '5px 10px', background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            ✖ Close
          </button>
          <Preview html={previewHtml} iframeRef={iframeRef} isFullScreen={true} />
        </div>
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
