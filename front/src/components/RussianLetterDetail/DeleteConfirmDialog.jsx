import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";

const DeleteConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  letter,
  deleting,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>تأكيد الحذف</DialogTitle>
      <DialogContent>
        <Typography>
          هل أنت متأكد من رغبتك في حذف هذا الخطاب؟ لا يمكن التراجع عن هذا
          الإجراء.
        </Typography>
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: "error.light",
            borderRadius: 1,
          }}
        >
          <Typography variant="body2" color="error.contrastText">
            <strong>الخطاب:</strong> {letter.subject || "بدون موضوع"}
          </Typography>
          <Typography variant="body2" color="error.contrastText">
            <strong>رقم المرجع:</strong>{" "}
            {letter.reference_number || "غير محدد"}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          onClick={onConfirm}
          color="error"
          variant="contained"
          disabled={deleting}
        >
          {deleting ? <CircularProgress size={20} /> : "حذف"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;
