import { useState, useEffect, useCallback, useRef } from 'react';

export const useUniversalDataTable = ({
  apiService,
  defaultFilters = {},
  pageSize = 50,
  initialSort = { field: null, direction: null }
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [columnFilters, setColumnFilters] = useState({});
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [sortConfig, setSortConfig] = useState(initialSort);
  
  // Cache for column unique values
  const [columnValuesCache, setColumnValuesCache] = useState({});
  
  const loadingRef = useRef(false);

  // Build filter parameters for API calls
  const buildFilterParams = useCallback(() => {
    const params = { ...defaultFilters };
    
    // Add column filters
    Object.entries(columnFilters).forEach(([column, values]) => {
      if (values && values.length > 0) {
        // Handle different column types
        switch (column) {
          case 'type':
            params['type_name__in'] = values.join(',');
            break;
          case 'contact':
            params['contact_name__in'] = values.join(',');
            break;
          case 'current_status':
            params['current_status_name__in'] = values.join(',');
            break;
          case 'assigned_to':
            params['assigned_to__username__in'] = values.join(',');
            break;
          case 'priority':
            params['priority__in'] = values.join(',');
            break;
          case 'correspondence_date':
            params['correspondence_date__in'] = values.join(',');
            break;
          case 'direction':
            params['direction__in'] = values.join(',');
            break;
          default:
            params[`${column}__in`] = values.join(',');
        }
      }
    });
    
    // Add advanced filters
    advancedFilters.forEach(filter => {
      if (filter.field && filter.operator && filter.value !== '') {
        const fieldName = filter.field;
        let paramName = fieldName;
        
        // Map operators to Django query parameters
        switch (filter.operator) {
          case 'contains':
            paramName = `${fieldName}__icontains`;
            break;
          case 'equals':
            paramName = fieldName;
            break;
          case 'starts_with':
            paramName = `${fieldName}__istartswith`;
            break;
          case 'ends_with':
            paramName = `${fieldName}__iendswith`;
            break;
          case 'before':
            paramName = `${fieldName}__lt`;
            break;
          case 'after':
            paramName = `${fieldName}__gt`;
            break;
          case 'between':
            if (filter.value.from) params[`${fieldName}__gte`] = filter.value.from;
            if (filter.value.to) params[`${fieldName}__lte`] = filter.value.to;
            return; // Skip the main assignment below
          case 'in':
            paramName = `${fieldName}__in`;
            params[paramName] = Array.isArray(filter.value) ? filter.value.join(',') : filter.value;
            return;
          case 'not_equals':
            paramName = `${fieldName}__ne`;
            break;
          case 'is_null':
            paramName = `${fieldName}__isnull`;
            params[paramName] = true;
            return;
          case 'is_not_null':
            paramName = `${fieldName}__isnull`;
            params[paramName] = false;
            return;
          default:
            paramName = fieldName;
        }
        
        params[paramName] = filter.value;
      }
    });
    
    return params;
  }, [columnFilters, advancedFilters, defaultFilters]);

  // Fetch data function with infinite scroll support
  const fetchData = useCallback(async (pageNum = 1, append = false) => {
    if (loadingRef.current && append) return;
    
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
      
      const response = await apiService.getAll(params);
      const responseData = response.data;
      const newItems = responseData.results || responseData || [];
      
      if (append) {
        setData(prevData => [...prevData, ...newItems]);
      } else {
        setData(newItems);
        setCurrentPage(1);
      }
      
      setTotalCount(responseData.count || newItems.length);
      setHasMore(newItems.length === pageSize && responseData.next);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [searchTerm, buildFilterParams, sortConfig, pageSize, apiService]);

  // Load more data for infinite scroll
  const loadMore = useCallback(() => {
    if (!loading && !loadingRef.current && hasMore) {
      loadingRef.current = true;
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

  // Update item function
  const updateItem = useCallback(async (id, field, value) => {
    try {
      const updateData = { [field]: value };
      const response = await apiService.update(id, updateData);
      
      // Update the item in local state
      setData(prevData => 
        prevData.map(item => {
          // Handle different primary key names
          const itemId = item.correspondence_id || item.id;
          return itemId === id 
            ? { ...item, [field]: value }
            : item;
        })
      );
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating item:', err);
      return { 
        success: false, 
        error: 'فشل في تحديث البيانات. يرجى المحاولة مرة أخرى.' 
      };
    }
  }, [apiService]);

  // Get unique values for column filters (with caching)
  const getColumnUniqueValues = useCallback(async (column) => {
    // Check cache first
    if (columnValuesCache[column]) {
      return columnValuesCache[column];
    }

    try {
      // Fetch all data to get unique values
      const response = await apiService.getAll({
        page_size: 1000,
        ...defaultFilters
      });
      
      const allData = response.data.results || response.data || [];
      const uniqueValues = new Set();
      
      allData.forEach(item => {
        let value = getNestedValue(item, column);
        if (value !== null && value !== undefined && value !== '') {
          uniqueValues.add(value);
        }
      });
      
      // If we have more pages, fetch them too (up to a reasonable limit)
      if (response.data.next && uniqueValues.size < 100) {
        let nextUrl = response.data.next;
        let pageCount = 1;
        
        while (nextUrl && pageCount < 5) {
          try {
            const nextResponse = await fetch(nextUrl, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
              }
            });
            const nextData = await nextResponse.json();
            
            (nextData.results || []).forEach(item => {
              let value = getNestedValue(item, column);
              if (value !== null && value !== undefined && value !== '') {
                uniqueValues.add(value);
              }
            });
            
            nextUrl = nextData.next;
            pageCount++;
          } catch (error) {
            console.warn('Error fetching additional pages for column values:', error);
            break;
          }
        }
      }
      
      const sortedValues = Array.from(uniqueValues).sort();
      
      // Cache the values
      setColumnValuesCache(prev => ({
        ...prev,
        [column]: sortedValues
      }));
      
      return sortedValues;
    } catch (error) {
      console.error('Error fetching column unique values:', error);
      return [];
    }
  }, [apiService, defaultFilters, columnValuesCache]);

  // Helper function to get nested values from objects
  const getNestedValue = (obj, column) => {
    // Handle special cases based on column name
    switch (column) {
      case 'type':
        return obj.type_name || obj.type?.type_name;
      case 'contact':
        return obj.contact_name || obj.contact?.name;
      case 'current_status':
        return obj.current_status_name || obj.current_status?.procedure_name;
      case 'assigned_to':
        return obj.assigned_to?.full_name_arabic || obj.assigned_to?.username;
      case 'priority':
        return obj.priority;
      case 'correspondence_date':
        return obj.correspondence_date;
      case 'reference_number':
        return obj.reference_number;
      case 'subject':
        return obj.subject;
      case 'direction':
        return obj.direction;
      default:
        // Handle nested object access
        const keys = column.split('.');
        let value = obj;
        for (const key of keys) {
          value = value?.[key];
          if (value === undefined || value === null) break;
        }
        return value;
    }
  };

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setColumnFilters({});
    setAdvancedFilters([]);
    setSearchTerm('');
    setSortConfig({ field: null, direction: null });
    // Clear cache when filters are cleared
    setColumnValuesCache({});
  }, []);

  // Handle column filter changes
  const handleColumnFilter = useCallback((column, values) => {
    setColumnFilters(prev => ({
      ...prev,
      [column]: values
    }));
  }, []);

  // Handle clearing column filter
  const handleClearColumnFilter = useCallback((column) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[column];
      return newFilters;
    });
  }, []);

  // Handle sorting
  const handleSort = useCallback((field) => {
    const newDirection = 
      sortConfig.field === field && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    setSortConfig({ field, direction: newDirection });
  }, [sortConfig]);

  // Handle search
  const handleSearch = useCallback((term) => {
    setSearchTerm(term);
  }, []);

  // Handle advanced filters
  const handleAdvancedFilters = useCallback((filters) => {
    setAdvancedFilters(filters);
  }, []);

  // Initial data load
  useEffect(() => {
    fetchData(1, false);
  }, [fetchData]);

  // Check if any filters are active
  const isFiltered = Object.keys(columnFilters).length > 0 || 
                    advancedFilters.length > 0 || 
                    searchTerm.length > 0;

  return {
    // Data
    data,
    loading,
    error,
    totalCount,
    hasMore,
    
    // Search and filters
    searchTerm,
    columnFilters,
    advancedFilters,
    sortConfig,
    isFiltered,
    
    // Actions
    loadMore,
    resetAndReload,
    updateItem,
    clearAllFilters,
    getColumnUniqueValues,
    
    // Handlers
    handleColumnFilter,
    handleClearColumnFilter,
    handleSort,
    handleSearch,
    handleAdvancedFilters,
    
    // Setters (for direct control if needed)
    setSearchTerm,
    setColumnFilters,
    setAdvancedFilters,
    setSortConfig
  };
};
