import React, { useEffect } from 'react';

export default function Preview({ html, iframeRef, onConsoleMessage, onClick, isFullScreen }) {
  useEffect(() => {
    if (iframeRef.current && html) {
      // Use srcdoc for simpler, more reliable rendering
      iframeRef.current.srcdoc = html;
    }
  }, [html, iframeRef]);

  return (
    <div className={`preview ${isFullScreen ? 'is-fullscreen' : ''}`} onClick={onClick}>
      {!isFullScreen && (
        <div className="preview-header">
          <h4>🖥️ Preview</h4>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Preview"
        sandbox="allow-scripts allow-same-origin"
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}
