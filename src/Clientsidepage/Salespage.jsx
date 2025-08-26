import React from 'react';
import { FiChevronDown, FiCalendar, FiFilter, FiPlus, FiChevronLeft } from 'react-icons/fi';
import { FaTag } from "react-icons/fa6";
import './Salespage.css';

const SalesPage = () => {
  return (
    <div className="sp-container">
      <div className="sp-header">
        <button className="sp-btn-back"><FiChevronLeft /></button>
        <div>
          <h1 className="sp-title">Sales</h1>
          <p className="sp-subtext">
            View, filter and export the history of your sales. <a href="#">Learn more</a>
          </p>
        </div>
      </div>

      <div className="sp-tabs">
        <button className="sp-tab active">Sales</button>
        <button className="sp-tab">Drafts</button>
      </div>

      <div className="sp-filters">
        <input type="text" placeholder="Search by Sale or Client" className="sp-search" />
        <button className="sp-btn sp-btn-light"><FiCalendar /> Today</button>
        <button className="sp-btn sp-btn-light">Sort by <FiChevronDown /></button>
      </div>

      <div className="sp-empty-state">
        <div className="sp-empty-icon"><FaTag /></div>
        <h2 className="sp-empty-title">No sales yet</h2>
        <button className="sp-btn-create"><FiPlus /> Create new sale</button>
      </div>

      <div className="sp-actions">
        <button className="sp-btn sp-btn-light">Options <FiChevronDown /></button>
        <button className="sp-btn sp-btn-dark"><FiPlus /> Add new</button>
      </div>
    </div>
  );
};

export default SalesPage;
