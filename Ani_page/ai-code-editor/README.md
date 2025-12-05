# 🤖 Enhanced AI Code Editor

A modern, full-featured AI-powered code editor with advanced security, multi-file support, and beautiful UI.

## ✨ Features

### 🔒 Security Enhancements
- Input sanitization and validation
- Rate limiting per user/IP
- Enhanced CSP headers
- SQL injection prevention
- XSS protection in preview

### 🚀 Core Features
- **AI-Powered Assistance**: Code generation, explanation, bug fixing, optimization, and review
- **Multi-File Management**: Tab-based file system with add/delete/rename
- **Live Preview**: Real-time HTML preview with iframe sandboxing
- **SQL Playground**: Execute SELECT queries on in-memory SQLite database
- **Code Formatting**: Built-in code formatting support
- **Syntax Highlighting**: Full CodeMirror integration for multiple languages

### 🎨 UI/UX Features
- Modern glassmorphism design
- Dark/Light theme switcher
- Resizable panels (horizontal/vertical layout)
- Toast notifications for user feedback
- Responsive layout for mobile and tablet
- Auto-save functionality
- Keyboard shortcuts support

### 💻 Supported Languages
- HTML
- CSS
- JavaScript
- SQL
- JSON
- Markdown

## 🛠️ Installation

### Prerequisites
- Node.js 18+ and npm
- OpenAI API key
- Perplexity API key (optional)

### Setup

1. **Clone/Extract the project**
   ```bash
   cd ai-code-editor
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**
   
   The `.env` file is already configured in `server/.env` with your API keys:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `PERPLEXITY_API_KEY`: Your Perplexity API key
   - `PORT`: Server port (default: 4000)
   - `ALLOWED_ORIGINS`: CORS allowed origins

## 🚀 Running the Application

### Development Mode

1. **Start the backend server** (Terminal 1):
   ```bash
   cd server
   npm run dev
   ```
   Server will run on http://localhost:4000

2. **Start the frontend client** (Terminal 2):
   ```bash
   cd client
   npm run dev
   ```
   Client will run on http://localhost:5173

3. **Open your browser**
   Navigate to http://localhost:5173

### Production Build

1. **Build the client**
   ```bash
   cd client
   npm run build
   ```

2. **Start production server**
   ```bash
   cd ../server
   NODE_ENV=production npm start
   ```
   The server will serve the built client files on http://localhost:4000

## 📁 Project Structure

```
ai-code-editor/
├── server/
│   ├── server.js              # Express server with security middleware
│   ├── routes/
│   │   ├── ai.js              # AI endpoints (OpenAI integration)
│   │   └── sql.js             # SQL execution endpoints
│   ├── utils/
│   │   ├── openai.js          # OpenAI API wrapper
│   │   ├── perplexity.js      # Perplexity API wrapper
│   │   └── sanitize.js        # Input sanitization utilities
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── .env                   # Environment variables
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Editor.jsx     # CodeMirror editor component
│   │   │   ├── AIAssistant.jsx # AI chat interface
│   │   │   ├── SQLEditor.jsx  # SQL query interface
│   │   │   ├── Preview.jsx    # Live HTML preview
│   │   │   ├── FileManager.jsx # File tabs management
│   │   │   └── Toast.jsx      # Toast notifications
│   │   ├── hooks/
│   │   │   └── useLocalStorage.js # LocalStorage hook
│   │   ├── App.jsx            # Main application component
│   │   ├── main.jsx           # React entry point
│   │   └── styles.css         # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## 🎯 Usage Guide

### AI Assistant Modes

1. **Generate**: Create new code from natural language descriptions
   - Example: "Create a responsive navbar with dropdown menu"

2. **Explain**: Get detailed explanations of existing code
   - Select code in editor and click "Explain"

3. **Fix**: Automatically fix bugs in your code
   - Paste buggy code and optionally describe the issue

4. **Optimize**: Improve code performance and quality
   - Specify focus area: performance, readability, etc.

5. **Review**: Get comprehensive code review
   - Security, best practices, and improvement suggestions

### SQL Playground

- Pre-loaded with sample `users` and `products` tables
- Execute SELECT queries only (security restriction)
- View results in formatted table
- Reset database to initial state

### File Management

- Click `+` to add new files
- Click tab to switch between files
- Click `×` to close files
- Auto-detects language from file extension

### Keyboard Shortcuts

- `Ctrl/Cmd + S`: Save (auto-save is enabled)
- Standard CodeMirror shortcuts for editing

## 🔐 Security Features

### Input Validation
- Maximum input length limits
- Null byte removal
- Excessive whitespace trimming

### Rate Limiting
- Global: 60 requests/minute
- AI endpoints: 20 requests/minute
- IP-based tracking

### SQL Safety
- Read-only SELECT queries
- Blocks DROP, DELETE, UPDATE, INSERT, ALTER
- In-memory database (no persistent data)

### Preview Sandbox
- Iframe with restricted permissions
- `allow-scripts` and `allow-same-origin` only
- No external resource loading

### Headers
- Helmet.js security headers
- CORS with origin whitelisting
- Content Security Policy (CSP)
- HSTS enabled

## 🎨 Customization

### Themes
- Toggle between dark and light modes
- Themes persist in localStorage
- Applies to both editor and UI

### Layout
- Switch between horizontal and vertical splits
- Resizable panels (drag divider)

## 📊 API Endpoints

### AI Endpoints (`/api/ai/`)
- `POST /generate-code`: Generate code from prompt
- `POST /explain-code`: Explain code functionality
- `POST /fix-bug`: Fix bugs in code
- `POST /optimize-code`: Optimize code
- `POST /review-code`: Comprehensive code review
- `POST /research`: Web research with Perplexity
- `POST /auth/validate-keys`: Validate API keys

### SQL Endpoints (`/api/sql/`)
- `POST /execute`: Execute SQL query
- `GET /schema`: Get database schema
- `POST /reset`: Reset database to initial state

### Health Check
- `GET /api/health`: Server health and stats

## 🐛 Troubleshooting

### Server won't start
- Check if port 4000 is available
- Verify API keys in `.env` file
- Check Node.js version (18+ required)

### Client won't connect to server
- Ensure server is running on port 4000
- Check CORS settings in server `.env`
- Verify proxy settings in `vite.config.js`

### AI features not working
- Verify OpenAI API key is valid
- Check rate limits haven't been exceeded
- Review browser console for errors
- Ensure sufficient API credits

## 📝 Environment Variables

```env
PORT=4000
OPENAI_API_KEY=your_openai_key
PERPLEXITY_API_KEY=your_perplexity_key
USE_SERVER_SIDE_OPENAI_KEY=true
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4000
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=60
```

## 🚀 Performance

- **Caching**: 10-minute TTL for AI responses
- **Debouncing**: Auto-save debounced to 1 second
- **Lazy Loading**: Components loaded on demand
- **Optimized Bundling**: Vite for fast builds

## 🔮 Future Enhancements

- [ ] GitHub integration for saving projects
- [ ] Collaborative editing with WebSockets
- [ ] More AI providers (Anthropic Claude, etc.)
- [ ] Code snippet library
- [ ] Advanced debugging tools
- [ ] Git version control
- [ ] Terminal integration
- [ ] Plugin system
- [ ] Export to CodePen/JSFiddle

## 📄 License

MIT License - Feel free to use for personal or commercial projects

## 🤝 Contributing

Contributions welcome! Please follow standard Git workflow:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📧 Support

For issues or questions:
- Open a GitHub issue
- Check existing documentation
- Review troubleshooting section

---

**Built with ❤️ using React, Express, OpenAI, and modern web technologies**

