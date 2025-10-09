// ReportsCategory.jsx
import ReportCard from "../../components/ui/ReportCard";
import "../../styles/reports.css";

export default function ReportsCategory({ data }) {
  return (
    <div className="reports-list">
      {data.map(r => (
        <ReportCard key={r.id} {...r} />
      ))}
    </div>
  );
}
