import { useState, useEffect, useCallback } from 'react';
import { correspondenceApi } from '../services/apiService';

export const useRussianLetters = () => {
  // State management
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Search and filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });

  // Fetch letters data
  const fetchLetters = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const {
        searchQuery = searchTerm,
        pageNum = page,
        pageSize = rowsPerPage,
        additionalFilters = filters,
        sort = sortConfig
      } = options;

      const params = {
        page: pageNum + 1, // API uses 1-based pagination
        page_size: pageSize,
        direction: 'Incoming', // Filter for Russian letters (incoming)
        ...(searchQuery && { search: searchQuery }),
        ...additionalFilters
      };

      // Add sorting if configured
      if (sort.field) {
        params.ordering = sort.direction === 'desc' ? `-${sort.field}` : sort.field;
      }

      const response = await correspondenceApi.getAll(params);
      const data = response.data;

      setLetters(data.results || data || []);
      setTotalCount(data.count || data.length || 0);
    } catch (err) {
      console.error('Error fetching letters:', err);
      setError('فشل في تحميل بيانات الخطابات. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, page, rowsPerPage, filters, sortConfig]);

  // Update a letter (for inline editing)
  const updateLetter = useCallback(async (letterId, updateData) => {
    try {
      const response = await correspondenceApi.update(letterId, updateData);
      
      // Update the letter in the local state
      setLetters(prevLetters => 
        prevLetters.map(letter => 
          letter.correspondence_id === letterId 
            ? { ...letter, ...response.data }
            : letter
        )
      );
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error updating letter:', err);
      return { 
        success: false, 
        error: 'فشل في تحديث الخطاب. يرجى المحاولة مرة أخرى.' 
      };
    }
  }, []);

  // Search handler
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    setPage(0);
    fetchLetters({ searchQuery: value, pageNum: 0 });
  }, [fetchLetters]);

  // Filter handler
  const handleFilter = useCallback((newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
    setPage(0);
    fetchLetters({ additionalFilters: { ...filters, ...newFilters }, pageNum: 0 });
  }, [fetchLetters, filters]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
    setSearchTerm('');
    setPage(0);
    fetchLetters({ searchQuery: '', additionalFilters: {}, pageNum: 0 });
  }, [fetchLetters]);

  // Sort handler
  const handleSort = useCallback((field) => {
    const newDirection = 
      sortConfig.field === field && sortConfig.direction === 'asc' 
        ? 'desc' 
        : 'asc';
    
    const newSortConfig = { field, direction: newDirection };
    setSortConfig(newSortConfig);
    fetchLetters({ sort: newSortConfig });
  }, [sortConfig, fetchLetters]);

  // Pagination handlers
  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
    fetchLetters({ pageNum: newPage });
  }, [fetchLetters]);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setPage(0);
    fetchLetters({ pageNum: 0, pageSize: newRowsPerPage });
  }, [fetchLetters]);

  // Refresh data
  const refresh = useCallback(() => {
    fetchLetters();
  }, [fetchLetters]);

  // Initial data fetch
  useEffect(() => {
    fetchLetters();
  }, []);

  return {
    // Data
    letters,
    loading,
    error,
    totalCount,
    
    // Pagination
    page,
    rowsPerPage,
    handleChangePage,
    handleChangeRowsPerPage,
    
    // Search and filtering
    searchTerm,
    filters,
    handleSearch,
    handleFilter,
    clearFilters,
    
    // Sorting
    sortConfig,
    handleSort,
    
    // Actions
    updateLetter,
    refresh,
    fetchLetters
  };
};
