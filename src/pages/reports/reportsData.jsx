// reportsData.js
import { Tag, DollarSign, Calendar, Users } from "lucide-react";

export const reportTabs = [
  { key: "sales", label: "Sales", reports: [
      { id: 1, title: "Sales summary", desc: "Sales quantities and value...", icon: <Tag /> },
    ] },
  { key: "finance", label: "Finance", reports: [
      { id: 3, title: "Finance summary", desc: "High-level summary of sales...", icon: <DollarSign /> },
      { id: 4, title: "Payments summary", desc: "Payments split by method", icon: <DollarSign /> },
            { id: 5, title: "Payments transcations", desc: "Payments split by method", icon: <DollarSign /> },

    ] },
  { key: "appointments", label: "Appointments", reports: [
      { id: 6, title: "Appointments summary", desc: "Overview of appointment trends...", icon: <Calendar /> },
    ] },
  { key: "team", label: "Team", reports: [
      { id: 7, title: "Attendance summary", desc: "Overview of team punctuality...", icon: <Users /> },
    ] },
];
