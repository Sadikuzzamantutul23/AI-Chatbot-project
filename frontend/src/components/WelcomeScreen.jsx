const suggestions = [
  ["↗", "Write something", "Draft, refine, or get unstuck on a first draft.", "Help me write a first draft about"],
  ["⌘", "Explore an idea", "Think through a question or learn something new.", "Help me explore this idea:"],
  ["⌁", "Solve a problem", "Break down a challenge into practical next steps.", "Help me solve this problem:"],
  ["⟨⟩", "Build with code", "Debug, explain, or start a technical project.", "Help me build this with code:"],
];

export default function WelcomeScreen({ onSuggestionClick }) {
  return <section className="welcome"><div className="welcome-content"><div className="welcome-symbol">✦</div><p className="eyebrow">A LITTLE MORE CLARITY</p><h1>What’s on your mind?</h1><p className="welcome-copy">A thought, a question, a challenge. Start wherever you are.</p>
    <div className="suggestion-grid">{suggestions.map(([icon, title, description, prompt]) => <button className="suggestion-card" key={title} onClick={() => onSuggestionClick(prompt)}><span className="suggestion-icon">{icon}</span><span className="suggestion-title">{title}</span><span className="suggestion-description">{description}</span><span className="suggestion-arrow">↗</span></button>)}</div>
  </div><div className="welcome-foot">Thoughtful answers, powered by Gemini</div></section>;
}
