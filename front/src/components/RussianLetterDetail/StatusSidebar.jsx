import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Chip,
  Button,
} from "@mui/material";
import { History as HistoryIcon } from "@mui/icons-material";
import { formatDateTime } from "../../utils/dateUtils";

const StatusSidebar = ({ letter, getStatusColor, onShowHistory }) => {
  return (
    <Card elevation={2} sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          معلومات الحالة
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            الحالة الحالية:
          </Typography>
          <Chip
            label={letter.current_status?.procedure_name || "بدون حالة"}
            color={getStatusColor(letter.current_status)}
            sx={{ mt: 1 }}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            تاريخ الإنشاء:
          </Typography>
          <Typography variant="body2">
            {formatDateTime(letter.created_at)}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            آخر تحديث:
          </Typography>
          <Typography variant="body2">
            {formatDateTime(letter.updated_at)}
          </Typography>
        </Box>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={onShowHistory}
          sx={{ mt: 2 }}
        >
          عرض تاريخ التغييرات
        </Button>
      </CardContent>
    </Card>
  );
};

export default StatusSidebar;
