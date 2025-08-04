import React, { useState, useMemo } from 'react';
import './Dashboard.css';
import PaymentSummary from './PaymentSummary';
import PaymentAPITester from './PaymentAPITester';

const Reporting = () => {
  const [activeTab, setActiveTab] = useState('All reports');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [showAPITester, setShowAPITester] = useState(false);

  const categories = [
    'All reports', 
    'Sales', 
    'Finance', 
    'Appointments', 
    'Team', 
    'Clients', 
    'Inventory'
  ];

  const reportsData = {
    'All reports': [
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 9l-5 5-4-4-6 6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Performance dashboard',
        description: 'Dashboard of your business performance.',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 12l3-3 4 4 5-5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Online presence dashboard',
        description: 'Online sales and online client performance',
        starred: true,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 17l4-4 4 4" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Performance summary',
        description: 'Overview of business performance by teams or locations',
        starred: false,
        premium: true
      }
    ],
    'Sales': [
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Sales summary',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      }
    ],
    'Finance': [
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 12h10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Financial summary ',
        description: 'Complete financial overview and analytics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 12h10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Payment summary',
        description: 'Complete financial overview and analytics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 12h10" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Payment Transactions',
        description: 'Complete financial overview and analytics',
        starred: false,
        premium: false
      }
    ],
    'Appointments': [
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Appointments summary',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Appointments List',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Appointments cancellation & no-show summary',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      
    ],
      'Team': [
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Working hours activity',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Break acivity',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Attendance summary',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      
    ],
       'Clients': [
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Client summary',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Client list',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      {
        icon: (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3v18h18" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9 9h6v6H9z" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ),
        title: 'Client insights',
        description: 'Overview of all sales performance and metrics',
        starred: false,
        premium: false
      },
      
    ],
  };

  // Filter reports based on search term
  const filteredReports = useMemo(() => {
    const baseReports = reportsData[activeTab] || [];
    
    if (!searchTerm.trim()) {
      return baseReports;
    }
    
    const searchLower = searchTerm.toLowerCase();
    return baseReports.filter(report => 
      report.title.toLowerCase().includes(searchLower) ||
      report.description.toLowerCase().includes(searchLower)
    );
  }, [activeTab, searchTerm]);

  // Calculate total reports count based on current view
  const totalReportsCount = useMemo(() => {
    if (activeTab === 'All reports') {
      return Object.values(reportsData).flat().length;
    }
    return reportsData[activeTab]?.length || 0;
  }, [activeTab]);

  const handleReportClick = (report) => {
    if (report.title === 'Payment summary' || report.title === 'Payment Transactions') {
      setShowPaymentSummary(true);
    }
    // Add more report handlers here as needed
  };

  const toggleStar = (category, index) => {
    // In a real app, this would update the data
    console.log(`Toggle star for ${category} - ${index}`);
  };

  return (
    <div className="reporting-container">
      {showPaymentSummary ? (
        <div className="payment-summary-wrapper">
          <div className="back-navigation">
            <button 
              onClick={() => setShowPaymentSummary(false)}
              className="back-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Reports
            </button>
          </div>
          <PaymentSummary />
        </div>
      ) : showAPITester ? (
        <div className="api-tester-wrapper">
          <div className="back-navigation">
            <button 
              onClick={() => setShowAPITester(false)}
              className="back-button"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Reports
            </button>
          </div>
          <PaymentAPITester />
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="reporting-header">
            <div className="header-content">
              <h1 className="page-title">
                Reporting and analytics 
                <span className="report-count">
                  {searchTerm ? filteredReports.length : totalReportsCount}
                </span>
              </h1>
              <p className="page-subtitle">
                Access all of your Fresha reports. <a href="#" className="learn-more">Learn more</a>
              </p>
            </div>
            <div className="header-actions">
              {/* <button className="add-button">Add</button> */}
              {/* <button 
                onClick={() => setShowAPITester(true)}
                className="test-button"
                style={{ marginLeft: '10px', background: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px' }}
              >
                Test APIs
              </button> */}
            </div>
          </div>

      {/* Search and Filters */}
      <div className="controls-section">
        <div className="search-container">
          <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="#9ca3af" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="#9ca3af" strokeWidth="2"/>
          </svg>
          <input
            type="text"
            placeholder="Search by report name or description"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="filters-container">
          {/* <button className="filter-button">
            <span>Created by</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button> */}
          
          {/* <button className="filter-button">
            <span>Category</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 7h18M3 12h18M3 17h18" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button> */}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="tabs-container">
        {categories.map((category) => (
          <button
            key={category}
            className={`tab-button ${activeTab === category ? 'active' : ''}`}
            onClick={() => setActiveTab(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Reports Grid */}
      <div className="reports-grid">
        {filteredReports.length > 0 ? (
          filteredReports.map((report, index) => (
            <div 
              key={index} 
              className="report-card"
              onClick={() => handleReportClick(report)}
              style={{ cursor: 'pointer' }}
            >
              <div className="report-icon">
                {report.icon}
              </div>
              
              <div className="report-content">
                <h3 className="report-title">{report.title}</h3>
                <p className="report-description">{report.description}</p>
              </div>
              
              <div className="report-actions">
                {/* {report.premium && (
                  <span className="premium-badge">Premium</span>
                )} */}
                <button 
                  className={`star-button ${report.starred ? 'starred' : ''}`}
                  onClick={() => toggleStar(activeTab, index)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={report.starred ? "#fbbf24" : "none"} xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                          stroke={report.starred ? "#fbbf24" : "#d1d5db"} 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <div className="no-results-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h3 className="no-results-title">No reports found</h3>
            <p className="no-results-description">
              {searchTerm 
                ? `No reports match "${searchTerm}". Try adjusting your search terms.`
                : 'No reports available in this category.'
              }
            </p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="clear-search-button"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default Reporting;