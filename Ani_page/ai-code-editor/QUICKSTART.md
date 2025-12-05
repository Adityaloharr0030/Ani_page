# 🚀 Quick Start Guide - AI Code Editor

## ✅ Setup Complete!

Your Enhanced AI Code Editor has been successfully set up with all dependencies installed.

## 📁 Project Structure

```
ai-code-editor/
├── server/           ✅ Backend (Express + OpenAI + Perplexity)
├── client/           ✅ Frontend (React + Vite + CodeMirror)
├── README.md         ✅ Full documentation
└── .gitignore        ✅ Git configuration
```

## 🎯 How to Run

### Option 1: Development Mode (Recommended)

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```
✅ Server running at: http://localhost:4000

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```
✅ Client running at: http://localhost:5173

**Then open:** http://localhost:5173 in your browser

### Option 2: Production Mode

```bash
# Build client
cd client
npm run build

# Start server (serves built client)
cd ../server
$env:NODE_ENV="production"; npm start
```
✅ Full app running at: http://localhost:4000

## 🔑 API Keys Configured

Your `.env` file is already configured with:
- ✅ OpenAI API Key
- ✅ Perplexity API Key
- ✅ Port: 4000
- ✅ CORS origins

## 🎨 Features Available

### AI Assistant (5 Modes)
1. **Generate** - Create code from descriptions
2. **Explain** - Understand existing code
3. **Fix** - Debug and fix errors
4. **Optimize** - Improve performance
5. **Review** - Get code quality feedback

### File Manager
- Multi-file support with tabs
- Add/delete/rename files
- Auto-detect language from extension
- Auto-save to localStorage

### SQL Playground
- Pre-loaded sample database
- Execute SELECT queries
- View results in tables
- Reset database anytime

### Live Preview
- Real-time HTML rendering
- Sandboxed iframe
- Console message capture

### UI Features
- 🌓 Dark/Light theme toggle
- ⬌ Horizontal/Vertical layout
- 🔔 Toast notifications
- 📱 Responsive design
- ⚡ Auto-save

## 🧪 Try It Out!

### Example 1: Generate Code
1. Click **Generate** in AI Assistant
2. Type: "Create a responsive pricing card with 3 tiers"
3. Click **✨ Send**
4. Click **📋 Insert to Editor** to use the code
5. Click **▶️ Preview** to see it live

### Example 2: SQL Query
1. In SQL Playground, try:
   ```sql
   SELECT * FROM users WHERE id > 1
   ```
2. Click **▶️ Execute**
3. View results in the table

### Example 3: Multi-File Project
1. Click **+** in file tabs
2. Create `styles.css`
3. Write CSS code
4. Create `script.js`
5. Write JavaScript code
6. All files auto-save!

## 🛠️ Tech Stack

**Backend:**
- Express.js
- OpenAI API (GPT-4)
- Perplexity API
- Better-SQLite3
- Helmet.js (Security)
- Rate limiting

**Frontend:**
- React 18
- Vite
- CodeMirror 6
- Modern CSS

## 🔐 Security Features

✅ Input sanitization
✅ Rate limiting (60 req/min global, 20 req/min AI)
✅ SQL injection prevention (SELECT only)
✅ XSS protection
✅ CSP headers
✅ Sandboxed preview

## 📊 API Endpoints

### AI Endpoints
- POST `/api/ai/generate-code`
- POST `/api/ai/explain-code`
- POST `/api/ai/fix-bug`
- POST `/api/ai/optimize-code`
- POST `/api/ai/review-code`
- POST `/api/ai/research`

### SQL Endpoints
- POST `/api/sql/execute`
- GET `/api/sql/schema`
- POST `/api/sql/reset`

### Health Check
- GET `/api/health`

## 🐛 Troubleshooting

### "Cannot connect to server"
- Ensure server is running on port 4000
- Check if another app is using the port
- Verify `.env` file exists in server folder

### "AI features not working"
- Check OpenAI API key is valid
- Verify you have API credits
- Check browser console for errors
- Review rate limits

### "Port already in use"
Server (4000):
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F
```

Client (5173):
```bash
# Windows  
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## 🎓 Learning Resources

- Full documentation: `README.md`
- Server code: `server/server.js`
- Client code: `client/src/App.jsx`
- AI routes: `server/routes/ai.js`

## 📝 Next Steps

1. ✅ Start the development servers
2. ✅ Open http://localhost:5173
3. ✅ Try generating some code
4. ✅ Experiment with different features
5. ✅ Build something awesome!

## 🚀 Deployment (Future)

For production deployment:
- Use PM2 or similar for server
- Deploy to Vercel/Netlify (client)
- Set environment variables
- Use HTTPS
- Configure proper CORS

## 💡 Tips

- Use **Ctrl/Cmd + S** to save (auto-save is on)
- Switch themes for different times of day
- Try all 5 AI modes for different tasks
- SQL playground is safe (read-only, in-memory)
- Files persist in browser localStorage

---

## 🎉 Ready to Code!

Your Enhanced AI Code Editor is fully set up and ready to use. 

**Happy Coding! 🚀**

Need help? Check `README.md` for detailed documentation.

