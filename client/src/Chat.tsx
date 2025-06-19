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
    let assistant = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      assistant += new TextDecoder().decode(value);
      // remove "data: " prefix and newline
      assistant = assistant.replace(/^data: /, '');
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
    setLoading(false);
  }

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%'}}>
      <div className="chat" ref={chatRef}>
        {messages.map((m,i) => (
          <Message key={i} role={m.role} content={m.content} />
        ))}
        {loading && (
          <div className="message assistant">
            <div className="bubble"><span className="typing">Nox is thinking<span className="blink">|</span></span></div>
          </div>
        )}
      </div>
      <form className="input-area" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask Nox..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
