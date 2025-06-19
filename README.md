# Nox

Local-first AI assistant prototype.

## Project Structure

- `client/` - React + Vite + TypeScript frontend
- `server/` - Express backend running a local LLaMA model via `node-llama-cpp`

## Development

### Client
```bash
cd client
npm install
npm run dev
```

### Server
```bash
cd server
npm install
npm start
```

The server exposes a `POST /chat` endpoint that streams responses using the SSE `data: chunk\n\n` format.
