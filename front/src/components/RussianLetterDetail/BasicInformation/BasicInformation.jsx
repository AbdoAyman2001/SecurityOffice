import React from "react";
import { Box, Typography, Chip, Alert } from "@mui/material";
import { Assignment as AssignmentIcon } from "@mui/icons-material";
import { useBasicInformation, FIELD_CONFIG } from "./hooks/useBasicInformation";
import EditableField from "../EditableField";

const BasicInformation = ({
  letter,
  onUpdate,
  correspondenceTypes = [],
  contacts = [],
  users = [],
  procedures = [],
}) => {
  const {
    editingField,
    editValue,
    saving,
    error,
    success,
    canEdit,
    handleStartEdit,
    handleSave,
    handleCancel,
    setEditValue,
    setError,
    getFieldValue,
    getFieldOptions,
  } = useBasicInformation(letter, onUpdate);

  const renderField = (fieldConfig) => (
    <EditableField
      key={fieldConfig.id}
      fieldConfig={fieldConfig}
      isEditing={editingField === fieldConfig.id}
      editValue={editValue}
      displayValue={getFieldValue(fieldConfig.id)}
      options={getFieldOptions(fieldConfig.id, correspondenceTypes, procedures)}
      canEdit={canEdit}
      saving={saving}
      onStartEdit={handleStartEdit}
      onSave={handleSave}
      onCancel={handleCancel}
      onValueChange={setEditValue}
    />
  );

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: "background.paper",
        border: "1px solid",
        borderColor: "grey.200",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: "primary.100",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AssignmentIcon sx={{ color: "primary.main", fontSize: 28 }} />
        </Box>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: "text.primary",
            fontSize: "1.25rem",
          }}
        >
          المعلومات الأساسية
        </Typography>
        {canEdit && (
          <Chip
            size="small"
            label="قابل للتعديل"
            sx={{
              backgroundColor: "success.100",
              color: "success.main",
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Status Messages */}
      {error && (
        <Alert
          severity="error"
          onClose={() => setError(null)}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
          تم حفظ التغييرات بنجاح
        </Alert>
      )}

      {/* Dynamic Grid Layout */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "1fr 1fr",
          },
          gap: 2,
          "& > *": {
            minHeight: 120,
          },
        }}
      >
        {FIELD_CONFIG.FIELD_DEFINITIONS.map(renderField)}
      </Box>
    </Box>
  );
};

export default BasicInformation;
