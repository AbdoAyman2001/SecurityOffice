import React, { useEffect, useRef, useCallback, useState } from "react";
import {
  Table,
  TableContainer,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from "@mui/material";
import { ArrowUpward as ArrowUpIcon } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

// Import refactored components
import TableHeader from "./TableHeader";
import DataTableBody from "./TableBody";
import CellRenderer from "./CellRenderer";
import ActionButtons from "./ActionButtons";

const UniversalDataTable = ({
  // Data props
  data = [],
  loading = false,
  error = null,
  hasMore = false,
  totalCount = 0,

  // Column configuration
  columns = [],

  // Infinite scroll
  onLoadMore,

  // Sorting
  sortConfig = { field: null, direction: null },
  onSort,

  // Filtering
  columnFilters = {},
  onColumnFilter,
  onClearColumnFilter,
  getColumnUniqueValues,

  // Advanced filtering
  advancedFilters = [],
  onAdvancedFilter,

  // Search
  searchTerm = "",
  onSearch,

  // Actions
  onUpdateItem,
  onViewItem,
  onEditItem,

  // Customization
  enableInlineEdit = true,
  enableActions = true,
  enableFilters = true,
  enableSort = true,
  enableInfiniteScroll = true,

  // Styling
  stickyHeader = true,
  highlightPriority = true,
  showLoadingSkeletons = true,

  // Permissions
  canEdit = false,
  canView = true,

  // Custom renderers
  customCellRenderers = {},

  // Table configuration
  pageSize = 20,
  emptyMessage = "لا توجد بيانات",
  loadingMessage = "جاري تحميل المزيد...",

  // Column visibility
  enableColumnVisibility = true,
  columnVisibilityStorageKey = null,
  visibleColumns = {},
  onColumnVisibilityChange,
}) => {
  const navigate = useNavigate();
  const tableContainerRef = useRef(null);
  const loadingRef = useRef(null);
  const isLoadingRef = useRef(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [internalVisibleColumns, setInternalVisibleColumns] = useState({});

  // Initialize column visibility from localStorage or default values
  useEffect(() => {
    if (enableColumnVisibility) {
      let initialVisibility = {};

      // Try to load from localStorage first
      if (columnVisibilityStorageKey) {
        try {
          const stored = localStorage.getItem(columnVisibilityStorageKey);
          if (stored) {
            initialVisibility = JSON.parse(stored);
          }
        } catch (error) {
          console.warn(
            "Failed to load column visibility from localStorage:",
            error
          );
        }
      }

      // If no stored data or external visibleColumns provided, use column defaults
      if (
        Object.keys(initialVisibility).length === 0 &&
        Object.keys(visibleColumns).length === 0
      ) {
        columns.forEach((column) => {
          initialVisibility[column.id] = column.visible !== false; // Default to true unless explicitly false
        });
      } else if (Object.keys(visibleColumns).length > 0) {
        initialVisibility = { ...visibleColumns };
      }

      setInternalVisibleColumns(initialVisibility);
    }
  }, [
    columns,
    enableColumnVisibility,
    columnVisibilityStorageKey,
    visibleColumns,
  ]);

  // Get the current visible columns (use external if provided, otherwise internal)
  const currentVisibleColumns =
    Object.keys(visibleColumns).length > 0
      ? visibleColumns
      : internalVisibleColumns;

  // Filter columns based on visibility
  const visibleColumnsArray = columns.filter(
    (column) => currentVisibleColumns[column.id] !== false
  );

  // Handle column visibility change
  const handleColumnVisibilityChange = (newVisibleColumns) => {
    if (onColumnVisibilityChange) {
      onColumnVisibilityChange(newVisibleColumns);
    } else {
      setInternalVisibleColumns(newVisibleColumns);
    }
  };

  // Utility functions for styling
  const getRowBackgroundColor = (row) => {
    if (!highlightPriority) return "inherit";
    const priority =
      row.priority ||
      row.Priority ||
      (row.correspondence && row.correspondence.priority);
    return priority === "high" ? "#ffebee" : "inherit";
  };

  const getRowHoverColor = (row) => {
    if (!highlightPriority) return "action.hover";
    const priority =
      row.priority ||
      row.Priority ||
      (row.correspondence && row.correspondence.priority);
    return priority === "high" ? "#ffcdd2" : "action.hover";
  };

  // Intersection Observer for infinite scroll
  const observerCallback = useCallback(
    (entries) => {
      const [entry] = entries;

      console.log("Intersection Observer triggered:", {
        isIntersecting: entry.isIntersecting,
        hasMore,
        loading,
        isLoadingRef: isLoadingRef.current,
        onLoadMore: !!onLoadMore,
        dataLength: data.length,
      });

      // More robust checking to prevent multiple rapid triggers
      if (
        entry.isIntersecting &&
        hasMore &&
        !loading &&
        !isLoadingRef.current &&
        onLoadMore &&
        data.length > 0 // Only trigger if we have data already
      ) {
        isLoadingRef.current = true;
        onLoadMore();
      }
    },
    [hasMore, loading, onLoadMore, data.length]
  );

  // Reset loading ref when loading state changes
  useEffect(() => {
    console.log("🔄 Loading state changed:", {
      loading,
      isLoadingRef: isLoadingRef.current,
    });

    // If we're not loading anymore, reset isLoadingRef
    if (!loading) {
      // Immediately reset the loading ref - the delay was causing race conditions
      isLoadingRef.current = false;
      console.log("🔄 Reset isLoadingRef to false immediately");
    }
  }, [loading]);

  // Create a single, stable intersection observer that doesn't depend on changing values
  const observerRef = useRef(null);

  // Create refs to store current values for the intersection observer
  const hasMoreStateRef = useRef(hasMore);
  const loadingStateRef = useRef(loading);
  const dataStateRef = useRef(data);
  const onLoadMoreStateRef = useRef(onLoadMore);

  // Update refs whenever values change
  useEffect(() => {
    hasMoreStateRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    loadingStateRef.current = loading;
  }, [loading]);

  useEffect(() => {
    dataStateRef.current = data;
  }, [data]);

  useEffect(() => {
    onLoadMoreStateRef.current = onLoadMore;
  }, [onLoadMore]);

  // Initialize the observer only once
  useEffect(() => {
    if (!observerRef.current) {
      console.log("🔄 Creating IntersectionObserver (ONCE ONLY)");

      // Create a stable callback that reads current values from refs
      const stableCallback = (entries) => {
        const [entry] = entries;

        // Read current values from refs to avoid stale closure
        const currentHasMore = hasMoreStateRef.current;
        const currentLoading = loadingStateRef.current;
        const currentDataLength = dataStateRef.current.length;
        const currentOnLoadMore = onLoadMoreStateRef.current;

        console.log("Intersection Observer triggered:", {
          isIntersecting: entry.isIntersecting,
          hasMore: currentHasMore,
          loading: currentLoading,
          isLoadingRef: isLoadingRef.current,
          onLoadMore: !!currentOnLoadMore,
          dataLength: currentDataLength,
        });

        // More robust checking to prevent multiple rapid triggers
        if (
          entry.isIntersecting &&
          currentHasMore &&
          !currentLoading &&
          !isLoadingRef.current &&
          currentOnLoadMore &&
          currentDataLength > 0 // Only trigger if we have data already
        ) {
          isLoadingRef.current = true;
          console.log(
            "✅ Triggering loadMore - hasMore:",
            currentHasMore,
            "loading:",
            currentLoading,
            "dataLength:",
            currentDataLength
          );
          currentOnLoadMore();
        } else {
          console.log("❌ Not triggering loadMore - conditions not met:", {
            isIntersecting: entry.isIntersecting,
            hasMore: currentHasMore,
            loading: currentLoading,
            isLoadingRef: isLoadingRef.current,
            hasOnLoadMore: !!currentOnLoadMore,
            hasData: currentDataLength > 0,
          });
        }
      };

      observerRef.current = new IntersectionObserver(stableCallback, {
        threshold: 0.1,
        rootMargin: "50px",
      });
    }

    return () => {
      if (observerRef.current) {
        console.log("🧹 Cleaning up IntersectionObserver on unmount");
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []); // Empty dependency array - create only once!

  // Observe/unobserve the loading element based on data availability
  useEffect(() => {
    if (!observerRef.current || !loadingRef.current || !enableInfiniteScroll) {
      return;
    }

    if (data.length > 0) {
      console.log("👁️ Observing loading element", { dataLength: data.length });
      observerRef.current.observe(loadingRef.current);
    } else {
      console.log("👁️ Not observing - no data yet");
      observerRef.current.unobserve(loadingRef.current);
    }

    return () => {
      if (observerRef.current && loadingRef.current) {
        console.log("👁️ Unobserving loading element");
        observerRef.current.unobserve(loadingRef.current);
      }
    };
  }, [data.length, enableInfiniteScroll]);

  // Scroll event handler for scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      if (tableContainerRef.current) {
        const scrollTop = tableContainerRef.current.scrollTop;
        setShowScrollTop(scrollTop > 300);
      }
    };

    const container = tableContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Render cell using the modular CellRenderer component
  const renderCell = (row, column) => (
    <CellRenderer
      row={row}
      column={column}
      enableInlineEdit={enableInlineEdit}
      canEdit={canEdit}
      onUpdateItem={onUpdateItem}
      customCellRenderers={customCellRenderers}
    />
  );

  // Render actions using the modular ActionButtons component
  const renderActions = (row) => (
    <ActionButtons
      row={row}
      canView={canView}
      canEdit={canEdit}
      onViewItem={onViewItem}
      onEditItem={onEditItem}
    />
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      <TableContainer
        component={Paper}
        ref={tableContainerRef}
        sx={{
          // maxHeight: "70vh",
          overflow: "auto",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: "#f1f1f1",
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "#c1c1c1",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            backgroundColor: "#a8a8a8",
          },
        }}
      >
        <Table stickyHeader={stickyHeader}>
          <TableHeader
            visibleColumns={visibleColumnsArray}
            sortConfig={sortConfig}
            onSort={onSort}
            enableSort={enableSort}
            enableFilters={enableFilters}
            enableActions={enableActions}
            enableColumnVisibility={enableColumnVisibility}
            columnFilters={columnFilters}
            onColumnFilter={onColumnFilter}
            onClearColumnFilter={onClearColumnFilter}
            getColumnUniqueValues={getColumnUniqueValues}
            stickyHeader={stickyHeader}
            columns={columns}
            currentVisibleColumns={currentVisibleColumns}
            onColumnVisibilityChange={handleColumnVisibilityChange}
            columnVisibilityStorageKey={columnVisibilityStorageKey}
          />

          <DataTableBody
            data={data}
            loading={loading}
            visibleColumns={visibleColumnsArray}
            columns={columns}
            enableActions={enableActions}
            emptyMessage={emptyMessage}
            getRowBackgroundColor={getRowBackgroundColor}
            getRowHoverColor={getRowHoverColor}
            showLoadingSkeletons={showLoadingSkeletons}
            enableInlineEdit={enableInlineEdit}
            canEdit={canEdit}
            canView={canView}
            onUpdateItem={onUpdateItem}
            onViewItem={onViewItem}
            onEditItem={onEditItem}
            customCellRenderers={customCellRenderers}
            searchTerm={searchTerm}
          />
        </Table>
        {/* Infinite scroll loading indicator */}
        {enableInfiniteScroll && (
          <div ref={loadingRef} style={{ height: "20px", margin: "10px 0" }}>
            {/* Only show loading spinner when we have more data AND we're actually loading */}
            {loading && hasMore && data.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  p: 2,
                }}
              >
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {loadingMessage}
                </Typography>
              </Box>
            )}
            {/* End of data message - show when no more data available */}
            {!hasMore && data.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "text.secondary",
                  backgroundColor: "grey.50",
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "grey.200",
                  margin: 0,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontStyle: "italic",
                    fontWeight: 500,
                    textAlign: "center",
                  }}
                >
                  🏁 تم عرض جميع البيانات المتاحة
                </Typography>
              </Box>
            )}
          </div>
        )}
      </TableContainer>

      {/* Scroll to top button */}
      {showScrollTop && (
        <IconButton
          onClick={scrollToTop}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            backgroundColor: "primary.main",
            color: "white",
            "&:hover": {
              backgroundColor: "primary.dark",
            },
            zIndex: 1000,
            boxShadow: 3,
          }}
        >
          <ArrowUpIcon />
        </IconButton>
      )}
    </Box>
  );
};

export default UniversalDataTable;
