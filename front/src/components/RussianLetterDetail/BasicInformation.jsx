import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Divider,
  Grid,
  Box,
  TextField,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  CardContent,
  FormControl,
  InputLabel,
  Chip,
  Card,
  CircularProgress,
  Button,
  Alert,
  Autocomplete,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import { correspondenceApi } from "../../services/apiService";
import {
  formatDate,
  formatDateForInput,
  formatDateShort,
} from "../../utils/dateUtils";

const BasicInformation = ({
  letter,
  onUpdate,
  correspondenceTypes = [],
  contacts = [],
  users = [],
}) => {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check edit permissions - be more permissive for testing
  const canEdit = user
    ? user.canEditCorrespondence
      ? typeof user.canEditCorrespondence === "function"
        ? user.canEditCorrespondence()
        : user.canEditCorrespondence
      : true // Default to true if permission method doesn't exist
    : false;

  // Debug logging
  console.log("BasicInformation canEdit:", canEdit, "user:", user);

  // Priority options - matching backend model values
  const priorityOptions = [
    { value: "high", label: "هام وعاجل" },
    { value: "normal", label: "عادي" },
    { value: "low", label: "منخفض" },
  ];

  // Helper function to get priority display label
  const getPriorityLabel = (priority) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.label : priority || "عادي";
  };

  // Direction options
  const directionOptions = [
    { value: "Incoming", label: "وارد" },
    { value: "Outgoing", label: "صادر" },
  ];

  const handleStartEdit = (fieldName, currentValue) => {
    if (!canEdit) return;
    setEditingField(fieldName);
    setError(null);
    setSuccess(false);

    // Handle different field types
    if (fieldName === "correspondence_date") {
      setEditValue(formatDateForInput(currentValue));
    } else if (fieldName === "type") {
      setEditValue(letter.type?.correspondence_type_id || "");
    } else if (fieldName === "contact") {
      setEditValue(letter.contact?.contact_id || "");
    } else if (fieldName === "assigned_to") {
      setEditValue(letter.assigned_to?.id || "");
    } else {
      setEditValue(currentValue || "");
    }
  };

  const handleSave = async () => {
    if (!editingField || !onUpdate) return;

    setSaving(true);
    setError(null);

    try {
      await onUpdate(editingField, editValue);
      setEditingField(null);
      setEditValue("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Error saving field:", error);
      setError(error.response?.data?.message || "حدث خطأ أثناء الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValue("");
    setError(null);
  };

  const renderModernField = (
    label,
    value,
    fieldName,
    inputType = "text",
    options = null,
    icon = null,
    multiline = false,
    placeholder = "",
    customStyles = {}
  ) => {
    const isEditing = editingField === fieldName;
    const displayValue = getDisplayValue(fieldName, value);

    return (
      <Box
        sx={{
          p: 2,
          height: "100%",
          borderRadius: 2,
          border: "1px solid",
          borderColor: isEditing ? "primary.main" : "grey.200",
          backgroundColor: isEditing ? "primary.50" : "background.paper",
          transition: "all 0.3s ease",
          "&:hover":
            canEdit && !isEditing
              ? {
                  borderColor: "primary.light",
                  backgroundColor: "grey.50",
                  transform: "translateY(-2px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }
              : {},
          cursor: canEdit && !isEditing ? "pointer" : "default",
          position: "relative",
        }}
        onClick={() =>
          canEdit && !isEditing && handleStartEdit(fieldName, value)
        }
      >
        {/* Field Label */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
          {icon && (
            <Box
              sx={{
                p: 0.5,
                borderRadius: 1,
                backgroundColor: "primary.100",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {React.cloneElement(icon, {
                fontSize: "small",
                sx: { color: "primary.main" },
              })}
            </Box>
          )}
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: isEditing ? "primary.main" : "text.primary",
              fontSize: "0.875rem",
            }}
          >
            {label}
          </Typography>
          {canEdit && !isEditing && (
            <Chip
              size="small"
              label="قابل للتعديل"
              sx={{
                height: 20,
                fontSize: "0.7rem",
                backgroundColor: "primary.100",
                color: "primary.main",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          )}
        </Box>

        {/* Field Content */}
        <Box sx={{ minHeight: 40 }}>
          {isEditing ? (
            <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <Box sx={{ flex: 1 }}>
                {inputType === "select" && options ? (
                  <FormControl fullWidth size="medium">
                    <Select
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      autoFocus
                      sx={{
                        borderRadius: 2,
                        "& .MuiOutlinedInput-root": {
                          borderRadius: 2,
                        },
                      }}
                    >
                      {options.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : inputType === "autocomplete" && options ? (
                  <Autocomplete
                    fullWidth
                    options={options}
                    getOptionLabel={(option) => option.label}
                    value={
                      options.find((opt) => opt.value === editValue) || null
                    }
                    onChange={(event, newValue) => {
                      setEditValue(newValue ? newValue.value : "");
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        placeholder={placeholder}
                        autoFocus
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 2,
                          },
                        }}
                      />
                    )}
                  />
                ) : (
                  <TextField
                    fullWidth
                    type={inputType}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    autoFocus
                    multiline={multiline}
                    rows={multiline ? 3 : 1}
                    InputLabelProps={
                      inputType === "date" ? { shrink: true } : {}
                    }
                    placeholder={placeholder}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  />
                )}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleSave}
                  disabled={saving}
                  startIcon={
                    saving ? <CircularProgress size={16} /> : <SaveIcon />
                  }
                  sx={{ borderRadius: 2, minWidth: 80 }}
                >
                  حفظ
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleCancel}
                  disabled={saving}
                  startIcon={<CancelIcon />}
                  sx={{ borderRadius: 2, minWidth: 80 }}
                >
                  إلغاء
                </Button>
              </Box>
            </Box>
          ) : (
            <Typography
              variant="body1"
              sx={{
                fontSize: "1rem",
                fontWeight: 500,
                color: displayValue ? "text.primary" : "text.secondary",
                lineHeight: 1.5,
                minHeight: 24,
                ...customStyles,
              }}
            >
              {displayValue || "غير محدد"}
            </Typography>
          )}
        </Box>

        {/* Edit Indicator */}
        {canEdit && !isEditing && (
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              opacity: 0.6,
              transition: "opacity 0.2s",
            }}
          >
            <EditIcon fontSize="small" sx={{ color: "primary.main" }} />
          </Box>
        )}
      </Box>
    );
  };

  const getDisplayValue = (fieldName, value) => {
    switch (fieldName) {
      case "correspondence_date":
        return formatDate(value);
      case "type":
        return letter.type?.type_name;
      case "contact":
        return letter.contact?.name;
      case "assigned_to":
        return (
          letter.assigned_to?.full_name_arabic || letter.assigned_to?.username
        );
      case "priority":
        const priority = priorityOptions.find((p) => p.value === value);
        return priority ? priority.label : value;
      case "direction":
        const direction = directionOptions.find((d) => d.value === value);
        return direction ? direction.label : value;
      default:
        return value;
    }
  };

  return (
    <Box
      sx={{
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
        borderRadius: 3,
        p: 3,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.05,
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #1976d2 0%, transparent 50%), radial-gradient(circle at 80% 20%, #1976d2 0%, transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          position: "relative",
          zIndex: 1,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
            }}
          >
            <AssignmentIcon sx={{ color: "white", fontSize: 24 }} />
          </Box>
          <Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              المعلومات الأساسية
            </Typography>
            <Typography variant="body2" color="text.secondary">
              قم بالنقر على أي حقل لتعديله
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          {success && (
            <Chip
              label="✓ تم الحفظ بنجاح"
              sx={{
                backgroundColor: "success.100",
                color: "success.main",
                fontWeight: 600,
                "& .MuiChip-label": { px: 2 },
              }}
            />
          )}
          {canEdit && (
            <Chip
              label="✎ قابل للتعديل"
              sx={{
                backgroundColor: "primary.100",
                color: "primary.main",
                fontWeight: 600,
                "& .MuiChip-label": { px: 2 },
              }}
            />
          )}
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
            "& .MuiAlert-message": { fontWeight: 500 },
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Modern Fields Container */}
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Row 1 */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "stretch",
            mb: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: "300px" }}>
            {renderModernField(
              "الرقم المرجعي",
              letter.reference_number,
              "reference_number",
              "text",
              null,
              <AssignmentIcon />,
              false,
              "مثال: 123/45/ص"
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: "300px" }}>
            {renderModernField(
              "الموضوع",
              letter.subject,
              "subject",
              "text",
              null,
              <CategoryIcon />,
              true,
              "موضوع الخطاب",
              { direction: "ltr", textAlign: "left" }
            )}
          </Box>
        </Box>

        {/* Row 2 */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "stretch",
            mb: 1,
          }}
        >
          <Box sx={{ flex: 1, minWidth: "300px" }}>
            {renderModernField(
              "تاريخ الخطاب",
              letter.correspondence_date,
              "correspondence_date",
              "date",
              null,
              <CalendarIcon />
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: "300px" }}>
            {renderModernField(
              "نوع الخطاب",
              letter.type_name,
              "type",
              "select",
              Array.isArray(correspondenceTypes)
                ? correspondenceTypes.map((type) => ({
                    value: type.correspondence_type_id,
                    label: type.type_name,
                  }))
                : [],
              <CategoryIcon />
            )}
          </Box>
        </Box>

        {/* Row 3 */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            alignItems: "stretch",
          }}
        >
          <Box sx={{ flex: 1, minWidth: "300px" }}>
            {renderModernField(
              "الاتجاه",
              letter.direction,
              "direction",
              "select",
              directionOptions,
              <AssignmentIcon />
            )}
          </Box>

          <Box sx={{ flex: 1, minWidth: "300px" }}>
            {renderModernField(
              "الأولوية",
              getPriorityLabel(letter.priority),
              "priority",
              "select",
              priorityOptions,
              <AssignmentIcon />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default BasicInformation;
