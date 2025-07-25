import { useState, useEffect, useCallback, useRef } from 'react';
import { correspondenceApi } from '../services/apiService';

export const useDataTable = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, direction: null });
  
  const pageSize = 50;
  const loadingRef = useRef(false);

  // Build filter parameters
  const buildFilterParams = () => {
    const params = {};
    
    // Add Russian letters filter by default
    params.direction = 'Incoming';
    
    // Add column filters
    Object.entries(columnFilters).forEach(([column, value]) => {
      if (value && value.length > 0) {
        params[`${column}__in`] = Array.isArray(value) ? value.join(',') : value;
      }
    });
    
    // Add advanced filters
    Object.entries(advancedFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });
    
    return params;
  };

  // Fetch data function
  const fetchData = useCallback(async (pageNum = 1, append = false) => {
    if (loadingRef.current) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const params = {
        page: pageNum,
        page_size: pageSize,
        search: searchTerm,
        ordering: sortConfig.field && sortConfig.direction 
          ? `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.field}`
          : undefined,
        ...buildFilterParams()
      };
      
      // Remove undefined params
      Object.keys(params).forEach(key => 
        params[key] === undefined && delete params[key]
      );
      
      const response = await correspondenceApi.getAll(params);
      const responseData = response.data;
      const newItems = responseData.results || responseData || [];
      
      if (append) {
        setData(prevData => [...prevData, ...newItems]);
      } else {
        setData(newItems);
        setCurrentPage(1);
      }
      
      setTotalCount(responseData.count || newItems.length);
      setHasMore(newItems.length === pageSize);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [searchTerm, columnFilters, advancedFilters, sortConfig, pageSize]);

  // Load more data for infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchData(nextPage, true);
    }
  }, [loading, hasMore, currentPage, fetchData]);

  // Reset and reload data
  const resetAndReload = useCallback(() => {
    setCurrentPage(1);
    setData([]);
    setHasMore(true);
    fetchData(1, false);
  }, [fetchData]);

  // Update letter function
  const updateLetter = useCallback(async (id, field, value) => {
    try {
      const updateData = { [field]: value };
      const response = await correspondenceApi.update(id, updateData);
      
      // Update the item in local state
      setData(prevData => 
        prevData.map(item => 
          item.correspondence_id === id 
            ? { ...item, [field]: value }
            : item
        )
      );
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating letter:', err);
      return { 
        success: false, 
        error: 'فشل في تحديث البيانات. يرجى المحاولة مرة أخرى.' 
      };
    }
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setColumnFilters({});
    setAdvancedFilters({});
    setSearchTerm('');
    setSortConfig({ field: null, direction: null });
  }, []);

  // Get unique values for column filters
  const getColumnUniqueValues = useCallback((column) => {
    const values = new Set();
    data.forEach(item => {
      let value = item[column];
      
      // Handle nested objects based on actual correspondence model fields
      if (column === 'type' && item.type) {
        value = item.type.type_name;
      } else if (column === 'assigned_to' && item.assigned_to) {
        value = item.assigned_to.full_name_arabic || item.assigned_to.username;
      } else if (column === 'current_status' && item.current_status) {
        value = item.current_status.procedure_name;
      } else if (column === 'contact' && item.contact) {
        value = item.contact.name;
      }
      
      if (value) {
        values.add(value);
      }
    });
    
    return Array.from(values).sort();
  }, [data]);

  // Initial data load
  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  return {
    // Data
    data,
    loading,
    error,
    totalCount,
    hasMore,
    
    // Filters and search
    searchTerm,
    setSearchTerm,
    columnFilters,
    setColumnFilters,
    advancedFilters,
    setAdvancedFilters,
    sortConfig,
    setSortConfig,
    
    // Actions
    loadMore,
    resetAndReload,
    updateLetter,
    clearAllFilters,
    getColumnUniqueValues,
    
    // Utilities
    isFiltered: Object.keys(columnFilters).length > 0 || 
                Object.keys(advancedFilters).length > 0 || 
                searchTerm.length > 0
  };
};
