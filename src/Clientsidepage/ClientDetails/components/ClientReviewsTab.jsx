import React, { useMemo } from 'react';
import { Star } from 'lucide-react';
import './ClientReviewsTab.css';

const ClientReviewsTab = ({ client, reviews = [] }) => {
  const formattedReviews = useMemo(() => {
    return reviews.map(review => ({
      id: review._id,
      rating: review.rating || 0,
      comment: review.comment || review.feedback || '',
      date: review.createdAt 
        ? new Date(review.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })
        : '',
      service: review.service?.name || review.booking?.services?.[0]?.service?.name || ''
    }));
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
                  </div>
                  <span className="review-date">{review.date}</span>
                </div>
                {review.service && (
                  <div className="review-service">{review.service}</div>
                )}
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
