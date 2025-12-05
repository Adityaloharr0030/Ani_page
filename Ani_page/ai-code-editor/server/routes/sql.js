/**
 * SQL routes for executing queries (in-memory SQLite)
 */
const express = require('express');
const router = express.Router();
const Database = require('better-sqlite3');
const auth = require('../middleware/auth');
const { validateSQL, sanitizeInput } = require('../utils/sanitize');

// In-memory database instance
let db;

// Initialize database
const initDB = () => {
  if (!db) {
    db = new Database(':memory:');
    
    // Create sample tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        category TEXT,
        stock INTEGER DEFAULT 0
      );
      
      INSERT OR IGNORE INTO users (id, name, email) VALUES 
        (1, 'Alice Johnson', 'alice@example.com'),
        (2, 'Bob Smith', 'bob@example.com'),
        (3, 'Charlie Brown', 'charlie@example.com');
        
      INSERT OR IGNORE INTO products (id, name, price, category, stock) VALUES
        (1, 'Laptop', 999.99, 'Electronics', 50),
        (2, 'Mouse', 29.99, 'Electronics', 200),
        (3, 'Desk Chair', 199.99, 'Furniture', 30),
        (4, 'Notebook', 4.99, 'Stationery', 500);
    `);
  }
  return db;
};

// Execute SQL query
router.post('/execute', auth, async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }
    
    const sanitized = sanitizeInput(query).trim();
    
    // Validate query (block destructive operations)
    if (!validateSQL(sanitized)) {
      return res.status(403).json({ 
        error: 'Forbidden: Only SELECT queries are allowed in this demo' 
      });
    }
    
    const database = initDB();
    
    // Check if it's a SELECT query
    if (sanitized.toLowerCase().startsWith('select')) {
      const stmt = database.prepare(sanitized);
      const rows = stmt.all();
      
      res.json({ 
        ok: true, 
        rows, 
        rowCount: rows.length,
        columns: rows.length > 0 ? Object.keys(rows[0]) : []
      });
    } else {
      res.status(403).json({ 
        error: 'Only SELECT queries are allowed in demo mode' 
      });
    }
  } catch (err) {
    console.error('SQL execution error:', err);
    res.status(400).json({ 
      ok: false, 
      error: err.message 
    });
  }
});

// Get database schema
router.get('/schema', auth, (req, res) => {
  try {
    const database = initDB();
    
    const tables = database.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' 
      ORDER BY name
    `).all();
    
    const schema = {};
    tables.forEach(({ name }) => {
      const columns = database.prepare(`PRAGMA table_info(${name})`).all();
      schema[name] = columns;
    });
    
    res.json({ ok: true, schema });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Reset database
router.post('/reset', auth, (req, res) => {
  try {
    if (db) {
      db.close();
      db = null;
    }
    initDB();
    res.json({ ok: true, message: 'Database reset successfully' });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

module.exports = router;

