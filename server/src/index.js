import express from 'express';
import cors from 'cors';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
app.use(cors());
app.use(express.json());

let session;
let model;

(async () => {
  try {
    const llama = await getLlama();
    model = await llama.loadModel({
      modelPath: process.env.LLAMA_MODEL || path.join(__dirname, '../models/mistral-7b.gguf'),
      gpuLayers: 20,
      useMmap: true
    });
    const context = await model.createContext();
    session = new LlamaChatSession({ contextSequence: context.getSequence() });
    console.log('Model loaded');
  } catch (err) {
    console.error('Failed to init model:', err);
  }
})();

app.post('/chat', async (req, res) => {
  const message = req.body.message || '';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!session) {
    res.write('data: Error: model not loaded\n\n');
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    await session.prompt(message, {
      onToken(tokens) {
        const text = model.detokenize(tokens);
        res.write('data: ' + text + '\n\n');
      }
    });
  } catch (err) {
    res.write('data: Error: ' + err.message + '\n\n');
  } finally {
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server running on', PORT);
});
