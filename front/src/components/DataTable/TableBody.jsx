import React from "react";
import {
  TableBody,
  TableRow,
  TableCell,
  Typography,
  Skeleton,
} from "@mui/material";
import CellRenderer from "./CellRenderer";
import ActionButtons from "./ActionButtons";

const DataTableBody = ({
  data,
  loading,
  visibleColumns,
  columns,
  enableActions,
  emptyMessage,
  getRowBackgroundColor,
  getRowHoverColor,
  showLoadingSkeletons,
  enableInlineEdit,
  canEdit,
  canView,
  onUpdateItem,
  onViewItem,
  onEditItem,
  customCellRenderers,
  searchTerm = "",
  textDirection = "rtl",
}) => {
  // Loading skeleton renderer
  const renderLoadingSkeleton = () => {
    if (!showLoadingSkeletons) return null;

    return Array.from({ length: 3 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        {visibleColumns.map((column) => (
          <TableCell key={column.id}>
            <Skeleton variant="text" width="80%" />
          </TableCell>
        ))}
        {enableActions && (
          <TableCell>
            <Skeleton variant="rectangular" width={80} height={32} />
          </TableCell>
        )}
      </TableRow>
    ));
  };

  // Get row key for React key prop
  const getRowKey = (row, index) => {
    return (
      row[columns.find((c) => c.primaryKey)?.id] ||
      row.id ||
      row.correspondence_id ||
      index
    );
  };

  return (
    <TableBody>
      {data.length === 0 && !loading ? (
        <TableRow>
          <TableCell
            colSpan={visibleColumns.length + (enableActions ? 1 : 0)}
            align="center"
          >
            <Typography variant="body1" color="textSecondary" sx={{ p: 4 }}>
              {emptyMessage}
            </Typography>
          </TableCell>
        </TableRow>
      ) : (
        <>
          {data.map((row, index) => {
            const rowKey = getRowKey(row, index);

            return (
              <TableRow
                key={rowKey}
                sx={{
                  backgroundColor: getRowBackgroundColor(row),
                  "&:hover": {
                    backgroundColor: getRowHoverColor(row),
                  },
                }}
              >
                {visibleColumns.map((column) => (
                  <TableCell
                    key={column.id}
                    sx={{
                      width: column.calculatedFlex ? '40%' : column.width || 'auto',
                      minWidth: column.minWidth || 100,
                      padding: '8px 16px',
                      overflow: 'hidden',
                      wordWrap: 'break-word',
                      whiteSpace: 'normal',
                      borderRight: '1px solid rgba(224, 224, 224, 0.3)',
                      borderBottom: '1px solid rgba(224, 224, 224, 0.3)',
                    }}
                  >
                    <CellRenderer
                      row={row}
                      column={column}
                      enableInlineEdit={enableInlineEdit}
                      canEdit={canEdit}
                      onUpdateItem={onUpdateItem}
                      customCellRenderers={customCellRenderers}
                      searchTerm={searchTerm}
                      textDirection={textDirection}
                    />
                  </TableCell>
                ))}

                {enableActions && (
                  <TableCell sx={{ 
                    width: 120, 
                    borderBottom: '1px solid rgba(224, 224, 224, 0.3)' 
                  }}>
                    <ActionButtons
                      row={row}
                      canView={canView}
                      canEdit={canEdit}
                      onViewItem={onViewItem}
                      onEditItem={onEditItem}
                    />
                  </TableCell>
                )}
              </TableRow>
            );
          })}

          {loading && renderLoadingSkeleton()}
        </>
      )}
    </TableBody>
  );
};

export default DataTableBody;
