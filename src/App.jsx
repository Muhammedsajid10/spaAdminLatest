// App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./Clientsidepage/DashboardLayout";
import LoginPage from "./Clientsidepage/Loginpage";

// Import all page components
import DashboardPage from "./Clientsidepage/HomePage";
import Scheduler from "./Clientsidepage/Selectcalander";
import ClientsList from "./Clientsidepage/Clientlist";
import DailySalesSummary from './Clientsidepage/Dailysalesss';
import SalesAppointments from './Clientsidepage/Appoint';
import SalesPayments from './Clientsidepage/Paymentclient';
import GiftCardsSold from './Clientsidepage/Giftcard';
import MembershipsSold from './Clientsidepage/Memberss';
import TeamMembers from './Clientsidepage/Teammembers';
import ScheduledShifts from './Clientsidepage/Sheduledshifts';
import TimeSheets from './Clientsidepage/TimeSheets';
import ServiceMenu from './Clientsidepage/ServiceMenu';
import CatalogMemberships from './Clientsidepage/Membership';
import Searchbar from "./Clientsidepage/SearchBar";
import Reporting from "./Clientsidepage/Dashboard";
import Membership from "./Clientsidepage/Membership";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Unauthenticated Route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* All authenticated routes are nested inside the main layout */}
        <Route path="/" element={<DashboardLayout />}>

          {/* Top-level pages */}
          <Route index element={<DashboardPage />} />
          <Route path="calendar" element={<Scheduler />} />
          <Route path="clients-list" element={<ClientsList />} />
          <Route path="search-bar" element={<Searchbar />} />
          <Route path="report-analytics" element={<Reporting />} />


          {/* Sales Pages */}
          <Route path="sales" element={<DailySalesSummary />} />
          <Route path="sales/daily-summary" element={<DailySalesSummary />} />
          <Route path="sales/appointments" element={<SalesAppointments />} />
          <Route path="sales/payments" element={<SalesPayments />} />
          <Route path="sales/gift-cards" element={<GiftCardsSold />} />
          <Route path="sales/memberships" element={<Membership />} />

          {/* Team Pages */}
          <Route path="team" element={<TeamMembers />} />
          <Route path="team/scheduled-shifts" element={<ScheduledShifts />} />
          <Route path="team/time-sheets" element={<TimeSheets />} />

          {/* Catalog Pages */}
          <Route path="catalog" element={<ServiceMenu />} />
          <Route path="catalog/memberships" element={<MembershipsSold />} />

          {/* Fallback for any unknown route inside the layout */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;