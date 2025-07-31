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
        {visibleColumns.map((column) => {
          // Build dynamic styles based on column configuration
          const cellStyles = {
            backgroundColor: "primary.main",
            color: "white",
            fontWeight: 600,
            position: stickyHeader ? "sticky" : "static",
            top: 0,
            zIndex: 100,
          };

          // Apply optimized width configurations
          if (column.calculatedWidth) {
            cellStyles.width = column.calculatedWidth;
          } else if (column.calculatedFlex) {
            cellStyles.flex = column.calculatedFlex;
            if (column.calculatedMinWidth) {
              cellStyles.minWidth = column.calculatedMinWidth;
            }
            if (column.calculatedMaxWidth) {
              cellStyles.maxWidth = column.calculatedMaxWidth;
            }
          } else {
            // Fallback to original column configuration
            if (column.width) {
              cellStyles.width = column.width;
            }
            if (column.minWidth) {
              cellStyles.minWidth = column.minWidth;
            }
            if (column.maxWidth) {
              cellStyles.maxWidth = column.maxWidth;
            }
            if (column.flex) {
              cellStyles.flex = column.flex;
            }
          }

          return (
            <TableCell
              key={column.id}
              sx={{
                ...cellStyles,
                borderRight: '1px solid rgba(224, 224, 224, 0.4)',
                borderBottom: '1px solid rgba(224, 224, 224, 0.6)'
              }}
            >
            <Box sx={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 1,
                width: '100%'
              }}>
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
                    width: '100%',
                    justifyContent: (column.headerTextAlign || column.textAlign) === 'left' ? 'flex-start' : 
                                   (column.headerTextAlign || column.textAlign) === 'right' ? 'flex-end' : 'center',
                  }}
                >
                  <Typography 
                    variant="subtitle2" 
                    sx={{ 
                      textAlign: column.headerTextAlign || column.textAlign || 'center',
                      direction: column.headerTextDirection || column.textDirection || 'rtl',
                      width: '100%'
                    }}
                  >
                    {column.label}
                  </Typography>
                </TableSortLabel>
              ) : (
                <Typography 
                  variant="subtitle2" 
                  sx={{ 
                    textAlign: column.headerTextAlign || column.textAlign || 'center',
                    direction: column.headerTextDirection || column.textDirection || 'rtl',
                    width: '100%',
                    color: 'white'
                  }}
                >
                  {column.label}
                </Typography>
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
          );
        })}

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
              borderBottom: '1px solid rgba(224, 224, 224, 0.6)'
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  textAlign: 'center',
                  direction: 'rtl',
                  width: '100%',
                  color: "white"
                }}
              >
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
