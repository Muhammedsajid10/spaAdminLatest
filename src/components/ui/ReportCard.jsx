// ReportCard.jsx
import { Star } from "lucide-react";
import "../../styles/ui.css";

export default function ReportCard({ icon, title, desc, premium }) {
  return (
    <div className="report-card">
      <div className="report-icon">{icon}</div>
      <div className="report-info">
        <h4>{title}</h4>
        <p>{desc}</p>
      </div>
      {premium && <span className="report-premium">Premium</span>}
      <Star className="report-star" />
    </div>
  );
}
