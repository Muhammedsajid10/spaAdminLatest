import React from "react";
import { NavLink } from "react-router-dom";
import {
  FiHome,
  FiCalendar,
FiTag,
  
  FiBook,
  FiSmile,
  FiUsers
} from "react-icons/fi";

import {FaTachometerAlt,FaUserTie} from 'react-icons/fa'
import {FaChartLine} from 'react-icons/fa6'

import "./MainSideBar.css";
const MainSideBar = () => {
  const menuItems = [
    { icon: <FiHome />, label: "Home", to: "/" },
    { icon: <FiCalendar />, label: "Calendar", to: "/calendar" },
    { icon: <FiTag />, label: "Sale", to: "/sales" },
    { icon: <FiSmile />, label: "Clients", to: "/clients-list" },
    { icon: <FiUsers />, label: "Team", to: "/team" },
    { icon: <FiBook />, label: "Catalog", to: "/catalog" },
    { icon: <FaChartLine />, label: "Report", to: "/report-analytics" },
  ];

  return (
    <div className="sb-sidebar">
      {menuItems.map((item, index) => (
        <NavLink
          to={item.to}
          key={index}
          className={({ isActive }) =>
            `sb-icon-wrapper${isActive ? " sb-active" : ""}`
          }
          title={item.label}
        >
          <span className="sb-icon">{item.icon}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MainSideBar;