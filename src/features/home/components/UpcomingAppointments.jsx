import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Loading from '../../../states/Loading';
import NoDataState from '../../../states/NoData';

const UpcomingAppointments = ({ appointments = [], loading }) => {
  const grouped = appointments.reduce((acc, appointment) => {
    const label = appointment.date;
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  const series = Object.keys(grouped).map((name) => ({
    name,
    count: grouped[name],
  }));

  return (
    <div className="card stats-card">
      <h3>Upcoming appointments</h3>
      <p>Next 7 days</p>
      <div className="chart-wrapper" style={{ minHeight: 220 }}>
        {loading ? (
          <Loading />
        ) : series.length ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} width={40} allowDecimals={false} />
              <Tooltip formatter={(value) => [value, 'Appointments']} />
              <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <NoDataState />
        )}
      </div>
    </div>
  );
};

export default UpcomingAppointments;
