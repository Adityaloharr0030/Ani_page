import React, { useEffect } from 'react';

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className={`toast ${type} fade-in`}>
      <span className="toast-icon">{icons[type]}</span>
      <span>{message}</span>
      <button 
        onClick={onClose}
        className="toast-close"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

