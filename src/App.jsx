// App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./Clientsidepage/DashboardLayout";
import LoginPage from "./Clientsidepage/Loginpage";
import ProtectedRoute from "./ProtectedRoute";
import React, { Suspense } from 'react';
import LazyLoader from './components/LazyLoader';

// Lazy-load heavy routes to reduce initial bundle size
const DashboardPage = React.lazy(() => import('./Clientsidepage/HomePage'));
const Scheduler = React.lazy(() => import('./components/Calendar'));
const ClientsList = React.lazy(() => import('./Clientsidepage/Clientlist'));
const DailySalesSummary = React.lazy(() => import('./Clientsidepage/Dailysalesss'));
const SalesAppointments = React.lazy(() => import('./Clientsidepage/Appoint'));
const SalesPayments = React.lazy(() => import('./Clientsidepage/Paymentclient'));
const GiftCardsSold = React.lazy(() => import('./Clientsidepage/Giftcard'));
const MembershipsSold = React.lazy(() => import('./Clientsidepage/Memberss'));
const TeamMembers = React.lazy(() => import('./Clientsidepage/Teammembers'));
const ScheduledShifts = React.lazy(() => import('./Clientsidepage/Sheduledshifts'));
const TimeSheets = React.lazy(() => import('./Clientsidepage/TimeSheets'));
const ServiceMenu = React.lazy(() => import('./Clientsidepage/ServiceMenu'));
const Membership = React.lazy(() => import('./Clientsidepage/Membership'));
const GiftCardPage = React.lazy(() => import('./Clientsidepage/GiftCardPage'));
const Searchbar = React.lazy(() => import('./Clientsidepage/SearchBar'));
const Dashboard = React.lazy(() => import('./Clientsidepage/Dashboard'));


// Import the ReportsRoutes component
import ReportsRoutes from "./routes/ReportsRoutes";

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LazyLoader/>}>
      <Routes>
        {/* Unauthenticated Route */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* All authenticated routes are nested inside the main layout and protected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >

          {/* Top-level pages */}
          <Route index element={<Scheduler />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<Scheduler />} />
          <Route path="clients-list" element={<ClientsList />} />
          <Route path="search-bar" element={<Searchbar />} />
           {/* Reports Routes - Use the ReportsRoutes component */}
          <Route path="reports/*" element={<ReportsRoutes />} />

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
          <Route path="catalog/gift-card" element={<GiftCardPage />} />

          {/* Fallback for any unknown route inside the layout */}
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;