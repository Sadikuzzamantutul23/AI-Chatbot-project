import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, setAuthToken } from "./lib/api";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import WelcomeScreen from "./components/WelcomeScreen";
import ChatInput from "./components/ChatInput";
import AuthScreen from "./components/AuthScreen";

const ChatMessages = lazy(() => import("./components/ChatMessages"));

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("chat_token"));
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeChatIdRef = useRef(activeChatId);
  const skipNextMessageLoad = useRef(null);

  const activeChat = useMemo(() => conversations.find((chat) => chat.id === activeChatId), [conversations, activeChatId]);
  const saveToken = (value) => {
    localStorage.setItem("chat_token", value);
    setAuthToken(value);
    setToken(value);
  };

  const loadConversations = useCallback(async () => {
    const { data } = await api.get("/api/conversations");
    setConversations(data);
  }, []);

  useEffect(() => {
    setAuthToken(token);
    if (!token) return;
    let mounted = true;
    Promise.all([api.get("/api/auth/me"), api.get("/api/conversations")])
      .then(([profile, chats]) => {
        if (!mounted) return;
        setUser(profile.data);
        setConversations(chats.data);
      })
      .catch(() => {
        if (!mounted) return;
        localStorage.removeItem("chat_token");
        setAuthToken(null);
        setToken(null);
      });
    return () => { mounted = false; };
  }, [token]);

  useEffect(() => {
    const handleExpired = () => { activeChatIdRef.current = null; setToken(null); setUser(null); setConversations([]); setMessages([]); setActiveChatId(null); };
    window.addEventListener("chat:auth-expired", handleExpired);
    return () => window.removeEventListener("chat:auth-expired", handleExpired);
  }, []);

  useEffect(() => {
    if (!activeChatId || !token) return;
    if (skipNextMessageLoad.current === activeChatId) {
      skipNextMessageLoad.current = null;
      return;
    }
    let mounted = true;
    api.get(`/api/conversations/${activeChatId}/messages`)
      .then(({ data }) => { if (mounted) setMessages(data); })
      .catch((e) => { if (mounted) setError(apiError(e)); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [activeChatId, token]);

  const handleSend = async (text) => {
    const prompt = text.trim();
    if (!prompt || sending) return;
    setError(""); setSending(true);
    const optimisticId = `pending-${Date.now()}`;
    let chatId = activeChatId;
    try {
      if (!chatId) {
        const { data } = await api.post("/api/conversations", { title: prompt.slice(0, 48) || "New Chat" });
        chatId = data.id;
        if (activeChatIdRef.current === null) {
          activeChatIdRef.current = chatId;
          skipNextMessageLoad.current = chatId;
          setActiveChatId(chatId);
        }
        setConversations((items) => [data, ...items]);
      }
      setMessages((items) => activeChatIdRef.current === chatId ? [...items, { id: optimisticId, role: "user", content: prompt }] : items);
      const { data } = await api.post(`/api/conversations/${chatId}/messages`, { content: prompt });
      setMessages((items) => activeChatIdRef.current === chatId ? [...items.filter((item) => item.id !== optimisticId), data.user_message, data.assistant_message] : items);
      await loadConversations();
    } catch (e) {
      setMessages((items) => items.filter((item) => item.id !== optimisticId));
      setError(apiError(e));
    } finally { setSending(false); }
  };

  const regenerateResponse = async () => {
    if (!activeChatId || sending) return;
    setError(""); setSending(true);
    try {
      const { data } = await api.post(`/api/conversations/${activeChatId}/messages/regenerate`);
      setMessages((items) => items.map((item) => item.id === data.id ? data : item));
      await loadConversations();
    } catch (e) { setError(apiError(e)); }
    finally { setSending(false); }
  };

  const handleNewChat = () => { activeChatIdRef.current = null; setActiveChatId(null); setMessages([]); setLoading(false); setError(""); setMobileOpen(false); };
  const selectChat = (id) => { activeChatIdRef.current = id; setMessages([]); setLoading(true); setError(""); setActiveChatId(id); setMobileOpen(false); };
  const renameChat = async (chat, title) => {
    if (!title?.trim() || title.trim() === chat.title) return;
    try {
      const { data } = await api.patch(`/api/conversations/${chat.id}`, { title: title.trim() });
      setConversations((items) => items.map((item) => item.id === chat.id ? data : item));
    } catch (e) { setError(apiError(e)); }
  };
  const deleteChat = async (chat) => {
    try {
      await api.delete(`/api/conversations/${chat.id}`);
      setConversations((items) => items.filter((item) => item.id !== chat.id));
      if (activeChatId === chat.id) handleNewChat();
    } catch (e) { setError(apiError(e)); }
  };
  const logout = () => { activeChatIdRef.current = null; localStorage.removeItem("chat_token"); setAuthToken(null); setToken(null); setUser(null); setConversations([]); setActiveChatId(null); setMessages([]); };

  if (!token || !user) return <AuthScreen onAuthenticated={(result) => { saveToken(result.token); setUser(result.user); }} />;
  return (
    <div className="app-shell">
      <Sidebar onNewChat={handleNewChat} conversations={conversations} activeChatId={activeChatId} onSelectChat={selectChat} user={user} onLogout={logout} onRename={renameChat} onDelete={deleteChat} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <main className="chat-main">
        <Navbar title={activeChat?.title} onMenu={() => setMobileOpen(true)} />
        {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => setError("")}>Dismiss</button></div>}
        {loading ? <div className="loading-state"><span className="spinner"/> Loading conversation…</div> : messages.length === 0 ? <WelcomeScreen onSuggestionClick={handleSend} /> : <Suspense fallback={<div className="loading-state"><span className="spinner"/> Preparing conversation…</div>}><ChatMessages messages={messages} sending={sending} onRegenerate={regenerateResponse} /></Suspense>}
        <ChatInput onSend={handleSend} disabled={sending} />
      </main>
    </div>
  );
}

function apiError(error) {
  if (!error.response) return "Could not reach the server. Check your connection and try again.";
  const detail = error.response.data?.detail;
  if (Array.isArray(detail)) return detail.map((item) => item.msg).join(" · ");
  return detail || "Something went wrong. Please try again.";
}

export default App;
