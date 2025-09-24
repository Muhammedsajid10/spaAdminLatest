import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import MainSidebar from './MainSideBar';
import TopNavbar from './TopNavBar';
import { sidebarConfig } from './SideBarConfig';
import NestedSidebar from './NestedSideBar';

import './DashboardLayout.css';

const DashboardLayout = () => {
  const location = useLocation();
  const [isNestedSidebarOpen, setIsNestedSidebarOpen] = useState(false);

  const toggleNestedSidebar = () => {
    setIsNestedSidebarOpen(!isNestedSidebarOpen);
  };

  const getNestedSidebar = () => {
    let config = null;
    if (location.pathname.startsWith('/sales')) {
      config = sidebarConfig.sales;
    } else if (location.pathname.startsWith('/team')) {
      config = sidebarConfig.team;
    } else if (location.pathname.startsWith('/catalog')) {
      config = sidebarConfig.catalog;
    }

    if (config) {
      return <NestedSidebar title={config.title} menuItems={config.menuItems} />;
    }
    return null;
  };

  const nestedSidebarComponent = getNestedSidebar();
  const mainAreaClass = nestedSidebarComponent ? 'has-nested-sidebar' : '';

  return (
    <div className="app-container">
      <div className="top-navbar-fixed">
        <TopNavbar />
      </div>

      <div className="main-area">
        <div className="mainSidebarArea">
          <MainSidebar />
        </div>

        {nestedSidebarComponent && (
          <>
            {/* --- CHANGE: The button's content is now a div for styling the arrow --- */}
            <button className="sidebar-toggle-btn" onClick={toggleNestedSidebar} aria-label="Toggle sidebar">
              <div className="icon-arrow"></div>
            </button>
            <div className={`nestedSidebarArea ${isNestedSidebarOpen ? 'isOpen' : ''}`}>
              {nestedSidebarComponent}
            </div>
          </>
        )}
        
        {nestedSidebarComponent && isNestedSidebarOpen && (
           <div className="mobile-overlay" onClick={toggleNestedSidebar}></div>
        )}

        <div className="contentArea">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;