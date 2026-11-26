import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export default function ChatMessages({ messages = [], sending, onRegenerate }) {
  const bottom = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);
  const copy = async (message) => { await navigator.clipboard.writeText(message.content); setCopiedId(message.id); setTimeout(() => setCopiedId(null), 1500); };
  return <div className="messages-scroll"><div className="messages-column">{messages.map((message, index) => <article className={`message-row ${message.role}`} key={message.id}>
    <div className={`message-avatar ${message.role}`}>{message.role === "assistant" ? "✦" : "A"}</div>
    <div className="message-body"><div className="message-label">{message.role === "assistant" ? "Clarity" : "You"}</div>
      <div className={`message-content ${message.role}`}>
        {message.role === "assistant" ? <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: CodeBlock }}>{message.content}</ReactMarkdown> : message.content}
      </div>
      {message.role === "assistant" && <div className="message-actions assistant"><button onClick={() => copy(message)}>{copiedId === message.id ? "✓ Copied" : "▢ Copy"}</button>{index === messages.length - 1 && <button onClick={onRegenerate}>↻ Regenerate</button>}</div>}
      {message.role === "user" && <div className="message-actions user"><button onClick={() => copy(message)}>{copiedId === message.id ? "✓ Copied" : "▢ Copy"}</button></div>}
    </div>
  </article>)}{sending && <article className="message-row assistant"><div className="message-avatar assistant">✦</div><div className="message-body"><div className="message-label">Clarity</div><div className="typing"><i/><i/><i/></div></div></article>}<div ref={bottom}/></div></div>;
}

function CodeBlock({ children }) {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    const code = preRef.current?.querySelector("code")?.innerText || "";
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return <div className="code-block-wrap"><button className="code-copy" onClick={copyCode}>{copied ? "✓ Copied" : "Copy code"}</button><pre ref={preRef}>{children}</pre></div>;
}
