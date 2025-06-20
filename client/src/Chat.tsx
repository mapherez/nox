import { useState, useRef, useEffect } from 'react';
import Message from './Message';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }, [messages, loading]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Msg = { role: 'user', content: input };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);

    const res = await fetch('http://localhost:3001/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg.content }),
    });

    const reader = res.body?.getReader();
    if (!reader) { setLoading(false); return; }

    const decoder = new TextDecoder();
    let buffer = '';
    let assistant = '';
    let doneReading = false;
    while (!doneReading) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') { doneReading = true; break; }
        assistant += data;
        setMessages(prev => {
          const arr = [...prev];
          const last = arr[arr.length - 1];
          if (last && last.role === 'assistant') {
            arr[arr.length - 1] = { role: 'assistant', content: assistant };
          } else {
            arr.push({ role: 'assistant', content: assistant });
          }
          return arr;
        });
      }
    }
    setLoading(false);
  }

  return (
    <>
      <div id="chat-container">
        <div id="messages" ref={chatRef}>
          {messages.map((m, i) => (
            <Message key={i} role={m.role} content={m.content} />
          ))}
          {loading && (
            <div className="message assistant">
              <span className="thinking">Nox is thinking</span>
            </div>
          )}
        </div>
      </div>
      <form id="input-form" onSubmit={sendMessage}>
        <div id="input-container">
          <input
            id="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message"
            autoComplete="off"
          />
          <button id="send-button" type="submit" aria-label="Send">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              className="icon"
            >
              <path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z" />
            </svg>
          </button>
        </div>
        <button id="stop-button" type="button" disabled>
          Stop
        </button>
      </form>
    </>
  );
}
