import React from 'react';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiSearch, FiFilter, FiPackage, FiShoppingBag } = FiIcons;

const FilterBar = ({ 
  searchTerm, 
  setSearchTerm, 
  sortBy, 
  setSortBy, 
  sortOrder, 
  setSortOrder, 
  sortOptions 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
      {/* Search Bar - First Line */}
      <div className="w-full relative">
        <SafeIcon 
          icon={FiSearch} 
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" 
        />
        <input 
          type="text" 
          placeholder="Search parts by name, number, or description..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
        />
      </div>

      {/* Filters - Second Line */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 flex items-center space-x-4">
          <div className="flex items-center space-x-2 flex-1">
            <SafeIcon icon={FiFilter} className="h-4 w-4 text-gray-400" />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)} 
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <select 
            value={sortOrder} 
            onChange={(e) => setSortOrder(e.target.value)} 
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;