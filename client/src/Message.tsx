export interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

export default function Message({ role, content }: MessageProps) {
  return (
    <div className={`message ${role}`}> 
      <div className="bubble">{content}</div>
    </div>
  );
}
