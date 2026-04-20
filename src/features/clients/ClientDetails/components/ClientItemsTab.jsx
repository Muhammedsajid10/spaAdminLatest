import React, { useState, useMemo } from 'react';
import { User, Calendar, MapPin } from 'lucide-react';
import './ClientItemsTab.css';

const ClientItemsTab = ({ client, bookings = [], memberships = [], servicesMap = {} }) => {
  const [activeSubTab, setActiveSubTab] = useState('memberships');

  // Format bookings data for display
  const formattedServices = useMemo(() => {
    return bookings.map(booking => {
      const firstService = booking.services?.[0];

      // Lookup service name using servicesMap
      let serviceName = 'Service';
      if (firstService?.service) {
        const serviceId = typeof firstService.service === 'string' ? firstService.service : firstService.service._id;
        const serviceObj = servicesMap[serviceId];
        if (serviceObj) {
          serviceName = serviceObj.name;
        } else if (typeof firstService.service === 'object' && firstService.service.name) {
          serviceName = firstService.service.name;
        }
      }

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

      return formatted;
    });
  }, [bookings, servicesMap]);

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
        {activeSubTab === 'products' && (
           <div className="empty-state-container">
             <div className="empty-icon-wrapper">
               <User size={32} />
             </div>
             <h3 className="empty-title">No products</h3>
             <p className="empty-description">
               No products have been sold to this client
             </p>
           </div>
        )}

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
                <div key={membership.id} className="item-card membership-card">
                  <div className="item-card-content">
                    <div className="item-info">
                      <span className="item-name">{membership.name}</span>
                      <span className="item-meta">
                        1 year membership • <span className={`status-text ${membership.status?.toLowerCase()}`}>{membership.status}</span>
                      </span>
                      
                     
                    </div>
                    
                    <div className="membership-icon-right">
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                    </div>
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
