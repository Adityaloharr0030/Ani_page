import React, { useState } from 'react';

const API_URL = '/api';

export default function SQLEditor({ onToast }) {
  const [query, setQuery] = useState('SELECT * FROM users');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleExecute = async () => {
    if (!query.trim()) {
      onToast('Please enter a SQL query', 'warning');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/sql/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const data = await res.json();

      if (data.ok) {
        setResults(data);
        onToast(`Query executed: ${data.rowCount} rows returned`, 'success');
      } else {
        onToast(data.error || 'Query failed', 'error');
        setResults(null);
      }
    } catch (error) {
      console.error('SQL error:', error);
      onToast('Failed to execute query', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      const res = await fetch(`${API_URL}/sql/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (data.ok) {
        onToast('Database reset successfully', 'success');
        setResults(null);
      }
    } catch (error) {
      onToast('Failed to reset database', 'error');
    }
  };

  return (
    <div className="card sql-editor">
      <h3>🗄️ SQL Playground</h3>

      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Enter SQL query (SELECT only)..."
        rows={4}
      />

      <div className="button-group">
        <button onClick={handleExecute} disabled={loading}>
          {loading ? <span className="spinner"></span> : '▶️ Execute'}
        </button>
        <button onClick={handleReset} className="secondary">
          🔄 Reset DB
        </button>
      </div>

      {results && results.rows && (
        <div className="results-area">
          <h4>Results ({results.rowCount} rows):</h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {results.columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.rows.map((row, i) => (
                  <tr key={i}>
                    {results.columns.map(col => (
                      <td key={col}>{row[col]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

