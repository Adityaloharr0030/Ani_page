import React, { useState, useEffect, useRef } from 'react';

export default function Terminal({ files, onClose }) {
  const [history, setHistory] = useState([
    { type: 'output', content: 'Welcome to Ani_page Terminal v1.0' },
    { type: 'output', content: 'Type "help" for available commands.' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommand = (cmd) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    const newHistory = [...history, { type: 'input', content: trimmedCmd }];
    const parts = trimmedCmd.split(' ');
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case 'help':
        newHistory.push({
          type: 'output',
          content: 'Available commands:\n  help - Show this help message\n  clear - Clear terminal history\n  ls - List files\n  cat <filename> - View file content\n  date - Show current date\n  whoami - Show current user'
        });
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'ls':
        const fileList = files.map(f => f.name).join('\n');
        newHistory.push({ type: 'output', content: fileList || 'No files found.' });
        break;
      case 'cat':
        if (args.length === 0) {
          newHistory.push({ type: 'error', content: 'Usage: cat <filename>' });
        } else {
          const fileName = args[0];
          const file = files.find(f => f.name === fileName);
          if (file) {
            newHistory.push({ type: 'output', content: file.content });
          } else {
            newHistory.push({ type: 'error', content: `File not found: ${fileName}` });
          }
        }
        break;
      case 'date':
        newHistory.push({ type: 'output', content: new Date().toString() });
        break;
      case 'whoami':
        newHistory.push({ type: 'output', content: 'guest_user' });
        break;
      default:
        newHistory.push({ type: 'error', content: `Command not found: ${command}` });
    }

    setHistory(newHistory);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCommand(input);
    }
  };

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💻 Terminal</span>
          <span style={{ fontSize: '11px', opacity: 0.6, fontWeight: 'normal' }}>v1.0</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="terminal-action"
            onClick={() => setHistory([])}
            title="Clear Terminal"
          >
            🗑️
          </button>
          <button className="terminal-close" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="terminal-body">
        {history.map((item, index) => (
          <div key={index} className={`terminal-line ${item.type}`}>
            {item.type === 'input' && <span className="prompt">$ </span>}
            <pre>{item.content}</pre>
          </div>
        ))}
        <div className="terminal-input-line">
          <span className="prompt">$ </span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck="false"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
