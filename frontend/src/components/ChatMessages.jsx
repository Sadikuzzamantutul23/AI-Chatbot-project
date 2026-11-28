import { useEffect, useRef, useState } from "react";
import { Check, Copy, RotateCcw, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { toast } from "sonner";

export default function ChatMessages({ messages = [], sending, onRegenerate }) {
  const bottom = useRef(null);
  const [copiedId, setCopiedId] = useState(null);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, sending]);
  const copy = async (message) => {
    try { await navigator.clipboard.writeText(message.content); setCopiedId(message.id); toast.success("Message copied"); setTimeout(() => setCopiedId(null), 1500); }
    catch { toast.error("Could not copy this message"); }
  };
  const icon = "size-[18px] shrink-0 stroke-[1.75]";
  return <div className="min-h-0 flex-1 overflow-y-auto scroll-smooth"><div className="mx-auto w-full max-w-3xl px-6 pb-8 pt-7 max-md:px-4 max-md:pt-5">{messages.map((message, index) => <article className={`mb-7 flex items-start gap-3 max-md:mb-6 max-md:gap-2 ${message.role === "user" ? "justify-end" : ""}`} key={message.id}>
    {message.role === "assistant" && <div className="mt-6 grid size-7 shrink-0 place-items-center rounded-[9px] bg-accent-soft text-accent-strong" aria-label="Clarity"><Sparkles {...iconProps(icon)} /></div>}
    <div className={`flex min-w-0 max-w-[min(100%,690px)] flex-1 flex-col items-start ${message.role === "user" ? "max-w-[min(88%,620px)] flex-none items-end max-md:max-w-[92%]" : ""}`}><div className="mb-1 text-[11px] font-semibold text-ink-muted">{message.role === "assistant" ? "Clarity" : "You"}</div>
      <div className={message.role === "user" ? "max-w-full whitespace-pre-wrap rounded-[15px_15px_4px_15px] border border-border bg-surface-soft px-3.5 py-2.5 text-sm leading-relaxed text-ink" : "w-full break-words text-sm leading-[1.75] text-ink-secondary [&_p]:mb-3 [&_p:last-child]:mb-0 [&_h1]:mb-2 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-3 [&_blockquote]:border-l-[3px] [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-ink-muted [&_a]:text-accent-strong [&_a]:underline [&_a]:underline-offset-2 [&_code:not(pre_code)]:rounded [&_code:not(pre_code)]:bg-surface-hover [&_code:not(pre_code)]:px-1 [&_code:not(pre_code)]:py-0.5 [&_code:not(pre_code)]:font-mono [&_pre]:my-3 [&_pre]:overflow-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-[var(--code-border)] [&_pre]:bg-[var(--code-bg)] [&_pre]:px-4 [&_pre]:pb-4 [&_pre]:pt-11 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:leading-relaxed [&_pre]:text-[var(--code-text)] [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-border [&_th]:bg-surface-soft [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-2 [&_.hljs-comment]:text-slate-400 [&_.hljs-string]:text-amber-200 [&_.hljs-keyword]:text-rose-300 [&_.hljs-function]:text-sky-300 [&_.hljs-title]:text-sky-300 [&_.hljs-number]:text-orange-300 [&_.hljs-built_in]:text-cyan-300"}>
        {message.role === "assistant" ? <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]} components={{ pre: CodeBlock }}>{message.content}</ReactMarkdown> : message.content}
      </div>
      {message.role === "assistant" && <div className="mt-2 flex gap-4"><button className="inline-flex items-center gap-1.5 py-1 text-[11px] text-ink-muted hover:text-accent-strong disabled:opacity-50" aria-label="Copy assistant response" onClick={() => copy(message)}>{copiedId === message.id ? <Check {...iconProps(icon)} /> : <Copy {...iconProps(icon)} />}{copiedId === message.id ? "Copied" : "Copy"}</button>{index === messages.length - 1 && <button className="inline-flex items-center gap-1.5 py-1 text-[11px] text-ink-muted hover:text-accent-strong disabled:opacity-50" aria-label="Regenerate assistant response" disabled={sending} onClick={onRegenerate}><RotateCcw {...iconProps(icon)} />Regenerate</button>}</div>}
      {message.role === "user" && <div className="mt-2 flex justify-end"><button className="inline-flex items-center gap-1.5 py-1 text-[11px] text-ink-muted hover:text-accent-strong" aria-label="Copy your message" onClick={() => copy(message)}>{copiedId === message.id ? <Check {...iconProps(icon)} /> : <Copy {...iconProps(icon)} />}{copiedId === message.id ? "Copied" : "Copy"}</button></div>}
    </div>
  </article>)}{sending && <article className="mb-7 flex items-start gap-3 max-md:gap-2"><div className="mt-6 grid size-7 shrink-0 place-items-center rounded-[9px] bg-accent-soft text-accent-strong"><Sparkles {...iconProps(icon)} /></div><div><div className="mb-1 text-[11px] font-semibold text-ink-muted">Clarity</div><div className="flex h-8 items-center gap-1"><i className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:0ms]"/><i className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:150ms]"/><i className="size-1.5 animate-bounce rounded-full bg-accent [animation-delay:300ms]"/></div></div></article>}<div ref={bottom} /></div></div>;
}

function iconProps(className) { return { size: 18, strokeWidth: 1.75, className, "aria-hidden": true }; }

function CodeBlock({ children }) {
  const preRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    const code = preRef.current?.querySelector("code")?.innerText || "";
    try { await navigator.clipboard.writeText(code); setCopied(true); toast.success("Code copied"); setTimeout(() => setCopied(false), 1500); }
    catch { toast.error("Could not copy this code"); }
  };
  return <div className="relative"><button className="absolute right-2 top-2 z-10 inline-flex items-center gap-1.5 rounded-md border border-white/20 bg-white/10 px-2 py-1 text-[10px] text-white transition-colors hover:bg-white/20" onClick={copyCode} aria-label="Copy code block">{copied ? <Check {...iconProps("size-[18px] shrink-0 stroke-[1.75]")} /> : <Copy {...iconProps("size-[18px] shrink-0 stroke-[1.75]")} />}{copied ? "Copied" : "Copy code"}</button><pre ref={preRef}>{children}</pre></div>;
}
