// TabBar.jsx
import "../../styles/ui.css";

export default function TabBar({ tabs, active, onChange }) {
  return (
    <div className="tabbar">
      {tabs.map(tab => (
        <button
          key={tab.key}
          className={`tabbar-btn ${tab.key === active ? "active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
