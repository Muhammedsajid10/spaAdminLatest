// reportsData.js
import { Tag, DollarSign, Calendar, Users } from "lucide-react";

export const reportTabs = [
  {
    key: "appointments",
    label: "Appointments",
    reports: [
      {
        key: "appointments-summary",
        title: "Appointments summary",
        desc: "Overview of all appointments, bookings, and scheduling data",
        category: "Appointments"
      },
      // Add more appointment reports here
    ]
  },
  {
    key: "sales-summary", 
    label: "Sales",
    reports: [
      {
        key: "sales-summary",
        title: "Sales summary", 
        desc: "Sales quantities and value, excluding tips and gift card sales",
        category: "Sales"
      },
      // Add more sales reports here
    ]
  },
  {
    key: "finance",
    label: "Finance", 
    reports: [
      {
        key: "payment-summary",
        title: "Payments summary",
        desc: "Payments split by payment methods",
        category: "Finance"
      },
      // Add more finance reports here
    ]
  },
  {
    key: "clients",
    label: "Clients",
    reports: [
      {
        key: "client-summary",
        title: "Client summary", 
        desc: "Client demographics, visit frequency, and retention metrics",
        category: "Clients"
      },
      // Add more client reports here
    ]
  },
  {
    key: "staff",
    label: "Staff",
    reports: [
      {
        key: "staff-summary",
        title: "Staff summary",
        desc: "Staff performance, scheduling, and productivity metrics", 
        category: "Staff"
      },
      // Add more staff reports here
    ]
  }
];
