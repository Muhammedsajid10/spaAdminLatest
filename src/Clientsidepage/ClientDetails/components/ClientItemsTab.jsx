import React, { useState, useMemo } from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
import './ClientItemsTab.css';

const ClientItemsTab = ({ client, bookings = [], memberships = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState('memberships');

  // Debug: Log received data
  console.log('📊 ClientItemsTab received:', { 
    bookingsCount: bookings.length, 
    membershipsCount: memberships.length,
    bookings,
    memberships 
  });

  // Format bookings data for display
  const formattedServices = useMemo(() => {
    console.log('🔄 Formatting bookings:', bookings);
    return bookings.map(booking => {
      const firstService = booking.services?.[0];
      const serviceName = firstService?.service?.name || 'Service';
      const employeeName = firstService?.employee?.user 
        ? `${firstService.employee.user.firstName || ''} ${firstService.employee.user.lastName || ''}`.trim()
        : (firstService?.employee?.firstName && firstService?.employee?.lastName 
          ? `${firstService.employee.firstName} ${firstService.employee.lastName}`.trim()
          : '');
      
      const date = booking.appointmentDate 
        ? new Date(booking.appointmentDate).toLocaleDateString('en-GB', {
            weekday: 'short',
            day: '2-digit',
            month: 'short'
          })
        : '';

      const formatted = {
        id: booking._id,
        bookingNumber: booking.bookingNumber,
        name: serviceName,
        date: date,
        professional: employeeName,
        location: 'Allora Spa Dubai',
        price: booking.finalAmount || booking.totalAmount || 0,
        status: booking.status
      };

      console.log('✅ Formatted service:', formatted);
      return formatted;
    });
  }, [bookings]);

  // Format memberships data for display
  const formattedMemberships = useMemo(() => {
    return memberships.map(membership => ({
      id: membership._id,
      name: membership.name || 'Membership',
      status: membership.status,
      price: membership.price || 0,
      purchaseDate: membership.createdAt 
        ? new Date(membership.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '',
      expiryDate: membership.expiryDate
        ? new Date(membership.expiryDate).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : ''
    }));
  }, [memberships]);

  return (
    <div className="items-tab-container">
      <div className="items-header">
        <h2 className="items-title">Items</h2>
        <div className="items-subtabs">
          <button 
            className={`subtab-btn ${activeSubTab === 'memberships' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('memberships')}
          >
            Memberships
            {formattedMemberships.length > 0 && (
              <span className="subtab-count">{formattedMemberships.length}</span>
            )}
          </button>
          <button 
            className={`subtab-btn ${activeSubTab === 'services' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('services')}
          >
            Services
            {formattedServices.length > 0 && (
              <span className="subtab-count">{formattedServices.length}</span>
            )}
          </button>
        </div>
      </div>

      <div className="items-content">
        {activeSubTab === 'memberships' && (
          formattedMemberships.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty-icon-wrapper">
                <User size={32} />
              </div>
              <h3 className="empty-title">No memberships</h3>
              <p className="empty-description">
                No memberships have been sold to this client
              </p>
            </div>
          ) : (
            <div className="services-list">
              {formattedMemberships.map(membership => (
                <div key={membership.id} className="item-card">
                  <div className="item-card-content">
                    <div className="item-info">
                      <span className="item-name">{membership.name}</span>
                      <span className="item-meta">
                        <Calendar size={14} style={{ marginRight: 4 }} />
                        {membership.purchaseDate}
                        {membership.expiryDate && ` - Expires: ${membership.expiryDate}`}
                        <span 
                          className={`status-badge ${membership.status?.toLowerCase()}`}
                          style={{ marginLeft: 8 }}
                        >
                          {membership.status}
                        </span>
                      </span>
                    </div>
                    <span className="item-price">AED {membership.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeSubTab === 'services' && (
          formattedServices.length === 0 ? (
            <div className="empty-state-container">
              <div className="empty-icon-wrapper">
                <Calendar size={32} />
              </div>
              <h3 className="empty-title">No services</h3>
              <p className="empty-description">
                No services have been booked by this client
              </p>
            </div>
          ) : (
            <div className="services-list">
              {formattedServices.map(service => (
                <div key={service.id} className="item-card">
                  <div className="item-card-content">
                    <div className="item-info">
                      <span className="item-name">{service.name}</span>
                      <span className="item-meta">
                        <Calendar size={14} style={{ marginRight: 4 }} />
                        {service.date}
                        {service.professional && ` • with ${service.professional}`}
                        <MapPin size={14} style={{ marginLeft: 8, marginRight: 4 }} />
                        {service.location}
                      </span>
                    </div>
                    <span className="item-price">AED {service.price}</span>
                  </div>
                  <button 
                    className="btn-view-sale"
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('View booking:', service.bookingNumber);
                    }}
                  >
                    View sale
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ClientItemsTab;
