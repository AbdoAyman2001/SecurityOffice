import React from 'react';
import {
  TableHead,
  TableRow,
  TableCell,
  TableSortLabel,
  Box,
  Typography
} from '@mui/material';
import ColumnFilter from './ColumnFilter';
import ColumnVisibilityControl from './ColumnVisibilityControl';

const TableHeader = ({
  visibleColumns,
  sortConfig,
  onSort,
  enableSort,
  enableFilters,
  enableActions,
  enableColumnVisibility,
  columnFilters,
  onColumnFilter,
  onClearColumnFilter,
  getColumnUniqueValues,
  stickyHeader,
  columns,
  currentVisibleColumns,
  onColumnVisibilityChange,
  columnVisibilityStorageKey
}) => {
  return (
    <TableHead>
      <TableRow>
        {visibleColumns.map((column) => (
          <TableCell
            key={column.id}
            sx={{
              width: column.width,
              minWidth: column.minWidth || 100,
              backgroundColor: "primary.main",
              color: "white",
              fontWeight: 600,
              position: stickyHeader ? "sticky" : "static",
              top: 0,
              zIndex: 100,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              {enableSort && column.sortable ? (
                <TableSortLabel
                  active={sortConfig.field === column.id}
                  direction={
                    sortConfig.field === column.id
                      ? sortConfig.direction
                      : "asc"
                  }
                  onClick={() => onSort?.(column.id)}
                  sx={{
                    color: "white !important",
                    "& .MuiTableSortLabel-icon": {
                      color: "white !important",
                    },
                  }}
                >
                  {column.label}
                </TableSortLabel>
              ) : (
                column.label
              )}

              {enableFilters &&
                column.filterable &&
                getColumnUniqueValues && (
                  <ColumnFilter
                    column={column.id}
                    values={getColumnUniqueValues(column.id)}
                    selectedValues={columnFilters[column.id] || []}
                    onFilter={onColumnFilter}
                    onClear={onClearColumnFilter}
                    label={column.label}
                  />
                )}
            </Box>
          </TableCell>
        ))}

        {enableActions && (
          <TableCell
            sx={{
              width: 120,
              backgroundColor: "primary.main",
              color: "white",
              fontWeight: 600,
              position: stickyHeader ? "sticky" : "static",
              top: 0,
              zIndex: 100,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="body2" sx={{ color: "white" }}>
                الإجراءات
              </Typography>
              {enableColumnVisibility && (
                <ColumnVisibilityControl
                  columns={columns}
                  visibleColumns={currentVisibleColumns}
                  onColumnVisibilityChange={onColumnVisibilityChange}
                  storageKey={columnVisibilityStorageKey}
                />
              )}
            </Box>
          </TableCell>
        )}
      </TableRow>
    </TableHead>
  );
};

export default TableHeader;
