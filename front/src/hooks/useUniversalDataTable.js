import { useState, useEffect, useCallback, useRef } from 'react';

export const useUniversalDataTable = ({
  apiService,
  defaultFilters = {},
  pageSize = 20,
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
  
  // Removed throttling - user wants unlimited requests
  
  // Cache for column unique values
  const [columnValuesCache, setColumnValuesCache] = useState({});
  
  const loadingRef = useRef(false);



  // Fetch data function with infinite scroll support
  const fetchData = useCallback(async (pageNum = 1, append = false) => {
    console.log('🚀 fetchData called:', { pageNum, append, loadingRef: loadingRef.current });
    
    // Don't start a new request if we're already loading (but allow the current request to complete)
    if (loadingRef.current && !append) {
      console.log('⏸️ Skipping fetchData - already loading and not appending');
      return;
    }
    
    // No throttling - user wants unlimited requests
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
      
      console.log('📋 API Request params:', params);
      console.log('🌐 Making API request...');
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.log('⏰ Request timeout triggered after 10 seconds');
          reject(new Error('Request timeout after 10 seconds'));
        }, 10000);
      });
      
      let response;
      try {
        console.log('🚀 Starting API call...');
        response = await Promise.race([
          apiService.getAll(params),
          timeoutPromise
        ]);
        console.log('✅ API call completed successfully');
      } catch (apiError) {
        console.log('❌ API call failed:', apiError);
        throw apiError;
      }
      const responseData = response.data;
      const newItems = responseData.results || responseData || [];
      
      console.log('✅ API Response received:', {
        resultsCount: newItems.length,
        totalCount: responseData.count,
        hasNext: Boolean(responseData.next),
        nextUrl: responseData.next,
        hasPrevious: Boolean(responseData.previous),
        pageNum,
        append,
        rawResponse: responseData
      });
      
      // Immediate check: if this is an append request and we got 0 items, we've reached the end
      if (append && newItems.length === 0) {
        console.log('🔚 End of data detected - no new items returned for append request');
        setHasMore(false);
        setLoading(false);
        loadingRef.current = false;
        return;
      }
      
      // Store the updated data in a local variable to avoid stale closure issues
      let updatedData;
      
      console.log('🔄 Processing data update:', {
        append,
        newItemsLength: newItems.length,
        currentDataLength: data.length
      });
      
      if (append) {
        // Calculate updatedData first, then update state
        updatedData = [...data, ...newItems];
        console.log('📊 Appending data:', {
          previousLength: data.length,
          newItemsLength: newItems.length,
          updatedLength: updatedData.length
        });
        setData(updatedData);
      } else {
        updatedData = newItems;
        console.log('🔄 Replacing data:', {
          newLength: updatedData.length
        });
        setData(updatedData);
        setCurrentPage(1);
      }
      
      setTotalCount(responseData.count || newItems.length);
      
      // Calculate the total data length using the updatedData variable, not the stale data reference
      const totalDataLength = updatedData.length;
      
      // Fixed hasMore logic - using responseData.next since API does provide it correctly
      const hasMoreData = Boolean(responseData.next);
      
      console.log('🔍 hasMoreData calculation:', {
        responseDataNext: responseData.next,
        hasMoreData: hasMoreData
      });
      
      // Alternative: If API provides total count, use that for accurate calculation
      let hasMoreBasedOnCount = false;
      if (responseData.count && typeof responseData.count === 'number') {
        // Use updatedData.length which is the correct total after appending
        const totalItemsLoaded = updatedData.length;
        hasMoreBasedOnCount = totalItemsLoaded < responseData.count;
        
        console.log('📊 Count-based hasMore calculation:', {
          totalItemsLoaded,
          totalCount: responseData.count,
          hasMoreBasedOnCount
        });
      }
      
      // Use the more reliable calculation
      const finalHasMore = hasMoreData;
      
      console.log('🔍 Final hasMore decision:', {
        hasMoreData,
        finalHasMore,
        willSetHasMore: finalHasMore
      });
      
      console.log('🔍 fetchData completed - hasMore calculation:', {
        pageNum,
        append,
        newItemsLength: newItems.length,
        pageSize,
        totalCount: responseData.count,
        currentDataLength: totalDataLength,
        dataLengthBeforeAppend: data.length,
        hasMoreCalculation: {
          hasResults: newItems.length > 0,
          gotFullPage: newItems.length === pageSize,
          totalItemsLoaded: append ? (data.length + newItems.length) : newItems.length,
          hasMoreBasedOnCount: hasMoreBasedOnCount,
          hasMoreBasedOnPageSize: hasMoreData,
          finalHasMore: finalHasMore,
          logic: 'hasMore = (totalLoaded < totalCount) OR (got full page size)'
        }
      });
      
      setHasMore(finalHasMore);
      
    } catch (err) {
      console.error('❌ Error fetching data:', {
        error: err,
        message: err.message,
        response: err.response,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        pageNum,
        append,
        params
      });
      
      // If this is an append request and we get an error, assume we've reached the end
      if (append) {
        console.log('🔚 Error on append request - assuming end of data reached');
        setHasMore(false);
      }
      
      // More specific error messages based on error type
      if (err.response?.status === 404) {
        setError('الصفحة المطلوبة غير موجودة');
        // 404 on append definitely means no more data
        if (append) setHasMore(false);
      } else if (err.response?.status === 500) {
        setError('خطأ في الخادم - يرجى المحاولة لاحقاً');
      } else if (err.response?.status === 403) {
        setError('ليس لديك صلاحية للوصول إلى هذه البيانات');
      } else if (err.message?.includes('timeout')) {
        setError('انتهت مهلة الطلب - يرجى المحاولة مرة أخرى');
        // On timeout for append, assume end of data to prevent infinite retries
        if (append) setHasMore(false);
      } else {
        setError(`فشل في تحميل البيانات: ${err.message || 'خطأ غير معروف'}`);
      }
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

  // Batch processing for column unique values to prevent flooding
  const pendingColumnRequests = useRef(new Map());
  const batchRequestTimer = useRef(null);
  const pendingBatchColumns = useRef(new Set());
  
  // Optimized batch processing of column unique values
  const processBatchColumnRequests = useCallback(async () => {
    if (pendingBatchColumns.current.size === 0) return;
    
    const columnsToProcess = Array.from(pendingBatchColumns.current);
    pendingBatchColumns.current.clear();
    
    console.log('🔄 Processing batch column requests for:', columnsToProcess);
    
    try {
      // Make a single request to get data for all columns
      const response = await apiService.getAll({
        page_size: 200, // Larger page size for batch processing
        ...defaultFilters
      });
      
      const allData = response.data.results || response.data || [];
      const columnValuesMap = {};
      
      // Process all columns from the single dataset
      columnsToProcess.forEach(column => {
        const uniqueValues = new Set();
        
        allData.forEach(item => {
          let value = getNestedValue(item, column);
          if (value !== null && value !== undefined && value !== '') {
            uniqueValues.add(value);
          }
        });
        
        columnValuesMap[column] = Array.from(uniqueValues).sort();
      });
      
      // Update cache with all processed columns
      setColumnValuesCache(prev => ({
        ...prev,
        ...columnValuesMap
      }));
      
      // Resolve all pending promises
      columnsToProcess.forEach(column => {
        const promise = pendingColumnRequests.current.get(column);
        if (promise && promise.resolve) {
          promise.resolve(columnValuesMap[column] || []);
        }
        pendingColumnRequests.current.delete(column);
      });
      
    } catch (error) {
      console.error('Error in batch column processing:', error);
      
      // Reject all pending promises
      columnsToProcess.forEach(column => {
        const promise = pendingColumnRequests.current.get(column);
        if (promise && promise.reject) {
          promise.reject(error);
        }
        pendingColumnRequests.current.delete(column);
      });
    }
  }, [apiService, defaultFilters]);
  
  // Get unique values for column filters (with batching and caching)
  const getColumnUniqueValues = useCallback(async (column) => {
    // Check cache first
    if (columnValuesCache[column]) {
      // console.log('✅ Using cached values for column:', column);
      return columnValuesCache[column];
    }

    // Check if there's already a pending request for this column
    if (pendingColumnRequests.current.has(column)) {
      // console.log('⏳ Waiting for existing request for column:', column);
      return pendingColumnRequests.current.get(column).promise;
    }

    // Create a promise that will be resolved by batch processing
    let resolvePromise, rejectPromise;
    const promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    
    // Store the promise with resolve/reject functions
    pendingColumnRequests.current.set(column, {
      promise,
      resolve: resolvePromise,
      reject: rejectPromise
    });
    
    // Add to batch processing queue
    pendingBatchColumns.current.add(column);
    // console.log('📝 Added column to batch queue:', column, 'Queue size:', pendingBatchColumns.current.size);
    
    // Clear existing timer and set a new one for batch processing
    if (batchRequestTimer.current) {
      clearTimeout(batchRequestTimer.current);
    }
    
    // Process batch after a short delay to collect more columns
    batchRequestTimer.current = setTimeout(() => {
      processBatchColumnRequests();
    }, 100); // 100ms delay to batch multiple requests
    
    return promise;
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
