import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Alert,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import { useCorrespondenceConfig } from "../components/CorrespondenceConfig/hooks/useCorrespondenceConfig";
import { useNotification } from "../components/CorrespondenceConfig/hooks/useNotification";
import CorrespondenceTypesTab from "../components/CorrespondenceConfig/CorrespondenceTypesTab";
import ProceduresTab from "../components/CorrespondenceConfig/ProceduresTab";
import TypeDialog from "../components/CorrespondenceConfig/TypeDialog";
import ProcedureDialog from "../components/CorrespondenceConfig/ProcedureDialog";
import NotificationSnackbar from "../components/NotificationSnackbar";

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`config-tabpanel-${index}`}
      aria-labelledby={`config-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CorrespondenceConfig = () => {
  const { isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Use custom hooks
  const {
    correspondenceTypes,
    procedures,
    selectedTypeId,
    loading,
    typeDialogOpen,
    procedureDialogOpen,
    editingType,
    editingProcedure,
    typeForm,
    procedureForm,
    setSelectedTypeId,
    setTypeDialogOpen,
    setProcedureDialogOpen,
    setTypeForm,
    setProcedureForm,
    handleAddType,
    handleEditType,
    handleSaveType,
    handleDeleteType,
    handleAddProcedure,
    handleEditProcedure,
    handleSaveProcedure,
    handleDeleteProcedure,
    handleDragEnd,
  } = useCorrespondenceConfig();

  const { notification, hideNotification } = useNotification();

  // Check if user is admin
  if (!isAdmin()) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          غير مسموح لك بالوصول إلى هذه الصفحة. يجب أن تكون مدير للوصول إلى
          إعدادات النظام.
        </Alert>
      </Box>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{ maxWidth: "800px", mx: "auto", p: 3 }}>
      <Typography variant="h5" component="h5" gutterBottom>
        إعدادات الخطابات
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        إدارة أنواع الخطابات والإجراءات المرتبطة بها
      </Typography>

      <Paper >
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="correspondence config tabs"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="أنواع الخطابات" id="config-tab-0" />
          <Tab label="الإجراءات" id="config-tab-1" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CorrespondenceTypesTab
            correspondenceTypes={correspondenceTypes}
            loading={loading}
            onAddType={handleAddType}
            onEditType={handleEditType}
            onDeleteType={handleDeleteType}
            onSelectType={setSelectedTypeId}
            selectedTypeId={selectedTypeId}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ProceduresTab
            procedures={procedures}
            selectedTypeId={selectedTypeId}
            correspondenceTypes={correspondenceTypes}
            loading={loading}
            onAddProcedure={handleAddProcedure}
            onEditProcedure={handleEditProcedure}
            onDeleteProcedure={handleDeleteProcedure}
            onDragEnd={handleDragEnd}
          />
        </TabPanel>
      </Paper>

      {/* Type Dialog */}
      <TypeDialog
        open={typeDialogOpen}
        onClose={() => setTypeDialogOpen(false)}
        editingType={editingType}
        typeForm={typeForm}
        setTypeForm={setTypeForm}
        onSave={handleSaveType}
        loading={loading}
      />

      {/* Procedure Dialog */}
      <ProcedureDialog
        open={procedureDialogOpen}
        onClose={() => setProcedureDialogOpen(false)}
        editingProcedure={editingProcedure}
        procedureForm={procedureForm}
        setProcedureForm={setProcedureForm}
        onSave={handleSaveProcedure}
        loading={loading}
      />

      {/* Notification Snackbar */}
      <NotificationSnackbar
        notification={notification}
        onClose={hideNotification}
      />
    </Box>
  );
};

export default CorrespondenceConfig;
