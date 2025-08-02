import React from "react";
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Chip,
  CircularProgress,
  Button,
  Autocomplete,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

const EditableField = ({
  fieldConfig,
  isEditing,
  editValue,
  displayValue,
  options,
  canEdit,
  saving,
  onStartEdit,
  onSave,
  onCancel,
  onValueChange,
}) => {
  const { 
    id, 
    label, 
    type, 
    icon: IconComponent, 
    placeholder = "", 
    multiline = false, 
    customStyles = {} 
  } = fieldConfig;

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
        position: "relative",
      }}
    >
      {/* Field Label */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        {IconComponent && (
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
            <IconComponent fontSize="small" sx={{ color: "primary.main" }} />
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
              {type === "select" && options.length > 0 ? (
                <FormControl fullWidth size="medium">
                  <Select
                    value={editValue}
                    onChange={(e) => onValueChange(e.target.value)}
                    autoFocus
                    sx={{
                      borderRadius: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 2,
                      },
                    }}
                  >
                    {options.map((option) => (
                      <MenuItem 
                        key={option.value} 
                        value={option.value}
                        disabled={option.disabled || false}
                        sx={{
                          fontStyle: option.disabled ? 'italic' : 'normal',
                          color: option.disabled ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : type === "autocomplete" && options.length > 0 ? (
                <Autocomplete
                  fullWidth
                  options={options}
                  getOptionLabel={(option) => option.label}
                  value={options.find((opt) => opt.value === editValue) || null}
                  onChange={(event, newValue) => {
                    onValueChange(newValue ? newValue.value : "");
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
                  type={type}
                  value={editValue}
                  onChange={(e) => onValueChange(e.target.value)}
                  autoFocus
                  multiline={multiline}
                  rows={multiline ? 3 : 1}
                  InputLabelProps={type === "date" ? { shrink: true } : {}}
                  placeholder={placeholder}
                  sx={{
                    ...customStyles,
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
                onClick={onSave}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                sx={{ borderRadius: 2, minWidth: 80 }}
              >
                حفظ
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={onCancel}
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
            {displayValue || (id === 'current_status' ? "لم يتم تحديد الحالة" : "غير محدد")}
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
            p: 0.5,
            borderRadius: 1,
            cursor: "pointer",
            opacity: 0.7,
            transition: "all 0.2s ease",
            "&:hover": {
              opacity: 1,
              backgroundColor: "primary.100",
              transform: "scale(1.1)",
            },
          }}
          onClick={(e) => {
            e.stopPropagation();
            onStartEdit(id, displayValue);
          }}
        >
          <EditIcon fontSize="small" sx={{ color: "primary.main" }} />
        </Box>
      )}
    </Box>
  );
};

export default EditableField;
