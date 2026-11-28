import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Ellipsis, LogOut, MessageSquare, Moon, Plus, Settings, Shield, Sun, X } from "lucide-react";

const iconProps = { size: 18, strokeWidth: 1.75, "aria-hidden": true };

function groupConversations(conversations) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 7);
  const groups = ["Today", "Yesterday", "Previous 7 days", "Earlier"].map((label) => ({ label, chats: [] }));
  conversations.forEach((chat) => {
    const date = new Date(chat.updated_at || chat.created_at || chat.createdAt || 0);
    const day = Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const label = day?.getTime() === today.getTime() ? "Today" : day?.getTime() === yesterday.getTime() ? "Yesterday" : day && day >= weekStart ? "Previous 7 days" : "Earlier";
    groups.find((group) => group.label === label).chats.push(chat);
  });
  return groups.filter((group) => group.chats.length);
}

export default function Sidebar({ onNewChat, conversations, conversationsLoading, activeChatId, onSelectChat, user, isAdmin, onOpenAdmin, onThemeToggle, theme, onLogout, onRename, onDelete, mobileOpen, onClose }) {
  const [menuId, setMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingTitle, setRenamingTitle] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const userMenuRef = useRef(null);
  const groups = useMemo(() => groupConversations(conversations), [conversations]);

  useEffect(() => {
    if (!userMenuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") { setUserMenuOpen(false); setSettingsOpen(false); }
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key) && event.target.closest?.("[role='menu']")) {
        const items = [...userMenuRef.current.querySelectorAll("[role='menuitem']")];
        if (!items.length) return;
        event.preventDefault();
        const current = items.indexOf(document.activeElement);
        const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
        items[next].focus();
      }
    };
    const onPointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) { setUserMenuOpen(false); setSettingsOpen(false); }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, [userMenuOpen]);

  const beginRename = (chat) => { setMenuId(null); setRenamingId(chat.id); setRenamingTitle(chat.title); };
  const iconClass = "size-[18px] shrink-0 stroke-[1.75]";
  return <>
    {mobileOpen && <button className="fixed inset-0 z-10 border-0 bg-scrim md:hidden" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`relative z-20 flex h-dvh min-h-0 w-[276px] shrink-0 flex-col border-r border-border bg-sidebar px-[14px] pb-3 pt-[21px] max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:w-[min(300px,calc(100vw-54px))] max-md:shadow-xl max-md:transition-transform max-md:duration-200 ${mobileOpen ? "max-md:translate-x-0" : "max-md:-translate-x-[103%]"}`} aria-label="Chat history">
      <div className="mb-[21px] flex h-[38px] items-center justify-between px-[7px]"><div className="flex items-center gap-[9px] text-[18px] font-bold tracking-tight text-ink"><span className="grid size-[29px] place-items-center rounded-[9px] bg-accent-strong text-base text-page">✦</span><span>Clarity</span></div><button className="hidden size-9 items-center justify-center rounded-lg text-ink-secondary hover:bg-surface-hover max-md:flex" onClick={onClose} aria-label="Close sidebar"><X {...iconProps} /></button></div>
      <button className="flex h-[43px] shrink-0 items-center gap-2.5 rounded-xl border border-border bg-surface px-3 text-left text-[13px] font-semibold text-ink-secondary shadow-sm transition-colors hover:border-border-strong hover:bg-surface-hover" onClick={onNewChat}><Plus {...iconProps} className={`${iconClass} text-accent`} /><span className="flex-1">New conversation</span><kbd className="text-[11px] font-normal text-ink-subtle">⌘ K</kbd></button>
      <div className="mb-2.5 mt-6 flex justify-between px-[9px] text-[10px] font-bold tracking-[.1em] text-ink-muted"><span>YOUR CHATS</span><span>{conversations.length}</span></div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-color:var(--border-strong)_transparent] [scrollbar-width:thin]" aria-live="polite">
        {conversationsLoading ? <div className="grid gap-2 px-2 py-1" aria-label="Loading conversations">{Array.from({ length: 5 }, (_, index) => <div className="flex h-[34px] items-center gap-2.5 px-1" key={index}><i className="size-[15px] animate-pulse rounded-md bg-surface-hover" /><span className="h-[11px] w-[72%] animate-pulse rounded-lg bg-surface-hover" /></div>)}</div> : groups.length ? groups.map((group) => <section className="mt-4 first:mt-0" key={group.label} aria-label={group.label}>
          <h2 className="mb-1 px-2 text-[10px] font-semibold text-ink-subtle">{group.label}</h2>
          {group.chats.map((chat) => <div className={`group relative my-0.5 flex min-w-0 items-center rounded-lg transition-colors ${activeChatId === chat.id ? "bg-accent-soft" : "hover:bg-surface-hover"}`} key={chat.id}>
            {renamingId === chat.id ? <form className="grid w-full gap-1.5 p-1.5" onSubmit={(event) => { event.preventDefault(); onRename(chat, renamingTitle); setRenamingId(null); }}><input aria-label="Conversation title" autoFocus maxLength={255} value={renamingTitle} onChange={(event) => setRenamingTitle(event.target.value)} className="h-8 w-full rounded-md border border-border-strong bg-surface px-2 text-xs text-ink" /><div className="flex gap-1.5"><button type="submit" disabled={!renamingTitle.trim()} className="rounded-md bg-accent-strong px-2 py-1 text-xs text-page disabled:opacity-50">Save</button><button type="button" onClick={() => setRenamingId(null)} className="rounded-md border border-border px-2 py-1 text-xs text-ink-secondary">Cancel</button></div></form> : <>
              <button className="flex h-[38px] min-w-0 flex-1 items-center gap-2 rounded-lg bg-transparent px-2 text-left text-xs text-ink-secondary" title={chat.title} onClick={() => onSelectChat(chat.id)}><MessageSquare {...iconProps} className={`${iconClass} size-4 text-ink-subtle`} /><span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{chat.title}</span></button>
              <button className={`mr-1 grid size-[30px] shrink-0 place-items-center rounded-lg border-0 bg-transparent text-ink-subtle opacity-0 transition-opacity hover:bg-surface focus:opacity-100 focus-visible:opacity-100 ${menuId === chat.id ? "opacity-100" : "group-hover:opacity-100"}`} aria-label={`Actions for ${chat.title}`} aria-expanded={menuId === chat.id} onClick={() => setMenuId(menuId === chat.id ? null : chat.id)}><Ellipsis {...iconProps} /></button>
              {menuId === chat.id && <div className="absolute right-1 top-[34px] z-30 w-36 rounded-xl border border-border bg-surface p-1 shadow-xl" role="menu"><button role="menuitem" onClick={() => beginRename(chat)} className="w-full rounded-lg px-2 py-2 text-left text-xs text-ink-secondary hover:bg-surface-hover">Rename</button><button role="menuitem" className="w-full rounded-lg px-2 py-2 text-left text-xs text-danger hover:bg-danger-soft" onClick={() => { setMenuId(null); setDeletingId(chat.id); }}>Delete</button></div>}
              {deletingId === chat.id && <div className="absolute left-1 right-1 top-full z-30 flex flex-wrap items-center gap-1 rounded-lg border border-border bg-surface p-2 shadow-xl" role="group" aria-label="Confirm conversation deletion"><span className="w-full text-[11px] text-ink-secondary">Delete this conversation?</span><button className="rounded-md border border-border px-2 py-1 text-[11px] text-danger" onClick={() => { setDeletingId(null); onDelete(chat); }}>Delete</button><button className="rounded-md border border-border px-2 py-1 text-[11px] text-ink-secondary" onClick={() => setDeletingId(null)}>Cancel</button></div>}
            </>}
          </div>)}
        </section>) : <p className="px-2 text-xs text-ink-muted">Your conversations will appear here.</p>}
      </div>
      <div className="relative mt-3 shrink-0 border-t border-border pt-2.5" ref={userMenuRef}>
        {userMenuOpen && <>
          <div className="absolute inset-x-0 bottom-[70px] z-30 grid gap-0.5 rounded-xl border border-border bg-surface p-1.5 shadow-xl" role="menu" aria-label="Account menu">
            <button role="menuitem" onClick={() => setSettingsOpen(true)} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink-secondary hover:bg-surface-hover"><Settings {...iconProps} />Settings</button>
            {isAdmin && <button role="menuitem" onClick={() => { setUserMenuOpen(false); onOpenAdmin(); }} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink-secondary hover:bg-surface-hover"><Shield {...iconProps} />Admin console</button>}
            <button role="menuitem" onClick={onThemeToggle} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-ink-secondary hover:bg-surface-hover">{theme === "dark" ? <Sun {...iconProps} /> : <Moon {...iconProps} />}{theme === "dark" ? "Light theme" : "Dark theme"}</button>
            <button role="menuitem" className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs text-danger hover:bg-danger-soft" onClick={onLogout}><LogOut {...iconProps} />Log out</button>
          </div>
          {settingsOpen && <div className="fixed inset-0 z-40 grid place-items-center bg-scrim p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><section className="relative w-full max-w-[420px] rounded-2xl border border-border bg-surface p-7 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="settings-title"><button className="absolute right-3 top-3 grid size-[34px] place-items-center rounded-lg text-ink-muted hover:bg-surface-hover" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X {...iconProps} /></button><p className="mb-2 text-left text-[10px] font-bold tracking-[.16em] text-ink-muted">YOUR ACCOUNT</p><h2 className="text-[23px] font-semibold tracking-tight text-ink" id="settings-title">Settings</h2><p className="mb-5 mt-2 text-[13px] text-ink-muted">Your profile details for this Clarity workspace.</p><dl className="mb-5 divide-y divide-border border-y border-border">{[["Name", user?.name || "Account"], ["Email", user?.email], ["Appearance", theme === "dark" ? "Dark theme" : "Light theme"]].map(([label, value]) => <div className="flex justify-between gap-4 py-3 text-[13px]" key={label}><dt className="text-ink-muted">{label}</dt><dd className="m-0 break-all text-right font-medium text-ink">{value}</dd></div>)}</dl><button className="w-full rounded-lg bg-accent-strong py-2.5 text-sm font-semibold text-page" onClick={() => setSettingsOpen(false)}>Done</button></section></div>}
        </>}
        <button className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-hover ${userMenuOpen ? "bg-surface-hover" : "bg-transparent"}`} aria-haspopup="menu" aria-expanded={userMenuOpen} onClick={() => { setSettingsOpen(false); setUserMenuOpen((open) => !open); }}>
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-bold text-accent-strong">{user?.name?.[0]?.toUpperCase() || "U"}</span><span className="flex min-w-0 flex-1 flex-col"><strong className="overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold text-ink-secondary">{user?.name || "Account"}</strong><span className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-ink-muted">{user?.email}</span></span><ChevronDown {...iconProps} className="size-[18px] shrink-0 text-ink-muted" />
        </button>
        <p className="mb-0 mt-1.5 text-center text-[10px] text-ink-muted">Your chats are private and secure.</p>
      </div>
    </aside>
  </>;
}
