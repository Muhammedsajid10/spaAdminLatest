// DashboardPage.jsx
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./HomePage.css";
import api from '@api';
import Loading from "@components/ui/Loading";
import Error500Page from "@components/ui/ErrorPage";
import NoDataState from "@components/ui/NoData";

/* -------------------- Small UI helpers -------------------- */

// Spinner component
const Spinner = () => (
  <div className="spinner-container">
    <div className="spinner"></div>
  </div>
);

// Error banner (lightweight)
const ErrorBanner = ({ message }) => (
  <div
    style={{
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      background: "#FFF4F4",
      color: "#B00020",
      fontSize: 14,
      border: "1px solid #F7C8C8",
      textAlign: "center",
    }}
  >
    {message}
  </div>
);

/* -------------------- Graphs Component -------------------- */

const Graphs = () => {
  const [salesData, setSalesData] = useState(null);
  const [appointmentData, setAppointmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // helpers
  const fmtDateLabel = (d) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }); // e.g., "13 Aug"
  const weekdayParam = (d) =>
    d.toLocaleDateString("en-GB", { weekday: "long" }).toLowerCase(); // "monday"

  // Cache for API responses to avoid redundant calls
  const cacheRef = React.useRef({
    salesData: null,
    appointmentData: null,
    cachedAt: 0
  });

  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  // build last 7 days array (oldest -> today)
  const last7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today);
      dt.setDate(today.getDate() - i);
      days.push(dt);
    }
    return days;
  };

  useEffect(() => {
    const fetchGraphsData = async () => {
      setLoading(true);
      setError(null);

      const now = Date.now();
      // Check if cache is still valid
      if (cacheRef.current.salesData && cacheRef.current.appointmentData &&
        (now - cacheRef.current.cachedAt) < CACHE_DURATION) {
        setSalesData(cacheRef.current.salesData);
        setAppointmentData(cacheRef.current.appointmentData);
        setLoading(false);
        return;
      }

      try {
        // OPTIMIZED: Fetch all required data with minimal parallel requests
        // 1. Get dashboard stats and booking analytics in parallel (only 2 main requests)
        const [dashboardRes, bookingRes] = await Promise.all([
          api.get("/admin/dashboard"),
          api.get("/admin/analytics/bookings")
        ]);

        const dashboardData = dashboardRes.data?.data;
        const bookingAnalytics = bookingRes?.data?.data;

        // 2) Build sales graph data from dashboard stats (avoid 7 separate API calls!)
        // Use the provided thisMonth data directly instead of fetching each day separately
        const days = last7Days();
        const salesGraph = days.map((d) => ({
          name: fmtDateLabel(d),
          appointments: 0, // Placeholder - actual data can come from dashboard
          value: 0
        }));

        // For accurate last 7 days data, make ONE optimized request instead of 7
        let calculatedSalesData;
        try {
          const revenueRes = await api.get("/admin/analytics/revenue?period=daily");
          const dailyData = revenueRes?.data?.data?.revenueData || [];

          // Map the last 7 days and calculate totals
          let totalRevenueLast7Days = 0;
          let totalBookingsLast7Days = 0;

          const salesGraphOptimized = days.map((d) => {
            // Match by constructing date from _id fields
            const dayData = dailyData.find(r => {
              if (!r._id) return false;
              const dataDate = new Date(r._id.year, r._id.month - 1, r._id.day);
              return dataDate.toDateString() === d.toDateString();
            });

            const dayRevenue = dayData?.revenue || 0;
            const dayBookings = dayData?.bookings || 0;

            // Add to totals
            totalRevenueLast7Days += dayRevenue;
            totalBookingsLast7Days += dayBookings;

            return {
              name: fmtDateLabel(d),
              appointments: dayBookings,
              value: dayRevenue
            };
          });

          calculatedSalesData = {
            totalRevenue: totalRevenueLast7Days,
            totalBookings: totalBookingsLast7Days,
            graphData: salesGraphOptimized
          };

          setSalesData(calculatedSalesData);
        } catch (err) {
          // Fallback to empty data if daily revenue fetch fails
          console.error("Failed to fetch daily revenue:", err);
          calculatedSalesData = {
            totalRevenue: 0,
            totalBookings: 0,
            graphData: salesGraph
          };
          setSalesData(calculatedSalesData);
        }

        // 3) Process booking trends from booking analytics (already fetched above)
        const trends = bookingAnalytics?.bookingTrends || [];

        const appointmentGraph = trends.map((item) => {
          const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          const monthName = monthNames[(item._id?.month || 1) - 1];

          return {
            day: `${monthName} ${item._id?.year || "2025"}`,
            totalBookings: item.totalBookings || 0,
            confirmed: item.completedBookings || 0,
            cancelled: item.cancelledBookings || 0,
          };
        });

        const statusDistribution = bookingAnalytics?.statusDistribution || [];
        const confirmedTotal =
          statusDistribution.find((s) => s._id === "confirmed")?.count || 0;
        const completedTotal =
          statusDistribution.find((s) => s._id === "completed")?.count || 0;
        const totalConfirmed = confirmedTotal + completedTotal;
        const totalCancelled =
          statusDistribution.find((s) => s._id === "cancelled")?.count || 0;

        const appointmentDataResult = {
          totalConfirmed,
          totalCancelled,
          graphData: appointmentGraph,
          statusDistribution
        };

        setAppointmentData(appointmentDataResult);

        // Cache the results with calculated data
        cacheRef.current = {
          salesData: calculatedSalesData,
          appointmentData: appointmentDataResult,
          cachedAt: Date.now()
        };

        setLoading(false);
      } catch (err) {
        setError("Could not load sales/appointments analytics. Please try again.");
        setSalesData({
          totalRevenue: 0,
          totalBookings: 0,
          graphData: [],
        });
        setAppointmentData({
          totalConfirmed: 0,
          totalCancelled: 0,
          graphData: [],
        });
        setLoading(false);
      }
    };

    fetchGraphsData();
  }, []);

  return (
    <div className="graph-upcoming-container">
      {/* Recent sales */}
      <div className="card">
        <div className="card-header">
          <h3>Recent sales</h3>
          <span>Last 7 days</span>
          <h1>
            AED{" "}
            {salesData?.totalRevenue?.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            }) || "0.00"}
          </h1>
          <div className="appointments-info">
            <div className="appointments-count">
              <span>Appointments</span>
              <strong>{salesData?.totalBookings || 0}</strong>
            </div>
            <div className="appointments-count">
              <span>Appointments value</span>
              <strong className="appointments-value">
                AED{" "}
                {salesData?.totalRevenue?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                }) || "0.00"}
              </strong>
            </div>
          </div>
        </div>
        <div
          className="chart-wrapper"
          style={{
            minHeight: 220,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {loading ? (
            <Loading />
          ) : error ? (
            <Error500Page />
          ) : salesData?.graphData?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={salesData.graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="appointments" stroke="#00C49F" />
                <Line type="monotone" dataKey="value" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <NoDataState />
          )}
        </div>
      </div>

      {/* Upcoming appointments - Next 7 days */}
      <UpcomingAppointmentsGraph />
    </div>
  );
};

/* -------------------- Upcoming Appointments Graph (for Graphs Component) -------------------- */

const UpcomingAppointmentsGraph = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUpcomingAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch all appointments
        const response = await api.get(`/bookings/admin/all?limit=10000`);
        const bookings = response.data?.data?.bookings || [];

        // Get today's date at start of day
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        // Get date 7 days from now (end of the 7th day)
        const next7DaysEnd = new Date(today);
        next7DaysEnd.setDate(today.getDate() + 7);
        next7DaysEnd.setHours(23, 59, 59, 999);

        // Filter and format bookings for next 7 days (including today)
        const upcomingBookings = bookings
          .filter(b => {
            const apptDate = new Date(b.appointmentDate);
            const isInRange = apptDate >= today && apptDate <= next7DaysEnd;
            return isInRange;
          })
          .map(b => ({
            date: new Date(b.appointmentDate),
            status: b.status,
            dayLabel: new Date(b.appointmentDate).toLocaleDateString("en-GB", { 
              weekday: "short", 
              day: "2-digit",
              month: "short"
            })
          }));

        setAppointments(upcomingBookings);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch upcoming appointments:", err);
        setError("Could not load upcoming appointments.");
        setAppointments([]);
        setLoading(false);
      }
    };

    fetchUpcomingAppointments();
  }, []);

  // Build data for the next 7 days
  const buildNext7DaysData = () => {
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Count confirmed and cancelled appointments for this day
      const dayAppointments = appointments.filter(app => {
        return app.date.toDateString() === date.toDateString();
      });
      
      const confirmed = dayAppointments.filter(app => 
        app.status === 'confirmed' || app.status === 'completed'
      ).length;
      
      const cancelled = dayAppointments.filter(app => 
        app.status === 'cancelled'
      ).length;
      
      days.push({
        date: date,
        label: date.toLocaleDateString("en-GB", { 
          weekday: "short", 
          day: "2-digit" 
        }),
        confirmed,
        cancelled,
        total: dayAppointments.length
      });
    }
    
    return days;
  };

  const next7DaysData = buildNext7DaysData();
  const totalBooked = appointments.length;
  const totalConfirmed = appointments.filter(app => 
    app.status === 'confirmed' || app.status === 'completed'
  ).length;
  const totalCancelled = appointments.filter(app => 
    app.status === 'cancelled'
  ).length;

  return (
    <div className="card">
      <div className="card-header">
        <h3>Upcoming appointments</h3>
        <span>Next 7 days</span>
        <h1>{totalBooked} booked</h1>
        <div className="appointments-info">
          <div className="appointments-count">
            <span>Confirmed appointments</span>
            <strong>{totalConfirmed}</strong>
          </div>
          <div className="appointments-count">
            <span>Cancelled appointments</span>
            <strong>{totalCancelled}</strong>
          </div>
        </div>
      </div>
      <div
        className="chart-wrapper"
        style={{
          minHeight: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {loading ? (
          <Loading />
        ) : error ? (
          <Error500Page message={error} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={next7DaysData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="confirmed" stackId="a" fill="#6366f1" name="Confirmed" />
              <Bar dataKey="cancelled" stackId="a" fill="#ef4444" name="Cancelled" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

/* -------------------- AppointmentsRedesign Component -------------------- */

const AppointmentsRedesign = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination for Appointments Activity (5 items per page)
  const ACTIVITY_PAGE_SIZE = 5;
  const [activityPage, setActivityPage] = useState(1);

  // Pagination for Today's Next Appointments (4 items per page)
  const NEXT_APPOINTMENTS_PAGE_SIZE = 4;
  const [nextAppointmentsPage, setNextAppointmentsPage] = useState(1);

  useEffect(() => {
    const fetchAppointments = async () => {
      setLoading(true);
      setError(null);
      try {
        // ✅ FIX: Add high limit to get all appointments for dashboard
        const dashboardRes = await api.get("/bookings/admin/all?limit=10000");

        const bookings = dashboardRes.data?.data?.bookings || [];
        setAppointments(
          bookings.map((b) => {
            const dt = new Date(b.appointmentDate);
            return {
              originalDate: dt, // keep raw date for filtering
              date: dt.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              }),
              month: dt.toLocaleDateString("en-GB", { month: "short" }),
              time: dt.toLocaleString("en-GB", {
                weekday: "short",
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
              status: b.status,
              title: b.services?.map((s) => s?.service?.name).join(", "),
              type: b.services?.map((s) => s?.type).join(", "),
              payment: b.paymentMethod || "",
              price: b.finalAmount ? `AED ${b.finalAmount}` : "",
              location: b.location || "",
            };
          })
        );
        setLoading(false);
      } catch (err) {
        setError("Could not load appointments. Please try again.");
        setAppointments([]); // no mock
        setLoading(false);
      }
    };
    fetchAppointments();
  }, []);

  // Reset pagination when appointments data changes
  useEffect(() => {
    setActivityPage(1);
    setNextAppointmentsPage(1);
  }, [appointments]);

  // Calculate pagination for Appointments Activity
  const totalActivityPages = Math.max(
    1,
    Math.ceil(appointments.length / ACTIVITY_PAGE_SIZE)
  );
  const activityStartIdx = (activityPage - 1) * ACTIVITY_PAGE_SIZE;
  const visibleActivityAppointments = appointments.slice(
    activityStartIdx,
    activityStartIdx + ACTIVITY_PAGE_SIZE
  );

  const onPrevActivity = () => setActivityPage((p) => Math.max(1, p - 1));
  const onNextActivity = () =>
    setActivityPage((p) => Math.min(totalActivityPages, p + 1));

  // Filter today's appointments using originalDate
  const todaysAppointments = appointments.filter((app) => {
    const today = new Date();
    const d = app.originalDate;
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  });

  // Calculate pagination for Today's Next Appointments
  const totalNextAppointmentsPages = Math.max(
    1,
    Math.ceil(todaysAppointments.length / NEXT_APPOINTMENTS_PAGE_SIZE)
  );
  const nextAppointmentsStartIdx =
    (nextAppointmentsPage - 1) * NEXT_APPOINTMENTS_PAGE_SIZE;
  const visibleNextAppointments = todaysAppointments.slice(
    nextAppointmentsStartIdx,
    nextAppointmentsStartIdx + NEXT_APPOINTMENTS_PAGE_SIZE
  );

  const onPrevNextAppointments = () =>
    setNextAppointmentsPage((p) => Math.max(1, p - 1));
  const onNextNextAppointments = () =>
    setNextAppointmentsPage((p) =>
      Math.min(totalNextAppointmentsPages, p + 1)
    );

  return (
    <div className="appointments-layout">
      <div className="appointments-left-section">
        <div className="activity-container">
          <h2>Appointments Activity</h2>

          <div className="activity-scroll-wrapper">
            <div
              className="activity-list"
              style={{
                minHeight: 120,
                display: loading ? "flex" : undefined,
                alignItems: loading ? "center" : undefined,
                justifyContent: loading ? "center" : undefined,
              }}
            >
              {loading ? (
                <Loading />
              ) : error ? (
                <Error500Page message={error} />
              ) : visibleActivityAppointments.length ? (
                visibleActivityAppointments.map((app, index) => (
                  <div key={index} className="activity-card">
                    <div className="activity-date">{app.date}</div>

                    <div className="activity-details">
                      <div className="activity-time-status">
                        <span className="activity-time">{app.time}</span>
                        <span
                          className={`activity-status ${app.status?.toLowerCase()}`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <div className="activity-title">{app.title}</div>
                      <div className="activity-type">{app.type}</div>
                      {app.payment && (
                        <div className="activity-payment">{app.payment}</div>
                      )}
                    </div>
                    <div className="activity-price">{app.price}</div>
                  </div>
                ))
              ) : (
                <NoDataState />)}
            </div>
          </div>

          {/* Pagination for Appointments Activity */}
          {!loading && !error && appointments.length > ACTIVITY_PAGE_SIZE && (
            <div className="stats-pagination">
              <button
                className="page-btn"
                onClick={onPrevActivity}
                disabled={activityPage === 1}
              >
                ‹
              </button>
              <span className="page-info">
                {activityPage} of {totalActivityPages}
              </span>
              <button
                className="page-btn"
                onClick={onNextActivity}
                disabled={activityPage === totalActivityPages}
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="appointments-right-section">
        <div>
          <h3 className="next-appointment-heading">Today's Next Appointments</h3>
        </div>
        <div className="next-appointment-container">
          {loading ? (
            <Loading />
          ) : error ? (
            <Error500Page message={error} />
          ) : visibleNextAppointments.length ? (
            visibleNextAppointments.map((app, index) => (
              <div key={index} className="next-appointment-box">
                <div className="next-date-box">
                  <div className="next-date">{app.date}</div>
                  <div className="next-month">{app.month}</div>
                </div>
                <div className="next-details">
                  <div className="next-time-status">
                    <span className="next-time">{app.time}</span>
                    <span className="next-status">{app.status}</span>
                  </div>
                  <div className="next-title">{app.title}</div>
                  <div className="next-info">{app.type}</div>
                  <div className="next-location">{app.location || ""}</div>
                </div>
                <div className="next-price">{app.price}</div>
              </div>
            ))
          ) : (
            <NoDataState />)}

          {/* Pagination for Today's Next Appointments */}
          {!loading &&
            !error &&
            todaysAppointments.length > NEXT_APPOINTMENTS_PAGE_SIZE && (
              <div className="stats-pagination">
                <button
                  className="page-btn"
                  onClick={onPrevNextAppointments}
                  disabled={nextAppointmentsPage === 1}
                >
                  ‹
                </button>
                <span className="page-info">
                  {nextAppointmentsPage} of {totalNextAppointmentsPages}
                </span>
                <button
                  className="page-btn"
                  onClick={onNextNextAppointments}
                  disabled={nextAppointmentsPage === totalNextAppointmentsPages}
                >
                  ›
                </button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

/* -------------------- TopStats Component -------------------- */

const TopStats = () => {
  const [topServices, setTopServices] = useState([]);
  const [topTeamMembers, setTopTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -- Pagination (client-side, no API changes)
  const PAGE_SIZE = 7;
  const [servicePage, setServicePage] = useState(1);
  const [teamMemberPage, setTeamMemberPage] = useState(1);

  // Reset to first page whenever data reloads
  useEffect(() => {
    setServicePage(1);
  }, [topServices]);

  // Reset team member page when data reloads
  useEffect(() => {
    setTeamMemberPage(1);
  }, [topTeamMembers]);

  // Compute visible slice
  const totalServicePages = Math.max(
    1,
    Math.ceil(topServices.length / PAGE_SIZE)
  );
  const serviceStartIdx = (servicePage - 1) * PAGE_SIZE;
  const visibleServices = topServices.slice(
    serviceStartIdx,
    serviceStartIdx + PAGE_SIZE
  );

  const onPrevService = () => setServicePage((p) => Math.max(1, p - 1));
  const onNextService = () =>
    setServicePage((p) => Math.min(totalServicePages, p + 1));

  // Compute visible slice for team members
  const totalTeamMemberPages = Math.max(
    1,
    Math.ceil(topTeamMembers.length / PAGE_SIZE)
  );
  const teamMemberStartIdx = (teamMemberPage - 1) * PAGE_SIZE;
  const visibleTeamMembers = topTeamMembers.slice(
    teamMemberStartIdx,
    teamMemberStartIdx + PAGE_SIZE
  );

  const onPrevTeamMember = () => setTeamMemberPage((p) => Math.max(1, p - 1));
  const onNextTeamMember = () =>
    setTeamMemberPage((p) => Math.min(totalTeamMemberPages, p + 1));

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const bookingRes = await api.get("/admin/analytics/bookings");
        const employeeRes = await api.get("/admin/analytics/employees");
        const allEmployeesRes = await api.get("/employees?limit=10000");

        // Get all bookings to calculate monthly revenue per employee
        const allBookingsRes = await api.get("/bookings/admin/all?limit=10000");
        const allBookings = allBookingsRes.data?.data?.bookings || [];

        // Prepare top services for TopStats
        const popularServices = bookingRes.data?.data?.popularServices || [];
        setTopServices(
          popularServices.map((s) => ({
            service: s.serviceName,
            thisMonth: s.bookings,
            lastMonth: s.revenue, // keep as provided (adjust if API offers last month separately)
          }))
        );

        // Calculate this month and last month revenue for each employee
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0-11

        const thisMonthStart = new Date(currentYear, currentMonth, 1);
        const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);

        // Prepare top team members - show ALL employees with their monthly performance
        const allEmployees = allEmployeesRes.data?.data?.employees || [];

        const allEmployeesWithPerformance = allEmployees.map(emp => {
          const empId = emp._id.toString();
          
          // Calculate this month's revenue
          const thisMonthRevenue = allBookings
            .filter(booking => {
              const bookingDate = new Date(booking.appointmentDate);
              return bookingDate >= thisMonthStart && 
                     bookingDate <= thisMonthEnd &&
                     booking.status === 'completed' &&
                     booking.services?.some(s => s.employee?._id?.toString() === empId || s.employee?.toString() === empId);
            })
            .reduce((sum, booking) => {
            const employeeServices = booking.services.filter(s => 
              s.employee?._id?.toString() === empId || s.employee?.toString() === empId
            );

            // Calculate the actual revenue for this booking
            if (employeeServices.length > 0) {
              let finalBookingAmount;

              // Use finalAmount directly as it should contain the actual amount paid
              // If finalAmount is less than totalAmount, it means there was a discount
              if (booking.finalAmount !== undefined) {
                finalBookingAmount = booking.finalAmount;
              } else {
                return sum + employeeServices.reduce((svcSum, svc) => svcSum + (svc.price || 0), 0);
              }

              // Distribute the final amount proportionally among employee's services
              const totalServicesInBooking = booking.services.length;
              const employeeServicesCount = employeeServices.length;
              const employeeShare = (finalBookingAmount / totalServicesInBooking) * employeeServicesCount;
              return sum + employeeShare;
            }

            return sum;
          }, 0);
          
          // Calculate last month's revenue
          const lastMonthRevenue = allBookings
            .filter(booking => {
              const bookingDate = new Date(booking.appointmentDate);
              return bookingDate >= lastMonthStart && 
                     bookingDate <= lastMonthEnd &&
                     booking.status === 'completed' &&
                     booking.services?.some(s => s.employee?._id?.toString() === empId || s.employee?.toString() === empId);
            })
            .reduce((sum, booking) => {
              const employeeServices = booking.services.filter(s => 
                s.employee?._id?.toString() === empId || s.employee?.toString() === empId
              );
              
              // Same logic as this month - use finalAmount directly
              if (employeeServices.length > 0 && booking.finalAmount !== undefined) {
                const finalBookingAmount = booking.finalAmount;
                const totalServicesInBooking = booking.services.length;
                const employeeServicesCount = employeeServices.length;
                const employeeShare = (finalBookingAmount / totalServicesInBooking) * employeeServicesCount;
                return sum + employeeShare;
              }
              
              // Fallback to original prices
              return sum + employeeServices.reduce((svcSum, svc) => svcSum + (svc.price || 0), 0);
            }, 0);
          
          return {
            employeeName: `${emp.user?.firstName || ''} ${emp.user?.lastName || ''}`.trim() || 'Unknown',
            thisMonthRevenue,
            lastMonthRevenue
          };
        });

        // Sort by this month's revenue descending
        const sortedEmployees = allEmployeesWithPerformance.sort(
          (a, b) => (b.thisMonthRevenue || 0) - (a.thisMonthRevenue || 0)
        );

        setTopTeamMembers(
          sortedEmployees.map((e) => ({
            name: e.employeeName,
            thisMonth: `AED ${(e.thisMonthRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            lastMonth: `AED ${(e.lastMonthRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          }))
        );

        setLoading(false);
      } catch (err) {
        setError("Could not load top services/team stats.");
        setTopServices([]);
        setTopTeamMembers([]);
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="top-stats-container">
      <div className="stats-card">
        <h3 className="stats-title">Top Services</h3>
        <div className="stats-table">
          <div className="stats-row stats-header">
            <div className="stats-cell">Service</div>
            <div className="stats-cell">This Month</div>
            <div className="stats-cell">Last Month</div>
          </div>
          {loading ? (
            <Loading />
          ) : error ? (
            <Error500Page message={error} />
          ) : visibleServices.length ? (
            visibleServices.map((service, index) => (
              <div key={index} className="stats-row">
                <div className="stats-cell">{service.service}</div>
                <div className="stats-cell">{service.thisMonth}</div>
                <div className="stats-cell">{service.lastMonth}</div>
              </div>
            ))
          ) : (
            <NoDataState />)}
        </div>
        {!loading && !error && topServices.length > PAGE_SIZE && (
          <div className="stats-pagination">
            <button
              className="page-btn"
              onClick={onPrevService}
              disabled={servicePage === 1}
            >
              ‹
            </button>
            <span className="page-info">
              {servicePage} of {totalServicePages}
            </span>
            <button
              className="page-btn"
              onClick={onNextService}
              disabled={servicePage === totalServicePages}
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div className="stats-card">
        <h3 className="stats-title">Top Team Members</h3>
        <div className="stats-table">
          <div className="stats-row stats-header">
            <div className="stats-cell">Name</div>
            <div className="stats-cell">This Month</div>
            <div className="stats-cell">Last Month</div>
          </div>
          {loading ? (
            <Loading />
          ) : error ? (
            <Error500Page message={error} />
          ) : visibleTeamMembers.length ? (
            visibleTeamMembers.map((member, index) => (
              <div key={index} className="stats-row">
                <div className="stats-cell">{member.name}</div>
                <div className="stats-cell">{member.thisMonth}</div>
                <div className="stats-cell">{member.lastMonth}</div>
              </div>
            ))
          ) : (
            <NoDataState />)}
        </div>
        {!loading && !error && topTeamMembers.length > PAGE_SIZE && (
          <div className="stats-pagination">
            <button
              className="page-btn"
              onClick={onPrevTeamMember}
              disabled={teamMemberPage === 1}
            >
              ‹
            </button>
            <span className="page-info">
              {teamMemberPage} of {totalTeamMemberPages}
            </span>
            <button
              className="page-btn"
              onClick={onNextTeamMember}
              disabled={teamMemberPage === totalTeamMemberPages}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

/* -------------------- Main DashboardPage -------------------- */

const DashboardPage = () => {
  return (
    <div>
      <Graphs />
      <AppointmentsRedesign />
      <TopStats />
    </div>
  );
};

export default DashboardPage;
