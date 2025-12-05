import React, { useState, useRef, useEffect } from 'react';

export default function ExportManager({ files, activeFileId, onToast }) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [jszipAvailable, setJszipAvailable] = useState(false);
  const jszipRef = useRef(null);
  const menuRef = useRef(null);
  const activeFile = files.find(f => f.id === activeFileId);

  // When menu opens, focus the first interactive item. Also add keyboard nav and outside click.
  useEffect(() => {
    let cleanup = () => {};
    if (showExportMenu && menuRef.current) {
      const menu = menuRef.current;
      const items = Array.from(menu.querySelectorAll('button.menu-item'));
      if (items.length) {
        // focus first item
        items[0].focus();
      }

      const onKey = (e) => {
        const items = Array.from(menu.querySelectorAll('button.menu-item'));
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement);

        if (e.key === 'Escape') {
          setShowExportMenu(false);
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = items[(idx + 1) % items.length];
          next && next.focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = items[(idx - 1 + items.length) % items.length];
          prev && prev.focus();
        } else if (e.key === 'Tab') {
          // simple focus trap
          if (e.shiftKey && document.activeElement === items[0]) {
            e.preventDefault();
            items[items.length - 1].focus();
          } else if (!e.shiftKey && document.activeElement === items[items.length - 1]) {
            e.preventDefault();
            items[0].focus();
          }
        }
      };

      const onClickOutside = (ev) => {
        if (!menu.contains(ev.target)) setShowExportMenu(false);
      };

      document.addEventListener('keydown', onKey);
      document.addEventListener('mousedown', onClickOutside);

      cleanup = () => {
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('mousedown', onClickOutside);
      };
    }
    return cleanup;
  }, [showExportMenu]);

  // Check for jszip availability (non-blocking). If available, keep reference.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = (await import('jszip')).default;
        if (mounted) {
          jszipRef.current = mod;
          setJszipAvailable(true);
        }
      } catch (err) {
        // not installed or failed to load
        if (mounted) setJszipAvailable(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  /**
   * Download a single file
   */
  const downloadFile = (file) => {
    const content = file.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /**
   * Download all files as ZIP
   */
  const downloadAllAsZip = async () => {
    if (!jszipAvailable) {
      if (onToast) onToast('ZIP export unavailable — install jszip in client: npm install jszip', 'warning');
      return;
    }

    try {
      const JSZip = jszipRef.current || (await import('jszip')).default;
      const zip = new JSZip();

      files.forEach(file => {
        zip.file(file.name, file.content);
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-editor-project-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (onToast) onToast('Downloaded project ZIP', 'success');
    } catch (error) {
      console.error('ZIP download failed:', error);
      if (onToast) onToast('ZIP export failed. See console for details.', 'error');
    }
  };

  /**
   * Copy code to clipboard
   */
  const copyToClipboard = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      if (onToast) onToast('Copied to clipboard', 'success');
    } catch (error) {
      console.error('Copy failed:', error);
      // Fallback: create a temporary textarea and use execCommand
      try {
        const ta = document.createElement('textarea');
        ta.value = content;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        if (onToast) onToast('Copied to clipboard (fallback)', 'success');
        return;
      } catch (e) {
        console.error('Clipboard fallback failed:', e);
        if (onToast) onToast('Copy to clipboard failed', 'error');
      }
    }
  };

  /**
   * Export as HTML (embeds CSS and JS)
   */
  const exportAsHTML = () => {
    const htmlFile = files.find(f => f.language === 'html');
    const cssFile = files.find(f => f.language === 'css');
    const jsFile = files.find(f => f.language === 'javascript');

    if (!htmlFile) {
      if (onToast) onToast('No HTML file found to export', 'warning');
      return;
    }

    let html = htmlFile.content || '';

    // Add CSS inline if exists
    if (cssFile) {
      html = html.replace('</head>', `<style>\n${cssFile.content}\n</style>\n</head>`);
    }

    // Add JS inline if exists
    if (jsFile) {
      html = html.replace('</body>', `<script>\n${jsFile.content}\n</script>\n</body>`);
    }

    downloadFile({
      name: 'index.html',
      content: html
    });
    if (onToast) onToast('Exported HTML with embedded assets', 'success');
  };

  /**
   * Export JSON snapshot
   */
  const exportAsJSON = () => {
    const snapshot = {
      exportDate: new Date().toISOString(),
      projectName: 'AI Editor Project',
      files: files,
      stats: {
        totalFiles: files.length,
        totalChars: files.reduce((sum, f) => sum + f.content.length, 0),
        totalLines: files.reduce((sum, f) => sum + f.content.split('\n').length, 0),
      }
    };

    downloadFile({
      name: `project-snapshot-${Date.now()}.json`,
      content: JSON.stringify(snapshot, null, 2)
    });
    if (onToast) onToast('Exported project snapshot (JSON)', 'success');
  };

  /**
   * Send project snapshot to AI server for analysis/storage
   */
  const sendToAIServer = async () => {
    const snapshot = {
      exportDate: new Date().toISOString(),
      projectName: 'AI Editor Project',
      files: files,
      stats: {
        totalFiles: files.length,
        totalChars: files.reduce((sum, f) => sum + (f.content ? f.content.length : 0), 0),
        totalLines: files.reduce((sum, f) => sum + (f.content ? f.content.split('\n').length : 0), 0),
      }
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      if (onToast) onToast('Sending project snapshot to AI server...', 'info');
      const headers = { 'Content-Type': 'application/json' };
      // read an optional upload key from localStorage for privacy-protected endpoints
      try {
        const key = window.localStorage?.getItem?.('AI_UPLOAD_KEY');
        if (key) headers['x-upload-key'] = key;
      } catch (e) {
        // ignore localStorage errors
      }

      const resp = await fetch('/api/ai/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify(snapshot),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        const msg = err && err.error ? err.error : `Server responded ${resp.status}`;
        if (onToast) onToast(`Send failed: ${msg}`, 'error');
        return;
      }

      const body = await resp.json().catch(() => ({}));
      if (onToast) onToast(body.message || 'Snapshot sent to AI server', 'success');
    } catch (error) {
      if (error.name === 'AbortError') {
        if (onToast) onToast('Send to AI server timed out', 'error');
      } else {
        console.error('Send to AI server failed:', error);
        if (onToast) onToast('Send to AI server failed', 'error');
      }
    }
  };

  return (
    <div className="export-manager">
      <button
        className="export-toggle menu-item"
        onClick={() => setShowExportMenu(v => !v)}
        aria-expanded={showExportMenu}
        aria-controls="export-menu"
      >
        ⤓ Export
      </button>

      {showExportMenu && (
        <div className="export-menu" id="export-menu" ref={menuRef} role="menu">
          <div className="menu-section">
            <h4>All Files</h4>
            <div style={{ position: 'relative', display: 'block' }}>
              <button
                onClick={() => {
                  downloadAllAsZip();
                  setShowExportMenu(false);
                }}
                className="menu-item"
                disabled={!jszipAvailable}
                aria-describedby={!jszipAvailable ? 'zip-help-tooltip' : undefined}
                title={!jszipAvailable ? 'ZIP export unavailable — install jszip (npm install jszip)' : 'Download project as ZIP'}
              >
                📦 Download as ZIP {jszipAvailable ? '' : ' (jszip missing)'}
              </button>

              {!jszipAvailable && (
                <div id="zip-help-tooltip" role="tooltip" className="zip-tooltip">
                  <div className="zip-tooltip-text">Run <code>npm install jszip</code> in <code>client</code> to enable ZIP export.</div>
                  <button
                    className="menu-item zip-install-btn"
                    onClick={() => {
                      copyToClipboard('npm install jszip');
                      if (onToast) onToast('Install command copied to clipboard', 'success');
                    }}
                  >
                    📋 Copy command
                  </button>
                </div>
              )}
            </div>

            <div className="menu-divider" />

            <button
              onClick={() => {
                exportAsJSON();
                setShowExportMenu(false);
              }}
              className="menu-item"
            >
              🔗 Export as JSON
            </button>
            <button
              onClick={async () => {
                await sendToAIServer();
                setShowExportMenu(false);
              }}
              className="menu-item"
            >
              🚀 Send to AI server
            </button>
          </div>

          <div className="menu-divider" />

          <div className="menu-section">
            <h4>Special Exports</h4>
            <button
              onClick={() => {
                exportAsHTML();
                setShowExportMenu(false);
              }}
              className="menu-item"
            >
              🌐 HTML + Embedded Assets
            </button>
          </div>

          <div className="menu-divider" />

          <div className="menu-stats">
            <small>
              📊 {files.length} files | {files.reduce((sum, f) => sum + (f.content ? f.content.length : 0), 0)} chars
            </small>
          </div>
        </div>
      )}
    </div>
  );
}
