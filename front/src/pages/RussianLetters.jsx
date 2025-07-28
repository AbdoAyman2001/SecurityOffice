import React, { useState, useEffect } from "react";
import { Box, Alert, Typography, Paper } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useUniversalDataTable } from "../hooks/useUniversalDataTable";
import { correspondenceApi } from "../services/apiService";
import UniversalDataTable from "../components/DataTable/UniversalDataTable";
import SearchFilterBar from "../components/DataTable/SearchFilterBar";
import AdvancedFilterModal from "../components/DataTable/AdvancedFilterModal";
import {
  russianLettersColumns,
  russianLettersFields,
} from "../config/russianLettersColumns.js";

const RussianLetters = () => {
  const { isAuthenticated, canEditCorrespondence } = useAuth();
  const [permissionError, setPermissionError] = useState(null);
  const [showAdvancedFiltersModal, setShowAdvancedFiltersModal] =
    useState(false);

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
    // Navigate to view page or open modal
    console.log("View item:", row);
    // navigate(`/correspondence/${row.correspondence_id}`);
  };

  const handleEditItem = (row) => {
    // Navigate to edit page or open modal
    console.log("Edit item:", row);
    // navigate(`/correspondence/${row.correspondence_id}/edit`);
  };

  // Check permissions on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setPermissionError("ليس لديك الصلاحية لعرض الخطابات.");
      return;
    }
  }, [isAuthenticated]);

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
