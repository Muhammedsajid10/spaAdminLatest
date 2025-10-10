import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Filter, Download, MoreHorizontal } from 'lucide-react';
import MonthPicker from '../../components/ui/MonthPicker';
import ExportDropdown from '../../components/common/ExportDropdown';
import Dropdown from '../../components/ui/DropDown';
import Button from '../ui/Button';
import { 
  setDateRange, 
  setSelectedLocation, 
  setSelectedTeamMember,
  setSelectedService,
  setGroupBy 
} from '../../store/slices/filtersSlice';
import './FilterSection.css';

const FilterSection = ({ 
  reportType,
  showLocationFilter = false,
  showTeamMemberFilter = false,
  showServiceFilter = false,
  showGroupByFilter = false,
  customFilters = [],
  onExport,
  className = ''
}) => {
  const dispatch = useDispatch();
  const filters = useSelector(state => state.filters);
  const exportLoading = useSelector(state => state.reports.exportLoading);

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

  return (
    <div className={`filter-section ${className}`}>
      <div className="filter-section__main">
        {/* Date Range Picker - Always shown */}
        <div className="filter-section__group">
          <MonthPicker
            value={filters.dateRange}
            onChange={handleDateRangeChange}
          />
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

      {/* Actions */}
      <div className="filter-section__actions">
        <Button
          variant="ghost"
          icon={<Filter size={16} />}
          className="filter-section__filters-btn md:hidden"
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
  );
};

export default FilterSection;