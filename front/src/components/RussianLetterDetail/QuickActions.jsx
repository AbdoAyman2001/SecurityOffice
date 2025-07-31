import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Box,
  Button,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Share as ShareIcon,
} from "@mui/icons-material";

const QuickActions = ({
  canEditCorrespondence,
  canDeleteCorrespondence,
  onEdit,
  onPrint,
  onDelete,
}) => {
  return (
    <Card elevation={2}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          إجراءات سريعة
        </Typography>
        <Divider sx={{ mb: 2 }} />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {canEditCorrespondence && (
            <Button
              fullWidth
              variant="contained"
              startIcon={<EditIcon />}
              onClick={onEdit}
            >
              تعديل الخطاب
            </Button>
          )}

          <Button
            fullWidth
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={onPrint}
          >
            طباعة
          </Button>

          <Button fullWidth variant="outlined" startIcon={<ShareIcon />}>
            مشاركة
          </Button>

          {canDeleteCorrespondence && (
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={onDelete}
            >
              حذف الخطاب
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
