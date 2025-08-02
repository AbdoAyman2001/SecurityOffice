import React, { useState, useEffect } from "react";
import { Box, Alert, Typography, Paper } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useUniversalDataTable } from "../components/DataTable/hooks/useUniversalDataTable";
import { correspondenceApi } from "../services/apiService";
import UniversalDataTable from "../components/DataTable/UniversalDataTable";
import SearchFilterBar from "../components/DataTable/SearchFilterBar";
import AdvancedFilterModal from "../components/DataTable/AdvancedFilterModal";
import {
  russianLettersColumns,
  russianLettersFields,
} from "../config/russianLettersColumns.js";

const RussianLetters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, canEditCorrespondence } = useAuth();
  const [permissionError, setPermissionError] = useState(null);
  const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] =
    useState(false);
  const [successMessage, setSuccessMessage] = useState(null);

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({});

  // Use the new Universal DataTable hook
  const {
    data: letters,
    loading,
    error,
    totalCount,
    hasMore,
    searchTerm,
    columnFilters,
    advancedFilters,
    sortConfig,
    isFiltered,
    loadMore,
    resetAndReload,
    updateItem,
    clearAllFilters,
    getColumnUniqueValues,
    handleColumnFilter,
    handleClearColumnFilter,
    handleSort,
    handleSearch,
    handleAdvancedFilters,
  } = useUniversalDataTable({
    apiService: correspondenceApi,
    defaultFilters: { direction: "Incoming" }, // Russian letters filter
    pageSize: 20, // Match the pageSize passed to UniversalDataTable component
    initialSort: { field: "correspondence_date", direction: "desc" },
  });

  const filteredCount = letters.length;

  // Handler functions for advanced filters modal
  const handleAdvancedFiltersChange = (filters) => {
    handleAdvancedFilters(filters);
  };

  const handleApplyAdvancedFilters = (filters) => {
    handleAdvancedFilters(filters);
    setShowAdvancedFiltersModal(false);
  };

  const handleClearAdvancedFilters = () => {
    handleAdvancedFilters([]);
    setShowAdvancedFiltersModal(false);
  };

  // View and edit handlers
  const handleViewItem = (row) => {
    // Navigate to Russian Letter detail page
    navigate(`/russian-letters/${row.correspondence_id}`);
  };

  const handleEditItem = (row) => {
    // Navigate to Russian Letter detail page in edit mode
    navigate(`/russian-letters/${row.correspondence_id}?edit=true`);
  };
  
  // Excel export handler
  const handleExportExcel = async (exportParams) => {
    try {
      // Prepare export parameters with current filters
      const params = {
        // Apply current search and filters to export
        search: exportParams.searchTerm || '',
        direction: 'Incoming', // Russian letters filter
        ordering: exportParams.sortConfig?.field ? 
          `${exportParams.sortConfig.direction === 'desc' ? '-' : ''}${exportParams.sortConfig.field}` : 
          '-correspondence_date',
        ...exportParams.columnFilters,
      };
      
      // Add advanced filters if any
      if (exportParams.advancedFilters && exportParams.advancedFilters.length > 0) {
        exportParams.advancedFilters.forEach(filter => {
          params[filter.field] = filter.value;
        });
      }
      
      await correspondenceApi.exportExcel(params);
    } catch (error) {
      console.error('Export failed:', error);
      // You could add a toast notification here for better UX
    }
  };

  // Check permissions on mount and handle success messages
  useEffect(() => {
    if (!isAuthenticated) {
      setPermissionError("ليس لديك الصلاحية لعرض الخطابات.");
      return;
    }

    // Check for success message from navigation state
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after showing it
      setTimeout(() => setSuccessMessage(null), 5000);
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [isAuthenticated, location.state]);

  // Show permission error
  if (!isAuthenticated) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{permissionError}</Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 0,
        pt: 2,
        px: 3,
        minHeight: "100vh",
        backgroundColor: "background.default",
      }}
    >
      {/* Search and Filter Bar */}
      <SearchFilterBar
        searchTerm={searchTerm}
        onSearch={handleSearch}
        totalCount={totalCount}
        filteredCount={filteredCount}
        isFiltered={isFiltered}
        onClearAllFilters={clearAllFilters}
        onRefresh={resetAndReload}
        onToggleAdvancedFilters={() => setShowAdvancedFiltersModal(true)}
        loading={loading}
        advancedFilters={advancedFilters}
        columnFilters={columnFilters}
        enableExport={true}
        onExportExcel={handleExportExcel}
        exportLoading={false}
      />

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        open={showAdvancedFiltersModal}
        onClose={() => setShowAdvancedFiltersModal(false)}
        filters={advancedFilters}
        fields={russianLettersFields}
        onFiltersChange={handleAdvancedFiltersChange}
        onApply={handleApplyAdvancedFilters}
        onClear={handleClearAdvancedFilters}
      />

      {/* Success Alert */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Universal Data Table */}
      <UniversalDataTable
        
        // Data props
        data={letters}
        loading={loading}
        error={error}
        hasMore={hasMore}
        totalCount={totalCount}
        
        // Column configuration
        columns={russianLettersColumns}
        
        // Infinite scroll
        onLoadMore={loadMore}
        
        // Sorting
        sortConfig={sortConfig}
        onSort={handleSort}
        
        // Filtering
        columnFilters={columnFilters}
        onColumnFilter={handleColumnFilter}
        onClearColumnFilter={handleClearColumnFilter}
        getColumnUniqueValues={getColumnUniqueValues}
        
        // Advanced filtering
        advancedFilters={advancedFilters}
        
        // Search
        searchTerm={searchTerm}
        onSearch={handleSearch}
        
        // Actions
        onUpdateItem={updateItem}
        onViewItem={handleViewItem}
        onEditItem={handleEditItem}
        
        // Export functionality (now handled by SearchFilterBar)
        // onExportExcel={handleExportExcel}
        // enableExport={true}
        // exportFileName="russian_letters"
        
        // Customization
        enableInlineEdit={true}
        enableActions={true}
        enableFilters={true}
        enableSort={true}
        enableInfiniteScroll={true}
        
        // Styling
        stickyHeader={true}
        highlightPriority={true}
        showLoadingSkeletons={true}
        
        // Permissions
        canEdit={canEditCorrespondence()}
        canView={isAuthenticated}
        
        // Table configuration
        pageSize={20}
        emptyMessage="لا توجد خطابات روسية"
        loadingMessage="جاري تحميل المزيد من الخطابات..."

        // Column visibility
        enableColumnVisibility={true}
        columnVisibilityStorageKey="russianLetters_columnVisibility"
        visibleColumns={visibleColumns}
        onColumnVisibilityChange={setVisibleColumns}
      />
    </Box>
  );
};

export default RussianLetters;
