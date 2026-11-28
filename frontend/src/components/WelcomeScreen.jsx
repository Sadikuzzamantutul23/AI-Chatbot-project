import { ArrowUpRight, Code2, Lightbulb, LifeBuoy, PenLine } from "lucide-react";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true };
const suggestions = [
  { Icon: PenLine, title: "Write something", description: "Draft, refine, or get unstuck on a first draft.", prompt: "Help me write a first draft about" },
  { Icon: Lightbulb, title: "Explore an idea", description: "Think through a question or learn something new.", prompt: "Help me explore this idea:" },
  { Icon: LifeBuoy, title: "Solve a problem", description: "Break down a challenge into practical next steps.", prompt: "Help me solve this problem:" },
  { Icon: Code2, title: "Build with code", description: "Debug, explain, or start a technical project.", prompt: "Help me build this with code:" },
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return <section className="flex min-h-full flex-1 items-center justify-center overflow-y-auto px-6 py-10 max-md:px-[18px] max-md:py-8" aria-labelledby="welcome-heading"><div className="my-auto w-full max-w-3xl">
    <div className="mx-auto mb-[22px] grid size-12 place-items-center rounded-2xl border border-border bg-surface-soft text-[23px] text-accent">✦</div><p className="mb-2 text-center text-[10px] font-bold tracking-[.16em] text-ink-muted">A LITTLE MORE CLARITY</p><h1 className="m-0 text-center text-4xl font-semibold tracking-tight leading-tight text-ink max-md:text-[32px]">What’s on your mind?</h1><p className="mb-[30px] mt-3 text-center text-sm leading-relaxed text-ink-muted max-md:mb-6 max-md:text-[13px]">A thought, a question, a challenge. Start wherever you are.</p>
    <div className="grid grid-cols-2 gap-3 max-[520px]:grid-cols-1 max-md:gap-[9px]">{suggestions.map(({ Icon, title, description, prompt }) => <button className="group relative grid min-h-[105px] grid-cols-[34px_minmax(0,1fr)] grid-rows-[auto_auto] items-start gap-x-3 rounded-xl border border-border bg-surface p-[18px] text-left shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-border-strong hover:bg-surface-soft hover:shadow-md focus-visible:border-border-strong focus-visible:bg-surface-soft max-md:min-h-[99px] max-md:grid-cols-[30px_minmax(0,1fr)] max-md:p-[14px] max-[520px]:min-h-[76px]" key={title} onClick={() => onSuggestionClick(prompt)}><span className="row-span-2 grid size-8 place-items-center rounded-[10px] bg-accent-soft text-accent-strong max-md:size-[30px]"><Icon {...iconProps} /></span><span className="mb-1 mr-6 mt-px text-[13px] font-semibold text-ink-secondary max-md:text-xs">{title}</span><span className="pr-2.5 text-xs leading-relaxed text-ink-muted max-md:text-[11px]">{description}</span><ArrowUpRight className="absolute right-[15px] top-[15px] size-[18px] stroke-[1.75] text-ink-subtle opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100 max-[520px]:opacity-100" aria-hidden="true" /></button>)}</div>
  </div></section>;
}
