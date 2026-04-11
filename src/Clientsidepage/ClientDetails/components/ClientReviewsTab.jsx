import React, { useMemo } from 'react';
import { Star, Calendar, User, Briefcase } from 'lucide-react';
import './ClientReviewsTab.css';

const ClientReviewsTab = ({ client, reviews = [] }) => {
  const formattedReviews = useMemo(() => {
    return reviews.map(review => {
      // Extract employee name from various possible structures
      let employeeName = 'Unknown';

      // Try different paths to find employee name
      if (review.employeeName && review.employeeName !== 'Unknown') {
        employeeName = review.employeeName;
      } else if (review.employee?.user?.firstName || review.employee?.user?.lastName) {
        employeeName = `${review.employee.user.firstName || ''} ${review.employee.user.lastName || ''}`.trim();
      } else if (review.employee?.firstName || review.employee?.lastName) {
        employeeName = `${review.employee.firstName || ''} ${review.employee.lastName || ''}`.trim();
      } else if (review.employee?.name) {
        employeeName = review.employee.name;
      } else if (review.booking?.services?.length > 0) {
        // Try to find the specific service in the booking that matches this review
        const serviceId = review.service?._id || review.service;
        const matchedService = review.booking.services.find(s => 
          (s.service?._id === serviceId) || (s.service === serviceId)
        );
        
        // Use matched service's employee, or fallback to first service's employee
        const targetService = matchedService || review.booking.services[0];
        
        if (targetService?.employee?.user?.firstName || targetService?.employee?.user?.lastName) {
          employeeName = `${targetService.employee.user.firstName || ''} ${targetService.employee.user.lastName || ''}`.trim();
        } else if (targetService?.employee?.firstName || targetService?.employee?.lastName) {
          employeeName = `${targetService.employee.firstName || ''} ${targetService.employee.lastName || ''}`.trim();
        }
      } else if (review.booking?.staff?.name) {
        employeeName = review.booking.staff.name;
      } else if (review.staff?.name) {
        employeeName = review.staff.name;
      }

      // Extract service name
      const serviceName = 
        review.service?.name || 
        review.booking?.services?.[0]?.service?.name || 
        '';

      // Format appointment date and time
      const appointmentDate = review.booking?.appointmentDate || review.booking?.createdAt;
      const appointmentTime = review.booking?.appointmentTime || review.booking?.startTime;

      let formattedDateTime = '';
      if (appointmentDate) {
        const date = new Date(appointmentDate);
        formattedDateTime = date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
        
        if (appointmentTime) {
          formattedDateTime += ` at ${appointmentTime}`;
        }
      }

      // Format review creation date
      const reviewDate = review.createdAt 
        ? new Date(review.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '';

      return {
        id: review._id,
        rating: review.ratings?.overall || review.rating || 0,
        comment: review.comment || review.feedback || '',
        reviewDate,
        serviceName,
        appointmentDateTime: formattedDateTime,
        employeeName,
        bookingId: review.booking?._id || review.bookingId
      };
    });
  }, [reviews]);

  return (
    <div className="reviews-tab-container">
      <div className="reviews-header">
        <h2 className="reviews-title">Reviews</h2>
      </div>

      <div className="reviews-content">
        {formattedReviews.length > 0 ? (
          <div className="reviews-list">
            {formattedReviews.map(review => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        size={16} 
                        fill={i < review.rating ? '#6366f1' : 'none'} 
                        color="#6366f1" 
                      />
                    ))}
                    <span className="rating-value">({review.rating}/5)</span>
                  </div>
                  <span className="review-date">{review.reviewDate}</span>
                </div>
                
                {/* Booking Details Section */}
                <div className="booking-details">
                  {review.serviceName && (
                    <div className="booking-detail-item">
                      <Briefcase size={14} className="detail-icon" />
                      <span className="detail-text">{review.serviceName}</span>
                    </div>
                  )}
                  {review.employeeName && review.employeeName !== 'Unknown' && (
                    <div className="booking-detail-item">
                      <User size={14} className="detail-icon" />
                      <span className="detail-text">{review.employeeName}</span>
                    </div>
                  )}
                  {review.appointmentDateTime && (
                    <div className="booking-detail-item">
                      <Calendar size={14} className="detail-icon" />
                      <span className="detail-text">{review.appointmentDateTime}</span>
                    </div>
                  )}
                </div>

                {review.comment && (
                  <p className="review-comment">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-container">
            <div className="empty-icon-wrapper">
              <Star size={32} fill="#6366f1" color="#6366f1" />
            </div>
            <h3 className="empty-title">No reviews</h3>
            <p className="empty-description">
              Client hasn't left any reviews
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientReviewsTab;
