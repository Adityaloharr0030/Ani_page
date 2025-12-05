import React, { useState } from 'react';

const CODE_SNIPPETS = {
  html: [
    {
      name: 'Basic HTML Template',
      code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <h1>Welcome</h1>
  <p>Your content here</p>
</body>
</html>`
    },
    {
      name: 'Responsive Card Component',
      code: `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
  <div style="background: white; border-radius: 8px; padding: 2rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <h3>Card Title</h3>
    <p>Card content goes here</p>
    <button style="background: #007bff; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Click Me</button>
  </div>
</div>`
    },
    {
      name: 'Navigation Bar',
      code: `<nav style="background: #333; padding: 1rem; margin-bottom: 2rem;">
  <div style="display: flex; gap: 2rem; max-width: 1200px; margin: 0 auto;">
    <a href="#" style="color: white; text-decoration: none; font-weight: bold;">Home</a>
    <a href="#" style="color: white; text-decoration: none;">About</a>
    <a href="#" style="color: white; text-decoration: none;">Services</a>
    <a href="#" style="color: white; text-decoration: none;">Contact</a>
  </div>
</nav>`
    }
  ],
  javascript: [
    {
      name: 'Fetch API Example',
      code: `async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
}

// Usage
fetchData('https://api.example.com/data').then(data => {
  console.log('Data:', data);
});`
    },
    {
      name: 'Debounce Function',
      code: `function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Usage
const handleSearch = debounce((query) => {
  console.log('Searching for:', query);
}, 500);`
    },
    {
      name: 'Array Methods Cheat Sheet',
      code: `const arr = [1, 2, 3, 4, 5];

// Map: transform each element
const doubled = arr.map(x => x * 2); // [2, 4, 6, 8, 10]

// Filter: keep elements that match condition
const evens = arr.filter(x => x % 2 === 0); // [2, 4]

// Reduce: accumulate to single value
const sum = arr.reduce((acc, x) => acc + x, 0); // 15

// Find: get first matching element
const first = arr.find(x => x > 3); // 4

// Some: check if any element matches
const hasEven = arr.some(x => x % 2 === 0); // true

// Every: check if all elements match
const allPositive = arr.every(x => x > 0); // true`
    }
  ],
  css: [
    {
      name: 'Flexbox Container',
      code: `.flex-container {
  display: flex;
  justify-content: center;      /* Horizontal alignment */
  align-items: center;          /* Vertical alignment */
  gap: 1rem;                    /* Space between items */
  flex-wrap: wrap;              /* Wrap items on small screens */
  height: 200px;
  background: #f5f5f5;
}

.flex-item {
  flex: 1;
  min-width: 150px;
  padding: 1rem;
  background: white;
  border-radius: 4px;
}`
    },
    {
      name: 'Grid Layout',
      code: `.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 2rem;
  padding: 2rem;
}

.grid-item {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.grid-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}`
    },
    {
      name: 'Gradient Background',
      code: `.gradient-bg {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 2rem;
}`
    }
  ],
  json: [
    {
      name: 'API Response Example',
      code: `{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "admin"
      },
      {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "user"
      }
    ]
  },
  "meta": {
    "total": 2,
    "page": 1,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`
    }
  ]
};

export default function SnippetsLibrary({ onInsert, onToast }) {
  const [selectedCategory, setSelectedCategory] = useState('html');
  const [showLibrary, setShowLibrary] = useState(false);

  const categories = Object.keys(CODE_SNIPPETS);
  const currentSnippets = CODE_SNIPPETS[selectedCategory] || [];

  const handleInsertSnippet = (code) => {
    onInsert(code);
    onToast('✨ Snippet inserted into editor!', 'success');
    setShowLibrary(false);
  };

  return (
    <div className="snippets-library">
      <button
        className="snippets-btn"
        onClick={() => setShowLibrary(!showLibrary)}
        title="Insert code snippets"
      >
        📚 Snippets
      </button>

      {showLibrary && (
        <div className="snippets-panel">
          <div className="snippets-header">
            <h3>📚 Code Snippets</h3>
            <button 
              className="close-btn"
              onClick={() => setShowLibrary(false)}
            >
              ✕
            </button>
          </div>

          <div className="snippets-categories">
            {categories.map(cat => (
              <button
                key={cat}
                className={`category-btn ${cat === selectedCategory ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="snippets-list">
            {currentSnippets.map((snippet, idx) => (
              <div key={idx} className="snippet-item">
                <div className="snippet-name">{snippet.name}</div>
                <div className="snippet-preview">
                  {snippet.code.substring(0, 100)}...
                </div>
                <button
                  className="insert-snippet-btn"
                  onClick={() => handleInsertSnippet(snippet.code)}
                >
                  Insert
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

