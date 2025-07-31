import React from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  PriorityHigh as PriorityIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

const LetterHeader = ({
  letter,
  canEditCorrespondence,
  canDeleteCorrespondence,
  onEdit,
  onDelete,
  onShowHistory,
  onPrint,
  getPriorityColor,
  getStatusColor,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: 3,
      }}
    >
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {letter.subject || "بدون موضوع"}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            label={letter.priority || "عادي"}
            color={getPriorityColor(letter.priority)}
            size="small"
            icon={<PriorityIcon />}
          />
          <Chip
            label={letter.current_status?.procedure_name || "بدون حالة"}
            color={getStatusColor(letter.current_status)}
            size="small"
            icon={<AssignmentIcon />}
          />
          <Chip
            label={letter.direction || "غير محدد"}
            color="default"
            size="small"
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Tooltip title="طباعة">
          <IconButton onClick={onPrint} color="primary">
            <PrintIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="مشاركة">
          <IconButton color="primary">
            <ShareIcon />
          </IconButton>
        </Tooltip>

        <Tooltip title="عرض تاريخ الحالات">
          <IconButton onClick={onShowHistory} color="primary">
            <HistoryIcon />
          </IconButton>
        </Tooltip>

        {canEditCorrespondence && (
          <Tooltip title="تعديل">
            <IconButton onClick={onEdit} color="primary">
              <EditIcon />
            </IconButton>
          </Tooltip>
        )}

        {canDeleteCorrespondence && (
          <Tooltip title="حذف">
            <IconButton onClick={onDelete} color="error">
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

export default LetterHeader;
