import React from 'react';
import { NavLink } from 'react-router-dom';
import './NestedSideBar.css';

const NestedSidebar = ({ title, menuItems }) => {
  return (
    <div className="nested-sidebar-container">
      <h1 className="nested-sidebar-title">{title}</h1>
      <nav className="nested-sidebar-nav">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // Add 'end' prop for parent routes to avoid it being active for all children
            end={item.path === '/team' || item.path === '/catalog'} 
            className={({ isActive }) => 
              isActive ? 'nested-menu-item active' : 'nested-menu-item'
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default NestedSidebar;