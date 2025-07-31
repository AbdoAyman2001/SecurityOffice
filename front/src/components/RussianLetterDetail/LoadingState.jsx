import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Alert,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { ArrowBack as ArrowBackIcon } from "@mui/icons-material";

const LoadingState = ({ loading, error }) => {
  const navigate = useNavigate();

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>جاري تحميل تفاصيل الخطاب...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/russian-letters")}
          sx={{ mt: 2 }}
        >
          العودة إلى قائمة الخطابات
        </Button>
      </Box>
    );
  }

  return null;
};

export default LoadingState;
