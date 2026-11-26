export default function Navbar({ title, onMenu }) {
  return <header className="topbar"><button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation">☰</button><div className="topbar-title"><span className="status-dot"/> {title || "Gemini Assistant"}</div><div className="model-pill"><span className="sparkle">✦</span> Gemini</div></header>;
}
