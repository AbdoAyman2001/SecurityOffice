import React from "react";
import { Chip, Typography, Box, IconButton, Tooltip } from "@mui/material";
import {
  AttachFile as AttachFileIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import InlineEditCell from "../RussianLetters/InlineEditCell";
import HighlightedText from "./HighlightedText";

const CellRenderer = ({
  row,
  column,
  enableInlineEdit,
  canEdit,
  onUpdateItem,
  customCellRenderers,
  searchTerm = "",
  textDirection = "rtl",
}) => {
  // Get cell value with fallback
  const getCellValue = (row, column) => {
    if (column.getValue && typeof column.getValue === "function") {
      try {
        return column.getValue(row);
      } catch (error) {
        console.warn(`Error getting value for column ${column.id}:`, error);
        return column.defaultValue || "خطأ";
      }
    }

    // Fallback to direct property access
    const value = row[column.id];
    return value !== null && value !== undefined
      ? value
      : column.defaultValue || "غير محدد";
  };

  const value = getCellValue(row, column);

  // Determine text direction and alignment for this column
  const cellTextDirection = column.textDirection || textDirection;
  const cellTextAlign = column.textAlign || (cellTextDirection === 'ltr' ? 'left' : 'right');

  // Check for custom renderer first
  if (customCellRenderers[column.id]) {
    return customCellRenderers[column.id](value, row, {...column, textDirection: cellTextDirection, textAlign: cellTextAlign});
  }

  // Handle different column types
  switch (column.type) {
    case "priority":
      const priorityColors = {
        high: "error",
        normal: "default",
        low: "success",
      };
      const priorityLabels = {
        high: "عالية",
        normal: "عادية",
        low: "منخفضة",
      };
      const priorityDisplayLabel = priorityLabels[value] || value;
      return (
        <Chip
          label={priorityDisplayLabel}
          color={priorityColors[value] || "default"}
          size="small"
          variant="outlined"
          sx={{
            // Highlight chip if search term matches
            ...(searchTerm &&
              priorityDisplayLabel
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) && {
                backgroundColor: "primary.light",
                fontWeight: "bold",
                boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.3)",
              }),
          }}
        />
      );

    case "direction":
      const directionColors = {
        Incoming: "primary",
        Outgoing: "secondary",
        Internal: "default",
      };
      const directionLabels = {
        Incoming: "وارد",
        Outgoing: "صادر",
        Internal: "داخلي",
      };
      const directionDisplayLabel = directionLabels[value] || value;
      return (
        <Chip
          label={directionDisplayLabel}
          color={directionColors[value] || "default"}
          size="small"
          sx={{
            // Highlight chip if search term matches
            ...(searchTerm &&
              directionDisplayLabel
                .toLowerCase()
                .includes(searchTerm.toLowerCase()) && {
                backgroundColor: "primary.light",
                fontWeight: "bold",
                boxShadow: "0 0 0 2px rgba(25, 118, 210, 0.3)",
              }),
          }}
        />
      );

    case "attachments":
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return (
          <Typography variant="body2" color="textSecondary">
            لا توجد مرفقات
          </Typography>
        );
      }
      const attachmentCount = Array.isArray(value) ? value.length : 1;
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <AttachFileIcon fontSize="small" color="primary" />
          <Typography variant="body2">{attachmentCount} مرفق</Typography>
        </Box>
      );

    case "status_logs":
      if (!value || (Array.isArray(value) && value.length === 0)) {
        return (
          <Typography variant="body2" color="textSecondary">
            لا يوجد سجل
          </Typography>
        );
      }
      const logCount = Array.isArray(value) ? value.length : 1;
      return (
        <Tooltip title="عرض سجل الحالات">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
            }}
          >
            <HistoryIcon fontSize="small" color="primary" />
            <Typography variant="body2">{logCount} حالة</Typography>
          </Box>
        </Tooltip>
      );

    case "parent_correspondence":
      if (!value || value === "لا يوجد") {
        return (
          <Typography variant="body2" color="textSecondary">
            لا يوجد
          </Typography>
        );
      }
      return (
        <HighlightedText
          text={value}
          searchTerm={searchTerm}
          variant="body2"
          sx={{ color: "primary.main", cursor: "pointer" }}
        />
      );

    case "date":
    case "datetime":
      if (!value) {
        return (
          <Typography variant="body2" color="textSecondary">
            غير محدد
          </Typography>
        );
      }

      try {
        const date = new Date(value);
        let formattedDate;
        
        if (column.type === "datetime") {
          formattedDate = date.toLocaleString("ar-EG");
        } else {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          formattedDate = `${day}/${month}/${year}`;
        }
        
        return <Typography variant="body2" align={cellTextAlign} sx={{ direction: cellTextDirection }}>{formattedDate}</Typography>;
      } catch (error) {
        return <Typography variant="body2" align={cellTextAlign} sx={{ direction: cellTextDirection }}>{value}</Typography>;
      }

    case "number":
      return (
        <Typography variant="body2" align={cellTextAlign} sx={{ direction: cellTextDirection }}>
          {value?.toLocaleString?.("ar-EG") || value}
        </Typography>
      );

    case "text":
    case "select":
    default:
      // Handle inline editing for editable columns
      if (enableInlineEdit && column.editable && canEdit) {
        // Get row ID from primary key or fallback to common ID fields
        const rowId = row[column.primaryKey ? column.id : (row.id || row.correspondence_id || row._id)];
        
        // Extract options from the column if available
        const options = column.options || [];
        
        // Pass the correct props to InlineEditCell with textDirection and textAlign from column config
        return (
          <InlineEditCell
            value={value}
            type={column.type || 'text'}
            options={options}
            onSave={(rowId, fieldName, newValue) => onUpdateItem(row, column.id, newValue)}
            editable={column.editable}
            displayValue={value}
            fieldName={column.id}
            rowId={rowId}
            multiline={column.multiline || false}
            required={column.required || false}
            textDirection={cellTextDirection}
            textAlign={cellTextAlign}
          />
        );
      }

      // Handle multiline text – allow cell content to grow freely
      if (column.multiline && value && value.length > 50) {
        return (
          <HighlightedText
            text={value}
            searchTerm={searchTerm}
            variant="body2"
            sx={{
              whiteSpace: "normal",
              wordBreak: "break-word",
              direction: cellTextDirection,
              textAlign: cellTextAlign,
            }}
          />
        );
      }

      return (
        <HighlightedText 
          text={value} 
          searchTerm={searchTerm} 
          variant="body2" 
          sx={{
            direction: cellTextDirection,
            textAlign: cellTextAlign,
          }}
        />
      );
  }
};

export default CellRenderer;
