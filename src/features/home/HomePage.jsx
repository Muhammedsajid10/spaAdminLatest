import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import './HomePage.css';
import RecentSales from './components/RecentSales';
import UpcomingAppointments from './components/UpcomingAppointments';
import AppointmentsActivity from './components/AppointmentsActivity';
import TodaysNextAppointments from './components/TodaysNextAppointments';
import TopServices from './components/TopServices';
import TopTeamMembers from './components/TopTeamMembers';
import {
  fetchHomeOverview,
  selectHomeError,
  selectHomeLoading,
  selectHomeSalesSummary,
  selectHomeUpcomingAppointments,
  selectHomeActivityAppointments,
  selectHomeTodaysAppointments,
  selectHomeTopServices,
  selectHomeTopTeamMembers,
} from '../../store/homeSlice';

const ErrorBanner = ({ message }) => (
  <div
    style={{
      width: '100%',
      padding: '10px 12px',
      borderRadius: 8,
      background: '#FFF4F4',
      color: '#B00020',
      fontSize: 14,
      border: '1px solid #F7C8C8',
      textAlign: 'center',
      marginBottom: 16,
    }}
  >
    {message}
  </div>
);

const SalesAppointmentSummarySection = ({ loading, salesSummary, upcomingAppointments }) => (
  <div className="graph-upcoming-container">
    <RecentSales
      salesSummary={salesSummary}
      loading={loading}
    />
    <UpcomingAppointments
      appointments={upcomingAppointments}
      loading={loading}
    />
  </div>
);

const AppointmentOverviewSection = ({ loading, activityAppointments, todaysAppointments }) => (
  <div className="appointments-layout">
    <div className="appointments-left-section">
      <AppointmentsActivity
        appointments={activityAppointments}
        loading={loading}
      />
    </div>
    <div className="appointments-right-section">
      <TodaysNextAppointments
        appointments={todaysAppointments}
        loading={loading}
      />
    </div>
  </div>
);

const PerformanceStatsSection = ({ loading, topServices, topTeamMembers }) => (
  <div className="top-stats-container">
    <TopServices
      topServices={topServices}
      loading={loading}
    />
    <TopTeamMembers
      topTeamMembers={topTeamMembers}
      loading={loading}
    />
  </div>
);

const HomePage = () => {
  const dispatch = useDispatch();
  const loading = useSelector(selectHomeLoading);
  const error = useSelector(selectHomeError);
  const salesSummary = useSelector(selectHomeSalesSummary);
  const upcomingAppointments = useSelector(selectHomeUpcomingAppointments);
  const activityAppointments = useSelector(selectHomeActivityAppointments);
  const todaysAppointments = useSelector(selectHomeTodaysAppointments);
  const topServices = useSelector(selectHomeTopServices);
  const topTeamMembers = useSelector(selectHomeTopTeamMembers);

  useEffect(() => {
    dispatch(fetchHomeOverview());
  }, [dispatch]);

  return (
    <div>
      {error && <ErrorBanner message={error} />}
      <SalesAppointmentSummarySection
        loading={loading}
        salesSummary={salesSummary}
        upcomingAppointments={upcomingAppointments}
      />
      <AppointmentOverviewSection
        loading={loading}
        activityAppointments={activityAppointments}
        todaysAppointments={todaysAppointments}
      />
      <PerformanceStatsSection
        loading={loading}
        topServices={topServices}
        topTeamMembers={topTeamMembers}
      />
    </div>
  );
};

export default HomePage;
