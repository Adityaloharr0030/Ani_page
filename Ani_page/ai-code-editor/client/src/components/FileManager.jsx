import React, { useState } from 'react';

export default function FileManager({ 
  files, 
  activeFileId, 
  onFileSelect, 
  onFileAdd, 
  onFileDelete, 
  onFileRename 
}) {
  const [newFileName, setNewFileName] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);

  const handleAddFile = () => {
    if (!newFileName.trim()) return;
    
    const extension = newFileName.split('.').pop().toLowerCase();
    const languageMap = {
      html: 'html',
      css: 'css',
      js: 'javascript',
      jsx: 'javascript',
      ts: 'javascript',
      tsx: 'javascript',
      sql: 'sql',
      json: 'json',
      md: 'markdown'
    };
    
    const newFile = {
      id: Date.now().toString(),
      name: newFileName,
      language: languageMap[extension] || 'javascript',
      content: ''
    };
    
    onFileAdd(newFile);
    setNewFileName('');
    setShowNewFile(false);
    onFileSelect(newFile.id);
  };

  const getFileIcon = (language) => {
    const icons = {
      html: '📄',
      css: '🎨',
      javascript: '⚡',
      sql: '🗄️',
      json: '📋',
      markdown: '📝'
    };
    return icons[language] || '📄';
  };

  return (
    <div className="file-manager">
      <div className="file-tabs">
        {files.map(file => (
          <div
            key={file.id}
            className={`file-tab ${file.id === activeFileId ? 'active' : ''}`}
            onClick={() => onFileSelect(file.id)}
          >
            <span className="file-icon">{getFileIcon(file.language)}</span>
            <span className="file-name">{file.name}</span>
            {files.length > 1 && (
              <button
                className="file-close"
                onClick={(e) => {
                  e.stopPropagation();
                  onFileDelete(file.id);
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button 
          className="add-file-btn"
          onClick={() => setShowNewFile(!showNewFile)}
        >
          +
        </button>
      </div>

      {showNewFile && (
        <div className="new-file-form">
          <input
            type="text"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            placeholder="filename.html"
            onKeyPress={(e) => e.key === 'Enter' && handleAddFile()}
            autoFocus
          />
          <button onClick={handleAddFile}>Add</button>
          <button onClick={() => setShowNewFile(false)} className="secondary">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

