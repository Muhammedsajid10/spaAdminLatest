import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Loading from '../../../states/Loading';
import NoDataState from '../../../states/NoData';

const RecentSales = ({ salesSummary = {}, loading }) => {
  const { totalRevenue = 0, totalBookings = 0, graphData = [] } = salesSummary;

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Recent sales</h3>
          <span>Last 7 days</span>
        </div>
        <div className="sales-summary-row">
          <div className="sales-summary-item">
            <span>Total revenue</span>
            <strong>AED {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <div className="sales-summary-item">
            <span>Appointments</span>
            <strong>{totalBookings}</strong>
          </div>
        </div>
      </div>

      <div className="chart-wrapper" style={{ minHeight: 220 }}>
        {loading ? (
          <Loading />
        ) : graphData.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={graphData} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(value) => [`AED ${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="value" stroke="#4F46E5" fill="url(#salesGradient)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <NoDataState />
        )}
      </div>
    </div>
  );
};

export default RecentSales;
