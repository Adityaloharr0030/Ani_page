# AI Code Editor

A modern, AI-powered web-based code editor with intelligent code generation, real-time preview, and multi-file support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-61dafb.svg)

## 🌟 Features

- **🤖 AI-Powered Assistance** - Generate, explain, fix, and optimize code using advanced AI
- **💻 Multi-Language Support** - HTML, CSS, JavaScript, SQL, JSON, and Markdown
- **🎨 Live Preview** - Real-time HTML/CSS/JS preview with secure iframe sandboxing
- **📁 File Management** - Create, edit, and manage multiple files with tab-based interface
- **🗄️ SQL Playground** - Execute SQL queries on an in-memory database
- **🎨 Beautiful UI** - Modern glassmorphism design with dark/light themes
- **🔒 Secure** - Input validation, rate limiting, XSS protection, and CSP headers

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/ai-code-editor.git
   cd ai-code-editor
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd ai-code-editor/server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `ai-code-editor/server` directory:
   ```env
   PORT=4000
   OPENAI_API_KEY=your_openai_api_key_here
   PERPLEXITY_API_KEY=your_perplexity_api_key_here
   NODE_ENV=development
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4000
   ```

4. **Start the application**
   
   Open two terminal windows:
   
   **Terminal 1 - Start Backend:**
   ```bash
   cd ai-code-editor/server
   npm run dev
   ```
   
   **Terminal 2 - Start Frontend:**
   ```bash
   cd ai-code-editor/client
   npm run dev
   ```

5. **Open your browser**
   
   Navigate to `http://localhost:5173`

## 📖 Usage

### AI Assistant

- **Generate Code**: Describe what you want in natural language
- **Explain Code**: Get detailed explanations of complex code
- **Fix Bugs**: Automatically identify and fix errors
- **Optimize**: Improve code performance and readability
- **Review**: Get comprehensive code reviews with best practices

### File Management

- Click the `+` button to create new files
- Switch between files using tabs
- Auto-detection of file types based on extensions
- Download individual files or export entire project as ZIP

### SQL Playground

- Pre-loaded with sample database tables
- Execute SELECT queries safely
- View results in formatted tables
- Reset database to initial state

## 🛠️ Technology Stack

### Frontend
- React 18
- Vite
- CodeMirror (code editing)
- Modern CSS with CSS variables

### Backend
- Node.js & Express
- OpenAI API
- Perplexity API
- In-memory SQLite

## 📁 Project Structure

```
ai-code-editor/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   └── App.jsx      # Main app component
│   └── package.json
├── server/              # Express backend
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── middleware/      # Express middleware
│   └── package.json
└── README.md
```

## 🔐 Security Features

- Input sanitization and validation
- Rate limiting (60 requests/minute global, 20/minute for AI)
- SQL injection prevention (read-only queries)
- XSS protection in preview iframe
- Content Security Policy headers
- CORS with origin whitelisting

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Built with ❤️ using React, Express, and OpenAI**
