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
  
  // Request throttling safety measures
  const lastRequestTimeRef = useRef(0);
  const requestCountRef = useRef(0);
  const MIN_REQUEST_INTERVAL = 500; // Minimum 500ms between requests
  const MAX_REQUESTS_PER_MINUTE = 20; // Maximum 20 requests per minute
  
  // Cache for column unique values
  const [columnValuesCache, setColumnValuesCache] = useState({});
  
  const loadingRef = useRef(false);



  // Fetch data function with infinite scroll support
  const fetchData = useCallback(async (pageNum = 1, append = false) => {
    if (loadingRef.current && append) return;
    
    // Request throttling safety check
    const now = Date.now();
    if (now - lastRequestTimeRef.current < MIN_REQUEST_INTERVAL) {
      console.log('Request throttled - too soon since last request');
      return;
    }
    
    // Check request count per minute
    requestCountRef.current++;
    if (requestCountRef.current > MAX_REQUESTS_PER_MINUTE) {
      console.error('Too many requests per minute - blocking request');
      setError('تم إجراء عدد كبير جداً من الطلبات. يرجى الانتظار قليلاً.');
      return;
    }
    
    // Reset request count every minute
    setTimeout(() => {
      requestCountRef.current = Math.max(0, requestCountRef.current - 1);
    }, 60000);
    
    lastRequestTimeRef.current = now;
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      // Build filter params directly here to avoid dependency issues
      const filterParams = { ...defaultFilters };
      
      // Add column filters - Fixed to match Django backend field relationships
      Object.entries(columnFilters).forEach(([column, values]) => {
        if (values && values.length > 0) {
          // Handle different column types with correct Django field lookups
          switch (column) {
            case 'type':
              // Backend expects: type__type_name__in
              filterParams['type__type_name__in'] = values.join(',');
              break;
            case 'contact':
              // Backend expects: contact__name__in
              filterParams['contact__name__in'] = values.join(',');
              break;
            case 'current_status':
              // Backend expects: current_status__procedure_name__in
              filterParams['current_status__procedure_name__in'] = values.join(',');
              break;
            case 'assigned_to':
              // Backend expects: assigned_to__full_name_arabic__in or assigned_to__username__in
              filterParams['assigned_to__full_name_arabic__in'] = values.join(',');
              break;
            case 'priority':
              // Direct field
              filterParams['priority__in'] = values.join(',');
              break;
            case 'correspondence_date':
              // Direct field - for date filtering
              filterParams['correspondence_date__in'] = values.join(',');
              break;
            case 'direction':
              // Direct field
              filterParams['direction__in'] = values.join(',');
              break;
            case 'reference_number':
              // Direct field
              filterParams['reference_number__in'] = values.join(',');
              break;
            case 'parent_correspondence':
              // Backend expects: parent_correspondence__reference_number__in
              filterParams['parent_correspondence__reference_number__in'] = values.join(',');
              break;
            default:
              // For other fields, use direct field lookup
              filterParams[`${column}__in`] = values.join(',');
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
              if (filter.value.from) filterParams[`${fieldName}__gte`] = filter.value.from;
              if (filter.value.to) filterParams[`${fieldName}__lte`] = filter.value.to;
              return; // Skip the main assignment below
            case 'in':
              paramName = `${fieldName}__in`;
              filterParams[paramName] = Array.isArray(filter.value) ? filter.value.join(',') : filter.value;
              return;
            case 'not_equals':
              paramName = `${fieldName}__ne`;
              break;
            case 'is_null':
              paramName = `${fieldName}__isnull`;
              filterParams[paramName] = true;
              return;
            case 'is_not_null':
              paramName = `${fieldName}__isnull`;
              filterParams[paramName] = false;
              return;
            default:
              paramName = fieldName;
          }
          
          filterParams[paramName] = filter.value;
        }
      });

      const params = {
        page: pageNum,
        page_size: pageSize,
        search: searchTerm,
        ordering: sortConfig.field && sortConfig.direction 
          ? `${sortConfig.direction === 'desc' ? '-' : ''}${sortConfig.field}`
          : undefined,
        ...filterParams
      };
      
      // Remove undefined params
      Object.keys(params).forEach(key => 
        params[key] === undefined && delete params[key]
      );
      
      const response = await apiService.getAll(params);
      const responseData = response.data;
      const newItems = responseData.results || responseData || [];
      
      // Store the updated data in a local variable to avoid stale closure issues
      let updatedData;
      
      if (append) {
        // Update data using functional form to ensure we have the latest state
        setData(prevData => {
          updatedData = [...prevData, ...newItems];
          return updatedData;
        });
      } else {
        updatedData = newItems;
        setData(updatedData);
        setCurrentPage(1);
      }
      
      setTotalCount(responseData.count || newItems.length);
      
      // Calculate the total data length using the updatedData variable, not the stale data reference
      const totalDataLength = updatedData.length;
      
      // Corrected hasMore logic - trust the backend pagination
      // Django REST Framework provides responseData.next when there are more pages
      // We should primarily rely on this, with additional safety checks
      const hasMoreData = Boolean(
        responseData.next && // Backend says there's a next page (most reliable indicator)
        newItems.length > 0   // We got some results (safety check)
        // Note: Don't check pageSize here - backend might return exactly pageSize items
        // and still have more data. Trust responseData.next from DRF pagination.
      );
      
      console.log('🔍 fetchData completed - hasMore calculation:', {
        pageNum,
        append,
        newItemsLength: newItems.length,
        pageSize,
        hasNext: Boolean(responseData.next),
        totalCount: responseData.count,
        currentDataLength: totalDataLength,
        dataLengthBeforeAppend: data.length,
        hasMoreCalculation: {
          hasNext: Boolean(responseData.next),
          hasResults: newItems.length > 0,
          pageSize: pageSize,
          actualItemsReceived: newItems.length,
          finalHasMore: hasMoreData,
          logic: 'hasMore = hasNext && hasResults (trusting backend pagination)'
        }
      });
      
      setHasMore(hasMoreData);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('فشل في تحميل البيانات');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [searchTerm, columnFilters, advancedFilters, sortConfig, pageSize, apiService, defaultFilters]);

  // Load more data for infinite scroll
  const loadMore = useCallback(() => {
    console.log('📞 loadMore called:', {
      loading,
      loadingRef: loadingRef.current,
      hasMore,
      currentPage,
      dataLength: data.length,
      conditions: {
        notLoading: !loading,
        notLoadingRef: !loadingRef.current,
        hasMoreData: hasMore,
        hasData: data.length > 0
      }
    });
    
    if (!loading && !loadingRef.current && hasMore && data.length > 0) {
      console.log('✅ loadMore conditions met - proceeding with fetch');
      loadingRef.current = true;
      const nextPage = currentPage + 1;
      console.log(`📄 Setting page from ${currentPage} to ${nextPage}`);
      setCurrentPage(nextPage);
      fetchData(nextPage, true);
    } else {
      console.log('❌ loadMore conditions not met - skipping:', {
        loading,
        loadingRef: loadingRef.current,
        hasMore,
        dataLength: data.length
      });
    }
  }, [loading, hasMore, currentPage, fetchData, data.length]);

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

  // Debounced requests for column unique values to prevent flooding
  const pendingColumnRequests = useRef(new Map());
  
  // Get unique values for column filters (with caching and debouncing)
  const getColumnUniqueValues = useCallback(async (column) => {
    // Check cache first
    if (columnValuesCache[column]) {
      return columnValuesCache[column];
    }

    // Check if there's already a pending request for this column
    if (pendingColumnRequests.current.has(column)) {
      return pendingColumnRequests.current.get(column);
    }

    // Create the request promise
    const requestPromise = (async () => {
      try {
        // Use a smaller page size and limit to prevent overwhelming the backend
        const response = await apiService.getAll({
          page_size: 100, // Reduced from 1000
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
        
        // Limit additional page fetching to prevent request flooding
        if (response.data.next && uniqueValues.size < 50) { // Reduced limit
          let nextUrl = response.data.next;
          let pageCount = 1;
          
          while (nextUrl && pageCount < 2) { // Reduced from 5 to 2
            try {
              const nextResponse = await fetch(nextUrl, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('authToken')}`, // Fixed token key
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
      } finally {
        // Remove from pending requests
        pendingColumnRequests.current.delete(column);
      }
    })();

    // Store the promise to prevent duplicate requests
    pendingColumnRequests.current.set(column, requestPromise);
    
    return requestPromise;
  }, [apiService, defaultFilters, columnValuesCache]);

  // Helper function to get nested values from objects - Updated for correct field mappings
  const getNestedValue = (obj, column) => {
    // Handle special cases based on column name with correct backend field structure
    switch (column) {
      case 'type':
        // Backend provides: type_name (flattened) or type.type_name (nested)
        return obj.type_name || obj.type?.type_name;
      case 'contact':
        // Backend provides: contact_name (flattened) or contact.name (nested)
        return obj.contact_name || obj.contact?.name;
      case 'current_status':
        // Backend provides: current_status_name (flattened) or current_status.procedure_name (nested)
        return obj.current_status_name || obj.current_status?.procedure_name;
      case 'assigned_to':
        // Backend provides: assigned_to.full_name_arabic or assigned_to.username
        return obj.assigned_to?.full_name_arabic || obj.assigned_to?.username || 'غير مُكلف';
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
      case 'parent_correspondence':
        // Backend provides: parent_correspondence.reference_number
        return obj.parent_correspondence?.reference_number || 'لا يوجد';
      case 'created_at':
        return obj.created_at;
      case 'updated_at':
        return obj.updated_at;
      default:
        // Handle nested object access for other fields
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

  // Initial data load - only run once on mount
  useEffect(() => {
    console.log('Initial data load triggered');
    fetchData(1, false);
  }, []); // Empty dependency array - only run once on mount
  
  // Reload data when filters, search, or sort change - use refs to avoid dependency loops
  const prevFiltersRef = useRef();
  const prevSearchRef = useRef();
  const prevSortRef = useRef();
  
  useEffect(() => {
    const currentFilters = JSON.stringify(columnFilters);
    const currentAdvancedFilters = JSON.stringify(advancedFilters);
    const currentSort = JSON.stringify(sortConfig);
    
    // Check if this is not the initial render and something actually changed
    if (prevFiltersRef.current !== undefined && (
      prevFiltersRef.current !== currentFilters ||
      prevSearchRef.current !== searchTerm ||
      prevSortRef.current !== currentSort
    )) {
      console.log('Filters/search/sort changed - reloading data');
      setCurrentPage(1);
      setData([]);
      setHasMore(true);
      fetchData(1, false);
    }
    
    // Update refs
    prevFiltersRef.current = currentFilters;
    prevSearchRef.current = searchTerm;
    prevSortRef.current = currentSort;
  }, [searchTerm, columnFilters, advancedFilters, sortConfig]);

  // Check if any filters are active
  const isFiltered = Object.keys(columnFilters).length > 0 || 
                    advancedFilters.length > 0 || 
                    searchTerm.length > 0;

  // Clear cache and pending requests when filters change significantly
  useEffect(() => {
    if (Object.keys(columnFilters).length > 0 || Object.keys(advancedFilters).length > 0) {
      setColumnValuesCache({});
      // Clear any pending column requests since filters changed
      pendingColumnRequests.current.clear();
    }
  }, [columnFilters, advancedFilters]);

  // Cleanup pending requests on unmount
  useEffect(() => {
    return () => {
      pendingColumnRequests.current.clear();
    };
  }, []);

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
