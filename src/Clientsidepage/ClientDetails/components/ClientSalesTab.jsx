import React, { useMemo } from 'react';
import { Tag } from 'lucide-react';
import './ClientSalesTab.css';

const ClientSalesTab = ({ client, sales = [], bookings = [] }) => {
  // Format sales data for display - only show completed bookings
  // Format sales data for display - merge sales and completed bookings
  const formattedSales = useMemo(() => {
    const salesList = [];
    const processedBookingIds = new Set();

    // 1. Process existing sales
    sales.forEach(payment => {
      // If payment is linked to a booking, check if that booking is completed
      if (payment.booking) {
        const status = payment.booking.status?.toLowerCase();
        if (status !== 'complete' && status !== 'completed') {
          return; // Skip non-completed bookings
        }
      }

      const date = payment.createdAt 
        ? new Date(payment.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '';

      const items = [];
      if (payment.booking?.services) {
        payment.booking.services.forEach(svc => {
          items.push({
            name: svc.service?.name || 'Service',
            price: svc.price || 0
          });
        });
      }

      // Track booking ID to avoid duplicates from the bookings list
      if (payment.booking?._id) {
        processedBookingIds.add(payment.booking._id);
      }

      salesList.push({
        id: payment._id,
        status: payment.paymentStatus || 'pending',
        date: date,
        items: items,
        total: payment.finalAmount || payment.amount || 0,
        paymentMethod: payment.paymentMethod,
        bookingNumber: payment.booking?.bookingNumber,
        rawDate: payment.createdAt ? new Date(payment.createdAt) : new Date(0)
      });
    });

    // 2. Process completed bookings that are NOT in sales list
    if (bookings && Array.isArray(bookings)) {
      bookings.forEach(booking => {
        // Check if completed and not already processed
        const status = (booking.status || '').toLowerCase();
        if ((status === 'completed' || status === 'complete') && !processedBookingIds.has(booking._id)) {
          
          const date = booking.appointmentDate 
            ? new Date(booking.appointmentDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })
            : '';

          const items = [];
          if (booking.services) {
            booking.services.forEach(svc => {
              items.push({
                name: svc.service?.name || 'Service',
                price: svc.price || 0
              });
            });
          }

          salesList.push({
            id: `booking-sale-${booking._id}`,
            status: 'completed', // Treat completed booking as completed sale/payment for display
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

    // Sort by date descending
    return salesList.sort((a, b) => b.rawDate - a.rawDate);
  }, [sales, bookings]);

  return (
    <div className="sales-tab-container">
      <div className="sales-header">
        <h2 className="sales-title">Sales</h2>
      </div>

      {/* Sales List */}
      <div className="sales-list">
        {formattedSales.length > 0 ? (
          formattedSales.map(sale => (
            <div key={sale.id} className="sales-card">
              <div className="timeline-icon">
                <Tag size={16} />
              </div>
              <div className="timeline-line" />
              
              <div className="sales-content">
                <div className="sales-header-row">
                  <span className="sales-title-text">Sale</span>
                  <span className={`sale-status ${sale.status.toLowerCase()}`}>{sale.status}</span>
                </div>
                <div className="sales-meta">
                  {sale.date} {sale.paymentMethod && `• ${sale.paymentMethod}`}
                </div>

                <div className="sales-items">
                  {sale.items.map((item, index) => (
                    <div key={index} className="sale-item">
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">AED {item.price}</span>
                    </div>
                  ))}
                </div>

                <div className="sales-total">
                  <span className="total-label">Total</span>
                  <span className="total-amount">AED {sale.total}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No sales found for this client.
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientSalesTab;
