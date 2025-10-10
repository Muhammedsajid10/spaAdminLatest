import React from 'react';
import '../../../styles/PageLayout.css';

const PageLayout = ({ 
  title, 
  subtitle, 
  breadcrumbs, 
  actions, 
  children, 
  className = '' 
}) => {
  return (
    <div className={`page-layout ${className}`}>
      {/* Header Section */}
      <div className="page-header">
        {breadcrumbs && (
          <div className="page-breadcrumbs">
            {breadcrumbs}
          </div>
        )}
        
        <div className="page-title-section">
          <div className="page-title-content">
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
          </div>
          
          {actions && (
            <div className="page-actions">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;