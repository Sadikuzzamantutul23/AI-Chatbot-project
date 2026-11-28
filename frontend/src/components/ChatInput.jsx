import { useEffect, useRef, useState } from "react";
import { ArrowUp, LoaderCircle } from "lucide-react";

export default function ChatInput({ onSend, disabled }) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);
  const submit = (event) => {
    event.preventDefault();
    if (!message.trim() || disabled) return;
    onSend(message);
    setMessage("");
  };
  const keyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      submit(event);
    }
  };

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const maxHeight = 24 * 6;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [message]);

  return <footer className="z-[2] w-[min(calc(100%-3rem),50rem)] shrink-0 self-center bg-page pb-[13px] pt-2.5 max-md:w-[calc(100%-1.75rem)] max-md:pb-[max(10px,env(safe-area-inset-bottom))] max-md:pt-[7px]"><form onSubmit={submit} className="flex min-h-[58px] items-end gap-2.5 rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-sm transition-all duration-150 focus-within:border-accent focus-within:ring-[3px] focus-within:ring-accent/20"><textarea ref={textareaRef} value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={keyDown} placeholder="Message Clarity…" rows={1} disabled={disabled} aria-label="Your message" className="min-h-6 max-h-36 flex-1 resize-none border-0 bg-transparent py-[3px] text-sm leading-6 text-ink outline-none placeholder:text-ink-muted focus:ring-0" /><button className={`grid size-9 shrink-0 place-items-center rounded-[11px] transition-colors duration-150 ${message.trim() ? "bg-accent-strong text-white hover:bg-accent" : "bg-border text-ink-subtle"}`} type="submit" disabled={disabled || !message.trim()} aria-label={disabled ? "Waiting for a response" : "Send message"}>{disabled ? <LoaderCircle className="animate-spin" size={18} strokeWidth={1.75} aria-hidden="true" /> : <ArrowUp size={18} strokeWidth={1.75} aria-hidden="true" />}</button></form><div className="flex justify-between gap-2 px-1 pt-2 text-[10px] text-ink-muted max-md:justify-center max-md:text-[9px]"><span className="max-md:hidden">AI can make mistakes. Check important information.</span><span><kbd className="text-ink-muted">Enter</kbd> to send · <kbd className="text-ink-muted">Shift</kbd> + <kbd className="text-ink-muted">Enter</kbd> for a new line</span></div></footer>;
}
