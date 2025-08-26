import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import Loading from '../states/Loading';
import Error500Page from '../states/ErrorPage';
import NoData from '../states/NoData';
import api from '../Service/Api';

// Charts
import { Line, Bar } from 'react-chartjs-2';
import Chart from 'chart.js/auto';

// Utilities
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const formatCurrency = (n) => {
  if (typeof n !== 'number') return 'AED 0.00';
  return 'AED ' + n.toFixed(2);
};

// --- Sales Analytics Component ---
const SalesAnalytics = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totals, setTotals] = useState({ totalAmount: 0, count: 0 });

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/payments/admin/all?page=1&limit=1000');
        const items = res.data?.data?.payments || res.data?.data || res.data || [];
        setPayments(items);
        const totalAmount = (items || []).reduce((s, it) => s + (Number(it.amount) || 0), 0);
        setTotals({ totalAmount, count: (items || []).length });
      } catch (err) {
        console.error(err);
        setError('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  if (loading) return <Loading />;
  if (error) return <Error500Page message={error} />;

  // Build chart: payments per day (last 30 days limited)
  const recent = payments.slice().sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)).slice(-30);
  const groupByDate = {};
  recent.forEach(p => {
    const d = new Date(p.createdAt || p.date || Date.now());
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    groupByDate[key] = (groupByDate[key] || 0) + (Number(p.amount) || 0);
  });
  const labels = Object.keys(groupByDate);
  const data = labels.map(k => groupByDate[k]);

  return (
    <div className="analytics-section">
      <div className="section-header">
        <div>
          <h2>Sales Overview</h2>
          <p className="section-sub">Payments, revenue and transaction list</p>
        </div>
        <div className="header-stats">
          <div className="small-metric">
            <div className="small-metric-label">Total revenue</div>
            <div className="small-metric-value">{formatCurrency(totals.totalAmount)}</div>
          </div>
          <div className="small-metric">
            <div className="small-metric-label">Transactions</div>
            <div className="small-metric-value">{totals.count}</div>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <h3>Revenue (recent)</h3>
        {labels.length ? (
          <Line
            data={{
              labels: labels.map(l => l.split('-').slice(1).join('/')),
              datasets: [{
                label: 'Revenue (AED)',
                data,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.08)',
                tension: 0.3,
                fill: true,
                pointRadius: 3
              }]
            }}
            options={{ responsive: true, plugins: { legend: { display: false } } }}
          />
        ) : (
          <NoData message="No recent payments" />
        )}

        <div className="transactions-list" style={{ marginTop: 18 }}>
          <h4>Recent transactions</h4>
          {payments.slice(0,8).map((t, i) => (
            <div key={t._id || t.id || i} className="transaction-item">
              {/* existing compact item */}
              <div className="transaction-info">
                <div className="transaction-id">{t._id || t.id || '—'}</div>
                <div className="transaction-details">
                  <div>{t.method || t.paymentMethod || '—'}</div>
                  <div className="text-muted">{new Date(t.createdAt || t.date || Date.now()).toLocaleString()}</div>
                </div>
              </div>
              <div className="transaction-stats">
                <div className={t.status === 'refund' ? 'transaction-status failed' : 'transaction-status completed'}>
                  {t.status || 'completed'}
                </div>
                <div className="transaction-amount">{formatCurrency(Number(t.amount) || 0)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Full table (user-friendly) */}
        <div className="table-wrap" style={{ marginTop: 18 }}>
          <h4>All Transactions</h4>
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Method</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.length ? payments.map((p, idx) => (
                <tr key={p._id || p.id || idx}>
                  <td>{new Date(p.createdAt || p.date || Date.now()).toLocaleString()}</td>
                  <td className="mono">{p._id || p.id || '—'}</td>
                  <td>{p.method || p.paymentMethod || '—'}</td>
                  <td>
                    <span className={`transaction-status ${p.status === 'pending' ? 'pending' : p.status === 'refund' ? 'failed' : 'completed'}`}>
                      {p.status || 'completed'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(Number(p.amount) || 0)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}><NoData message="No transactions found" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Service Analytics (uses /admin/analytics/bookings) ---
const ServiceAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get('/admin/analytics/bookings');
        const payload = res.data?.data || {};
        setData(payload);
      } catch (e) {
        console.error(e);
        setErr('Failed to load bookings analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <Loading />;
  if (err) return <Error500Page message={err} />;
  if (!data) return <NoData message="No booking analytics available" />;

  const popular = data.popularServices || [];
  const bookingTrends = data.bookingTrends || [];
  const peakHours = data.peakHours || [];

  // Trend chart
  const trendLabels = bookingTrends.map(b => `${b._id.month}/${b._id.year}`);
  const trendData = bookingTrends.map(b => b.totalBookings || 0);

  const peakLabels = Array.from({length:24}).map((_,i) => String(i));
  const peakCounts = peakLabels.map(h => {
    const found = peakHours.find(p => Number(p._id) === Number(h));
    return found ? found.count : 0;
  });

  // Top services bar list
  const maxBookings = Math.max(...popular.map(s => s.bookings || 0), 1);

  return (
    <div className="analytics-section service-analytics">
      <div className="section-header">
        <div>
          <h2>Service Analytics</h2>
          <p className="section-sub">Popular services, booking trends & peak hours</p>
        </div>
        <div className="header-stats">
          <div className="small-metric">
            <div className="small-metric-label">Top service</div>
            <div className="small-metric-value">{(popular[0]?.serviceName) || '—'}</div>
          </div>
          <div className="small-metric">
            <div className="small-metric-label">Total popular</div>
            <div className="small-metric-value">{popular.reduce((s,p)=>s+(p.bookings||0),0)}</div>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <div className="analytics-row">
          <div className="analytics-half">
            <h3>Booking Trends</h3>
            <Line
              data={{
                labels: trendLabels.length ? trendLabels : ['No data'],
                datasets: [{ label: 'Bookings', data: trendData, borderColor: '#06b6d4', backgroundColor: 'rgba(6,182,212,0.08)', fill: true, tension: 0.3 }]
              }}
              options={{ plugins: { legend: { display: false } } }}
            />
          </div>

          <div className="analytics-half">
            <h3>Peak Hours</h3>
            <Bar
              data={{
                labels: peakLabels,
                datasets: [{ label: 'Bookings', data: peakCounts, backgroundColor: '#2563eb' }]
              }}
              options={{ plugins: { legend: { display: false } }, scales: { x: { title: { display: true, text: 'Hour' } } } }}
            />
          </div>
        </div>

        <h3 style={{ marginTop: 18 }}>Top Services</h3>
        <div className="top-services-list">
          {popular.map((svc, idx) => (
            <div key={svc._id || idx} className="top-service-row">
              <div className="service-rank">{idx + 1}</div>
              <div className="service-meta">
                <div className="service-name">{svc.serviceName || 'Unnamed'}</div>
                <div className="service-sub">Category: {svc.category || '—'}</div>
              </div>
              <div className="service-stats">
                <div>{svc.bookings || 0} bookings</div>
                <div className="muted">{formatCurrency(svc.revenue || 0)}</div>
              </div>
              <div className="service-bar-wrap" aria-hidden>
                <div className="service-bar" style={{ width: `${Math.round(((svc.bookings || 0) / maxBookings) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="analytics-card" style={{ marginTop: 8 }}>
        <h3>Top Services (detailed)</h3>
        <div className="table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Service</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Bookings</th>
                <th style={{ textAlign: 'right' }}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popular.length ? popular.map((svc, i) => (
                <tr key={svc._id || i}>
                  <td>{i + 1}</td>
                  <td className="service-name">{svc.serviceName || 'Unnamed'}</td>
                  <td>{svc.category || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{svc.bookings || 0}</td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(svc.revenue || 0)}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}><NoData message="No services data" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Team Analytics (/admin/analytics/employees) ---
const TeamAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await api.get('/admin/analytics/employees');
        const payload = res.data?.data || {};
        setData(payload);
      } catch (e) {
        console.error(e);
        setErr('Failed to load employee analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  if (loading) return <Loading />;
  if (err) return <Error500Page message={err} />;
  if (!data) return <NoData message="No employee analytics" />;

  // Example: assume payload has topEmployees array
  const top = data.topEmployees || data.topPerformers || [];

  return (
    <div className="analytics-section">
      <div className="section-header">
        <div><h2>Team Analytics</h2><p className="section-sub">Top performers & scheduling insights</p></div>
      </div>

      <div className="analytics-card">
        <h3>Top Employees</h3>
        <div className="employee-list">
          {top.length ? top.map((e, i) => (
            <div key={e._id || e.id || i} className="employee-item">
              <div style={{display:'flex', alignItems:'center'}}>
                <div className="employee-avatar">{(e.name||'').charAt(0) || '?'}</div>
                <div className="employee-info">
                  <div className="employee-name">{e.name || e.fullName || 'Unnamed'}</div>
                  <div className="employee-stats">{e.bookings || 0} bookings • {e.revenue ? formatCurrency(e.revenue) : ''}</div>
                </div>
              </div>
              <div style={{fontWeight:700}}>{e.rating || ''}</div>
            </div>
          )) : <NoData message="No top employees" />}
        </div>
      </div>

      <div className="analytics-card">
        <h3>Top Employees (detailed)</h3>
        <div className="table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Employee</th>
                <th>Bookings</th>
                <th>Revenue</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {top.length ? top.map((e, i) => (
                <tr key={e._id || e.id || i}>
                  <td>{i + 1}</td>
                  <td className="employee-cell">
                    <div style={{display:'flex', alignItems:'center', gap:12}}>
                      <div className="employee-avatar">{(e.name||'').charAt(0) || '?'}</div>
                      <div>
                        <div className="employee-name">{e.name || e.fullName || 'Unnamed'}</div>
                        <div className="employee-stats muted">{e.email || ''}</div>
                      </div>
                    </div>
                  </td>
                  <td>{e.bookings || 0}</td>
                  <td>{e.revenue ? formatCurrency(e.revenue) : '-'}</td>
                  <td>{e.rating ?? '-'}</td>
                </tr>
              )) : (
                <tr><td colSpan={5}><NoData message="No top employees" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- Payments Tab (new) ---
const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoadingPayments(true);
      setPaymentsError(null);
      try {
        const res = await api.get('/payments/admin/all?page=1&limit=1000');
        const items = res.data?.data?.payments || res.data?.data || res.data || [];
        setPayments(items);
      } catch (err) {
        console.error('Payments fetch error', err);
        setPaymentsError('Failed to load payments');
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPayments();
  }, []);

  if (loadingPayments) return <Loading />;
  if (paymentsError) return <Error500Page message={paymentsError} />;
  if (!payments || payments.length === 0) return <NoData message="No payments found" />;

  const filtered = payments.filter(p => {
    if (!query) return true;
    const q = query.toLowerCase();
    return String(p._id || p.id || '').toLowerCase().includes(q)
      || String(p.bookingId || p.booking?._id || '').toLowerCase().includes(q)
      || String(p.customerName || p.customer?.name || p.phone || '').toLowerCase().includes(q)
      || String(p.method || p.paymentMethod || '').toLowerCase().includes(q);
  });

  return (
    <div className="analytics-section">
      <div className="section-header">
        <div>
          <h2>Payments</h2>
          <p className="section-sub">All transactions, searchable and exportable</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by transaction, booking, customer or method..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e6e6e6', minWidth: 320 }}
          />
        </div>
      </div>

      <div className="analytics-card">
        <div className="table-wrap">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Method</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length ? filtered.map((p, i) => (
                <tr key={p._id || p.id || i}>
                  <td>{new Date(p.createdAt || p.date || Date.now()).toLocaleString()}</td>
                  <td className="mono">{p._id || p.id || '—'}</td>
                  <td className="mono">{p.bookingId || p.booking?._id || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontWeight: 700 }}>{p.customerName || p.customer?.name || p.payerName || '-'}</span>
                      <span className="muted">{p.customer?.email || p.email || p.phone || ''}</span>
                    </div>
                  </td>
                  <td>{p.method || p.paymentMethod || p.channel || '-'}</td>
                  <td>
                    <span className={`transaction-status ${p.status === 'pending' ? 'pending' : p.status === 'refund' ? 'failed' : 'completed'}`}>
                      {p.status || 'completed'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>{formatCurrency(Number(p.amount) || 0)}</td>
                </tr>
              )) : (
                <tr><td colSpan={7}><NoData message="No matching payments" /></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="page-title">Business Analytics Dashboard</h1>
          <p className="page-subtitle">Monitor sales, services, team & payments in one place.</p>
        </div>
      </div>

      <div className="tabs-container">
        <button className={`tab-button ${activeTab === 'sales' ? 'active' : ''}`} onClick={() => setActiveTab('sales')}>Sales</button>
        <button className={`tab-button ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>Services</button>
        <button className={`tab-button ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>Team</button>
        <button className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`} onClick={() => setActiveTab('payments')}>Payments</button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'sales' && <SalesAnalytics />}
        {activeTab === 'services' && <ServiceAnalytics />}
        {activeTab === 'team' && <TeamAnalytics />}
        {activeTab === 'payments' && <Payments />}
      </div>
    </div>
  );
};

export default Dashboard;