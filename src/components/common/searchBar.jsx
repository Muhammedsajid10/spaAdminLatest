import React from 'react';
import { Search } from 'lucide-react';
import './../../styles/SearchBar.css';

const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  className = '',
  size = 'md',
  ...props
}) => {
  return (
    <div className={`search-bar search-bar--${size} ${className}`}>
      <Search className="search-bar__icon" />
      <input
        type="text"
        className="search-bar__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};

export default SearchBar;