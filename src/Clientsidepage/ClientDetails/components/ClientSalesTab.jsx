import React, { useMemo, useState } from 'react';
import { Tag, ChevronDown } from 'lucide-react';
import './ClientSalesTab.css';

const ClientSalesTab = ({ client, sales = [], bookings = [], servicesMap = {} }) => {
  const [filterStatus, setFilterStatus] = useState('All');

  // Format sales data for display
  const formattedSales = useMemo(() => {
    const salesList = [];
    const processedBookingIds = new Set();

    // Helper to get service name
    const getServiceName = (svc) => {
      if (svc.service) {
        if (typeof svc.service === 'object' && svc.service.name) {
          return svc.service.name;
        }
        const serviceId = typeof svc.service === 'string' ? svc.service : svc.service._id;
        if (servicesMap[serviceId]) {
          return servicesMap[serviceId].name;
        }
      }
      return 'Service';
    };

    // 1. Process existing sales
    sales.forEach(payment => {
      if (payment.booking) {
        const status = payment.booking.status?.toLowerCase();
        if (status !== 'complete' && status !== 'completed') {
          return; 
        }
      }

      const date = payment.createdAt 
        ? new Date(payment.createdAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : '';

      const items = [];
      if (payment.booking?.services) {
        payment.booking.services.forEach(svc => {
          items.push({
            name: getServiceName(svc),
            price: svc.price || 0
          });
        });
      }

      if (payment.booking?._id) {
        processedBookingIds.add(payment.booking._id);
      }

      salesList.push({
        id: payment._id,
        status: payment.paymentStatus || 'pending', // paid, pending, etc.
        date: date,
        items: items,
        total: payment.finalAmount || payment.amount || 0,
        paymentMethod: payment.paymentMethod,
        bookingNumber: payment.booking?.bookingNumber,
        rawDate: payment.createdAt ? new Date(payment.createdAt) : new Date(0)
      });
    });

    // 2. Process completed bookings not in sales
    if (bookings && Array.isArray(bookings)) {
      bookings.forEach(booking => {
        const status = (booking.status || '').toLowerCase();
        if ((status === 'completed' || status === 'complete') && !processedBookingIds.has(booking._id)) {
          
          const date = booking.appointmentDate 
            ? new Date(booking.appointmentDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })
            : '';

          const items = [];
          if (booking.services) {
            booking.services.forEach(svc => {
              items.push({
                name: getServiceName(svc),
                price: svc.price || 0
              });
            });
          }

          salesList.push({
            id: `booking-sale-${booking._id}`,
            status: 'Paid', // Assuming completed bookings are paid for display purposes based on image
            date: date,
            items: items,
            total: booking.finalAmount || booking.totalAmount || 0,
            paymentMethod: booking.paymentMethod || 'Unspecified',
            bookingNumber: booking.bookingNumber,
            rawDate: booking.appointmentDate ? new Date(booking.appointmentDate) : new Date(0)
          });
        }
      });
    }

    return salesList.sort((a, b) => b.rawDate - a.rawDate);
  }, [sales, bookings, servicesMap]);

  const filteredSales = useMemo(() => {
    if (filterStatus === 'All') return formattedSales;
    return formattedSales.filter(s => s.status.toLowerCase() === filterStatus.toLowerCase());
  }, [formattedSales, filterStatus]);

  // Counts for filters
  const counts = useMemo(() => {
    return {
      all: formattedSales.length,
      paid: formattedSales.filter(s => s.status.toLowerCase() === 'paid').length,
      drafts: formattedSales.filter(s => s.status.toLowerCase() === 'draft').length
    };
  }, [formattedSales]);

  return (
    <div className="client-sales-container">
      <div className="client-sales-header">
        <h2 className="client-sales-title">Sales</h2>
      </div>

      {/* Filters */}
     
      {/* Sales List */}
      <div className="client-sales-list">
        {filteredSales.length > 0 ? (
          filteredSales.map((sale, index) => (
            <div key={sale.id} className="client-sales-card">
              <div className="client-sales-timeline-icon">
                <Tag size={14} color="#fff" />
              </div>
              {index !== filteredSales.length - 1 && <div className="client-sales-timeline-line" />}
              
              <div className="client-sales-content">
                <div className="client-sales-card-header">
                  <span className="client-sales-card-title">Sale</span>
                </div>
                <div className="client-sales-meta">
                  {sale.date} <span className="client-sales-meta-dot">•</span> <span className={`client-sales-status ${sale.status.toLowerCase()}`}>{sale.status}</span>
                </div>

                <div className="client-sales-items">
                  {sale.items.map((item, idx) => (
                    <div key={idx} className="client-sales-item">
                      <span className="client-sales-item-name">{item.name}</span>
                      <span className="client-sales-item-price">AED {item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="client-sales-total">
                  <span className="client-sales-total-label">Total</span>
                  <span className="client-sales-total-amount">AED {sale.total}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="client-sales-empty">
            No sales found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSalesTab;
