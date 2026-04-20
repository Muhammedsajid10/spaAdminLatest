import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Calendar, Download, Filter, MoreHorizontal } from 'lucide-react';
import MonthPicker from '@components/ui/MonthPicker';
import ExportDropdown from '@components/common/ExportDropdown';
import Dropdown from '@components/ui/DropDown';
import Button from '../ui/Button';
import { 
  setDateRange, 
  setSelectedLocation, 
  setSelectedTeamMember,
  setSelectedService,
  setGroupBy 
} from '@store/slices/filtersSlice';
import './FilterSection.css';

const FilterSection = ({ 
  reportType,
  onExport,
  showLocationFilter = true,
  showTeamMemberFilter = true,
  showServiceFilter = true,
  showGroupByFilter = false,
  customFilters = [],
  className = ''
}) => {
  const dispatch = useDispatch();
  const filters = useSelector(state => state.filters);
  const exportLoading = useSelector(state => state.reports.exportLoading);

  const [dateRange, setDateRange] = useState('last-30-days');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - in real app, these would come from API or props
  const locationOptions = [
    { value: 'all', label: 'All Locations' },
    { value: 'allora-spa-dubai', label: 'Allora Spa and Massage Centre Dubai' },
    { value: 'allora-spa-abudhabi', label: 'Allora Spa and Massage Centre Abu Dhabi' },
  ];

  const teamMemberOptions = [
    { value: 'all', label: 'All Team Members' },
    { value: 'nina-niken', label: 'Nina Niken' },
    { value: 'dayu-eka', label: 'Dayu Eka' },
    { value: 'sarita-lamsal', label: 'Sarita Lamsal' },
  ];

  const serviceOptions = [
    { value: 'all', label: 'All Services' },
    { value: 'massage', label: 'Massage Therapy' },
    { value: 'facial', label: 'Facial Treatment' },
    { value: 'body-treatment', label: 'Body Treatment' },
  ];

  const groupByOptions = [
    { value: 'location', label: 'Location' },
    { value: 'team-member', label: 'Team Member' },
    { value: 'service', label: 'Service' },
    { value: 'channel', label: 'Channel' },
    { value: 'status', label: 'Status' },
  ];

  const handleDateRangeChange = (newRange) => {
    dispatch(setDateRange(newRange));
  };

  const handleLocationChange = (option) => {
    dispatch(setSelectedLocation(option.value));
  };

  const handleTeamMemberChange = (option) => {
    dispatch(setSelectedTeamMember(option.value));
  };

  const handleServiceChange = (option) => {
    dispatch(setSelectedService(option.value));
  };

  const handleGroupByChange = (option) => {
    dispatch(setGroupBy(option.value));
  };

  const handleExportClick = (format) => {
    if (onExport) {
      onExport(format);
    }
  };

  return (
    <div className={`filter-section ${className}`}>
      <div className="filter-row">
        <div className="filter-left">
          {/* Date Range Picker - Always shown */}
          <div className="date-filter">
            <Calendar className="filter-icon" />
            <select 
              value={dateRange} 
              onChange={(e) => setDateRange(e.target.value)}
              className="date-select"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="last-7-days">Last 7 days</option>
              <option value="last-30-days">Last 30 days</option>
              <option value="this-month">This month</option>
              <option value="last-month">Last month</option>
              <option value="custom">Custom range</option>
            </select>
          </div>

          {/* Location Filter */}
          {showLocationFilter && (
            <div className="filter-section__group">
              <Dropdown
                options={locationOptions}
                value={locationOptions.find(opt => opt.value === filters.selectedLocation)}
                onChange={handleLocationChange}
                placeholder="Select Location"
              />
            </div>
          )}

          {/* Team Member Filter */}
          {showTeamMemberFilter && (
            <div className="filter-section__group">
              <Dropdown
                options={teamMemberOptions}
                value={teamMemberOptions.find(opt => opt.value === filters.selectedTeamMember)}
                onChange={handleTeamMemberChange}
                placeholder="Select Team Member"
              />
            </div>
          )}

          {/* Service Filter */}
          {showServiceFilter && (
            <div className="filter-section__group">
              <Dropdown
                options={serviceOptions}
                value={serviceOptions.find(opt => opt.value === filters.selectedService)}
                onChange={handleServiceChange}
                placeholder="Select Service"
              />
            </div>
          )}

          {/* Group By Filter */}
          {showGroupByFilter && (
            <div className="filter-section__group">
              <label className="filter-section__label">Group by</label>
              <Dropdown
                options={groupByOptions}
                value={groupByOptions.find(opt => opt.value === filters.groupBy)}
                onChange={handleGroupByChange}
                placeholder="Group by"
              />
            </div>
          )}

          {/* Custom Filters */}
          {customFilters.map((filter, index) => (
            <div key={index} className="filter-section__group">
              {filter.label && (
                <label className="filter-section__label">{filter.label}</label>
              )}
              <Dropdown
                options={filter.options}
                value={filter.value}
                onChange={filter.onChange}
                placeholder={filter.placeholder}
              />
            </div>
          ))}
        </div>

        <div className="filter-right">
          {/* Actions */}
          <Button
            variant="ghost"
            icon={<Filter size={16} />}
            className="filter-section__filters-btn md:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
          
          <ExportDropdown
            onExport={onExport}
            loading={exportLoading}
            reportType={reportType}
          />

          <Button
            variant="ghost"
            icon={<MoreHorizontal size={16} />}
            className="filter-section__options-btn"
          >
            Options
          </Button>
        </div>
      </div>

      {/* Extended Filters - for smaller screens */}
      {showFilters && (
        <div className="extended-filters">
          {showLocationFilter && (
            <div className="filter-group">
              <label>Location</label>
              <select className="filter-select">
                <option>All locations</option>
                <option>Main Branch</option>
                <option>Secondary Branch</option>
              </select>
            </div>
          )}
          
          {showTeamMemberFilter && (
            <div className="filter-group">
              <label>Team Member</label>
              <select className="filter-select">
                <option>All team members</option>
                <option>John Doe</option>
                <option>Jane Smith</option>
              </select>
            </div>
          )}
          
          {showServiceFilter && (
            <div className="filter-group">
              <label>Service</label>
              <select className="filter-select">
                <option>All services</option>
                <option>Haircut</option>
                <option>Massage</option>
              </select>
            </div>
          )}
          
          {showGroupByFilter && (
            <div className="filter-group">
              <label>Group by</label>
              <select className="filter-select">
                <option>Type</option>
                <option>Date</option>
                <option>Team Member</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterSection;