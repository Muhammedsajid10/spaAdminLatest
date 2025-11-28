import React from 'react';
import { Star } from 'lucide-react';
import './ClientReviewsTab.css';

const ClientReviewsTab = ({ client }) => {
  return (
    <div className="reviews-tab-container">
      <div className="reviews-header">
        <h2 className="reviews-title">Reviews</h2>
      </div>

      <div className="reviews-content">
        <div className="empty-state-container">
          <div className="empty-icon-wrapper">
            <Star size={32} fill="#6366f1" color="#6366f1" />
          </div>
          <h3 className="empty-title">No reviews</h3>
          <p className="empty-description">
            Client hasn't left any reviews
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClientReviewsTab;
