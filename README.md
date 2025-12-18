# React Chess with AI

A modern, fast, and responsive Chess application built with React, Vite, and Stockfish.js.

## Features
- 🤖 **Powerful AI**: Play against Stockfish (running via Web Assembly/Web Worker).
- ⚡ **Fast**: Built on Vite.
- 🎨 **Beautiful**: Styled with Tailwind CSS and `react-chessboard`.
- 🧠 **Smart**: Legal move validation, special moves (castling, en passant, promotion), and game state detection (checkmate, stalemate).

## Getting Started

### Prerequisites
- Node.js (v18+)

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Download Stockfish (already included in logic, but ensure `public/stockfish.js` exists):
   ```bash
   # If missing
   Invoke-WebRequest -Uri "https://raw.githubusercontent.com/nmrugg/stockfish.js/master/src/stockfish.js" -OutFile "public/stockfish.js"
   ```

### Running Locally
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Testing
```bash
npx vitest run
```

### Building for Production
```bash
npm run build
```

## Architecture
- `src/game`: Core game logic and state management (Zustand).
- `src/ai`: Stockfish worker interface.
- `src/ui`: React components.
