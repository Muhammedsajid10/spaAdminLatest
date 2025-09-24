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
  ResponsiveContainer,
} from "recharts";
import "./HomePage.css";
import api from "../Service/Api";
import Loading from "../states/Loading";
import Error500Page from "../states/ErrorPage";
import NoDataState from "../states/NoData";

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
      try {
        // 1) Fetch monthly summary stats (unchanged)
        const dashboardRes = await api.get("/admin/dashboard");

        // 2) Fetch day-wise revenue by calling ?period=<weekday> for each of the last 7 days
        const days = last7Days();
        const dayRequests = days.map((d) =>
          api
            .get(`/admin/analytics/revenue?period=${weekdayParam(d)}`)
            .then((res) => ({
              label: fmtDateLabel(d),
              weekday: weekdayParam(d),
              revenue:
                res?.data?.data?.revenueData?.[0]?.revenue != null
                  ? res.data.data.revenueData[0].revenue
                  : 0,
              bookings:
                res?.data?.data?.revenueData?.[0]?.bookings != null
                  ? res.data.data.revenueData[0].bookings
                  : 0,
            }))
        );

        const dailyResults = await Promise.all(dayRequests);

        // Build sales graph data for recharts
        const salesGraph = dailyResults.map((r) => ({
          name: r.label, // "13 Aug"
          appointments: r.bookings,
          value: r.revenue,
        }));

        setSalesData({
          totalRevenue: dashboardRes.data?.data?.thisMonth?.revenue || 0,
          totalBookings: dashboardRes.data?.data?.thisMonth?.totalBookings || 0,
          graphData: salesGraph,
        });

        // 3) FIXED: Booking trends data from the correct API response
        const bookingRes = await api.get("/admin/analytics/bookings");
        const bookingAnalytics = bookingRes?.data?.data;

        // Process booking trends correctly - these are monthly data
        const trends = bookingAnalytics?.bookingTrends || [];

        // Convert monthly trends to chart data
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
          const monthName = monthNames[(item._id?.month || 1) - 1]; // Convert 1-based to 0-based

          return {
            day: `${monthName} ${item._id?.year || "2025"}`, // "Jul 2025"
            totalBookings: item.totalBookings || 0,
            confirmed: item.completedBookings || 0,
            cancelled: item.cancelledBookings || 0,
          };
        });

        // Calculate totals from status distribution for more accurate numbers
        const statusDistribution = bookingAnalytics?.statusDistribution || [];
        const confirmedTotal =
          statusDistribution.find((s) => s._id === "confirmed")?.count || 0;
        const completedTotal =
          statusDistribution.find((s) => s._id === "completed")?.count || 0;
        const totalConfirmed = confirmedTotal + completedTotal;
        const totalCancelled =
          statusDistribution.find((s) => s._id === "cancelled")?.count || 0;

        setAppointmentData({
          totalConfirmed: totalConfirmed,
          totalCancelled: totalCancelled,
          graphData: appointmentGraph,
          statusDistribution: statusDistribution, // Pass along for additional insights
        });

        setLoading(false);
      } catch (err) {
        console.log("❌ Backend API failed for graphs");
        console.log(
          "Error details:",
          err.response?.status,
          err.response?.data?.message || err.message
        );
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
            <Error500Page/>
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
           <NoDataState/>
          )}
        </div>
      </div>

      {/* FIXED: Booking trends appointments */}
      <div className="card">
        <div className="card-header">
          <h3>Booking Trends</h3>
          <span>Monthly Overview</span>
          <h1>{appointmentData?.totalConfirmed || 0} total</h1>
          <div className="appointments-info">
            <div className="appointments-count">
              <span>Confirmed + Completed</span>
              <strong>{appointmentData?.totalConfirmed || 0}</strong>
            </div>
            <div className="appointments-count">
              <span>Cancelled appointments</span>
              <strong>{appointmentData?.totalCancelled || 0}</strong>
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
          ) : appointmentData?.graphData?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={appointmentData.graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === "totalBookings"
                      ? "Total Bookings"
                      : name === "confirmed"
                      ? "Completed"
                      : name === "cancelled"
                      ? "Cancelled"
                      : name,
                  ]}
                />
                <Bar dataKey="totalBookings" fill="#3B82F6" name="Total Bookings" />
                <Bar dataKey="confirmed" fill="#10B981" name="Completed" />
                <Bar dataKey="cancelled" fill="#EF4444" name="Cancelled" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
<NoDataState/>          )}
        </div>
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
        const dashboardRes = await api.get("/bookings/admin/all");

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
        console.log("❌ Appointments API failed");
        console.log(
          "Error details:",
          err.response?.status,
          err.response?.data?.message || err.message
        );
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
<NoDataState/>              )}
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
<NoDataState/>          )}

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

  // Reset to first page whenever data reloads
  useEffect(() => {
    setServicePage(1);
  }, [topServices]);

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

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const bookingRes = await api.get("/admin/analytics/bookings");
        const employeeRes = await api.get("/admin/analytics/employees");

        // Prepare top services for TopStats
        const popularServices = bookingRes.data?.data?.popularServices || [];
        setTopServices(
          popularServices.map((s) => ({
            service: s.serviceName,
            thisMonth: s.bookings,
            lastMonth: s.revenue, // keep as provided (adjust if API offers last month separately)
          }))
        );

        // Prepare top team members for TopStats
        const employeePerformance =
          employeeRes.data?.data?.employeePerformance || [];
        setTopTeamMembers(
          employeePerformance.slice(0, 5).map((e) => ({
            name: e.employeeName,
            thisMonth: `AED ${(
              e.totalRevenue || 0
            ).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
            lastMonth: `AED ${(
              e.avgBookingValue || 0
            ).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
          }))
        );

        setLoading(false);
      } catch (err) {
        console.log("❌ Stats API failed");
        console.log(
          "Error details:",
          err.response?.status,
          err.response?.data?.message || err.message
        );
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
            <Loading/>
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
<NoDataState/>          )}
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
           <Loading/>
          ) : error ? (
            <Error500Page message={error} />
          ) : topTeamMembers.length ? (
            topTeamMembers.map((member, index) => (
              <div key={index} className="stats-row">
                <div className="stats-cell">{member.name}</div>
                <div className="stats-cell">{member.thisMonth}</div>
                <div className="stats-cell">{member.lastMonth}</div>
              </div>
            ))
          ) : (
<NoDataState/>          )}
        </div>
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
