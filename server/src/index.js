const express = require('express');
const { createLLM } = require('node-llama-cpp');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

// simple in-memory model init
let llama;
(async () => {
  try {
    llama = await createLLM({
      modelPath: process.env.LLAMA_MODEL || 'models/ggml-model.bin',
    });
  } catch (err) {
    console.error('Failed to init model:', err);
  }
})();

app.post('/chat', async (req, res) => {
  const message = req.body.message || '';
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (!llama) {
    res.write(`data: Error: model not loaded\n\n`);
    return res.end();
  }

  try {
    for await (const chunk of llama.createCompletionStream({ prompt: message })) {
      res.write(`data: ${chunk}\n\n`);
    }
  } catch (err) {
    res.write(`data: Error: ${err.message}\n\n`);
  } finally {
    res.end();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('Server running on', PORT);
});
