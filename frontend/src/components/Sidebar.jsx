import { useState } from "react";

export default function Sidebar({ onNewChat, conversations, activeChatId, onSelectChat, user, onLogout, onRename, onDelete, mobileOpen, onClose }) {
  const [menuId, setMenuId] = useState(null);
  const [renamingId, setRenamingId] = useState(null);
  const [renamingTitle, setRenamingTitle] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  return <>
    {mobileOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={onClose} />}
    <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
      <div className="sidebar-top"><div className="wordmark"><span className="brand-mark small">✦</span> <span>Clarity</span></div><button className="icon-button mobile-close" onClick={onClose} aria-label="Close sidebar">×</button></div>
      <button className="new-chat-button" onClick={onNewChat}><span className="plus-icon">＋</span> New conversation <span className="shortcut">⌘ K</span></button>
      <div className="history-heading">YOUR CHATS <span>{conversations.length}</span></div>
      <div className="conversation-list">{conversations.length === 0 ? <p className="empty-history">Your conversations will appear here.</p> : conversations.map((chat) => <div className={`conversation-item ${activeChatId === chat.id ? "selected" : ""}`} key={chat.id}>
        {renamingId === chat.id ? <form className="conversation-edit" onSubmit={(event) => { event.preventDefault(); onRename(chat, renamingTitle); setRenamingId(null); }}><input aria-label="Conversation title" autoFocus maxLength={255} value={renamingTitle} onChange={(event) => setRenamingTitle(event.target.value)} /><div><button type="submit" disabled={!renamingTitle.trim()}>Save</button><button type="button" onClick={() => setRenamingId(null)}>Cancel</button></div></form> : <>
          <button className="conversation-link" title={chat.title} onClick={() => onSelectChat(chat.id)}><span className="chat-glyph">▤</span><span>{chat.title}</span></button>
          <button className="conversation-menu-trigger" aria-label={`Actions for ${chat.title}`} onClick={() => setMenuId(menuId === chat.id ? null : chat.id)}>···</button>
          {menuId === chat.id && <div className="conversation-menu"><button onClick={() => { setMenuId(null); setRenamingId(chat.id); setRenamingTitle(chat.title); }}>Rename</button><button className="danger" onClick={() => { setMenuId(null); setDeletingId(chat.id); }}>Delete</button></div>}
          {deletingId === chat.id && <div className="conversation-delete-confirm"><span>Delete this conversation?</span><button className="danger" onClick={() => { setDeletingId(null); onDelete(chat); }}>Delete</button><button onClick={() => setDeletingId(null)}>Cancel</button></div>}
        </>}
      </div>)}</div>
      <div className="sidebar-bottom"><div className="account-card"><div className="avatar">{user?.name?.[0]?.toUpperCase() || "U"}</div><div className="account-copy"><strong>{user?.name || "Account"}</strong><span>{user?.email}</span></div><button className="logout-button" onClick={onLogout} title="Sign out" aria-label="Sign out">↗</button></div><p className="privacy-note">Your chats are private and secure.</p></div>
    </aside>
  </>;
}
