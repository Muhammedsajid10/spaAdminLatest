import React from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaCalendarAlt,
  FaUserFriends,
  FaUserTie,
  FaSalesforce,
  FaThLarge,
  FaTachometerAlt,
} from "react-icons/fa";
import "./MainSideBar.css";

const MainSideBar = () => {
  const menuItems = [
    { icon: <FaHome />, label: "Home", to: "/" },
    { icon: <FaCalendarAlt />, label: "Calendar", to: "/calendar" },
    { icon: <FaSalesforce />, label: "Sales", to: "/sales" },
    { icon: <FaUserFriends />, label: "Appointments", to: "/clients-list" },
    { icon: <FaUserTie />, label: "Team", to: "/catalog" },
    { icon: <FaThLarge />, label: "Catalog", to: "/team" },
    { icon: <FaTachometerAlt />, label: "Dashboard", to: "/report-analytics" },
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