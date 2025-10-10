import React from 'react';
import '../../../styles/PageLayout.css';

const PageLayout = ({ 
  title, 
  subtitle, 
  children, 
  actions = null,
  breadcrumbs = null,
  className = '' 
}) => {
  return (
    <div className={`page-layout ${className}`}>
      {breadcrumbs && (
        <div className="page-layout__breadcrumbs">
          {breadcrumbs}
        </div>
      )}
      
      <div className="page-layout__header">
        <div className="page-layout__header-content">
          <div>
            <h1 className="page-layout__title">{title}</h1>
            {subtitle && (
              <p className="page-layout__subtitle">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="page-layout__actions">
              {actions}
            </div>
          )}
        </div>
      </div>
      
      <div className="page-layout__content">
        {children}
      </div>
    </div>
  );
};

export default PageLayout;