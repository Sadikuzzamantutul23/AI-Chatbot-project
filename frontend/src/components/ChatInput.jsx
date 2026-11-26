import { useState } from "react";

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");
  const submit = (event) => { event.preventDefault(); if (!message.trim() || disabled) return; onSend(message); setMessage(""); };
  const keyDown = (event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(event); } };
  return <div className="composer-wrap"><form onSubmit={submit} className="composer"><textarea value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={keyDown} placeholder="Message Clarity…" rows={1} disabled={disabled} aria-label="Your message" /><button className="send-button" type="submit" disabled={disabled || !message.trim()} aria-label="Send message">{disabled ? <span className="spinner small-spinner"/> : "↑"}</button></form><div className="composer-footnote">AI can make mistakes. Check important information. <span>↵ to send · Shift + ↵ for a new line</span></div></div>;
}
