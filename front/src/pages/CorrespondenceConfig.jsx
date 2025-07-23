import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Settings as SettingsIcon,
  Flag as FlagIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAuth } from "../contexts/AuthContext";
import {
  correspondenceTypesApi,
  correspondenceTypeProceduresApi,
} from "../services/apiService";

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

// Sortable Item Component for procedures
function SortableItem({ procedure, onEdit, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: procedure.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ListItem
      ref={setNodeRef}
      style={style}
      sx={{
        mb: 1,
        bgcolor: isDragging ? "action.hover" : "background.paper",
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        "&:hover": { bgcolor: "action.hover" },
      }}
    >
      <Box {...attributes} {...listeners} sx={{ mr: 1, cursor: "grab" }}>
        <DragIcon color="action" />
      </Box>
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="subtitle1">
              {procedure.procedure_order}. {procedure.procedure_name}
            </Typography>
            {procedure.is_initial && (
              <Tooltip title="إجراء ابتدائي">
                <FlagIcon color="success" fontSize="small" />
              </Tooltip>
            )}
            {procedure.is_final && (
              <Tooltip title="إجراء نهائي">
                <CheckCircleIcon color="primary" fontSize="small" />
              </Tooltip>
            )}
          </Box>
        }
        secondary={procedure.description}
      />
      <ListItemSecondaryAction>
        <IconButton
          edge="end"
          aria-label="edit"
          onClick={() => onEdit(procedure)}
          sx={{ mr: 1 }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          edge="end"
          aria-label="delete"
          onClick={() => onDelete(procedure.id)}
          color="error"
        >
          <DeleteIcon />
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
}

const CorrespondenceConfig = () => {
  const { isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [editingProcedure, setEditingProcedure] = useState(null);

  // Form states
  const [typeForm, setTypeForm] = useState({
    type_name: "",
  });
  const [procedureForm, setProcedureForm] = useState({
    procedure_name: "",
    description: "",
    is_initial: false,
    is_final: false,
    procedure_order: 1,
  });

  // Notification state
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  // Load data
  useEffect(() => {
    loadCorrespondenceTypes();
  }, []);

  useEffect(() => {
    if (selectedTypeId) {
      loadProcedures(selectedTypeId);
    }
  }, [selectedTypeId]);

  const loadCorrespondenceTypes = async () => {
    try {
      setLoading(true);
      const response = await correspondenceTypesApi.getAll();
      setCorrespondenceTypes(response.data.results || response.data);
    } catch (error) {
      showNotification("خطأ في تحميل أنواع الخطابات", "error");
      console.error("Error loading correspondence types:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProcedures = async (typeId) => {
    try {
      setLoading(true);
      const response = await correspondenceTypeProceduresApi.getByType(typeId);
      const proceduresList = response.data.results || response.data;
      // Sort by procedure_order
      proceduresList.sort((a, b) => a.procedure_order - b.procedure_order);
      setProcedures(proceduresList);
    } catch (error) {
      showNotification("خطأ في تحميل الإجراءات", "error");
      console.error("Error loading procedures:", error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, severity = "success") => {
    setNotification({ open: true, message, severity });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Type management functions
  const handleAddType = () => {
    setEditingType(null);
    setTypeForm({ type_name: "" });
    setTypeDialogOpen(true);
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      type_name: type.type_name || "",
    });
    setTypeDialogOpen(true);
  };

  const handleSaveType = async () => {
    try {
      setLoading(true);
      if (editingType) {
        await correspondenceTypesApi.update(
          editingType.correspondence_type_id || editingType.type_id,
          typeForm
        );
        showNotification("تم تحديث نوع المراسلة بنجاح");
      } else {
        await correspondenceTypesApi.create(typeForm);
        showNotification("تم إضافة نوع المراسلة بنجاح");
      }
      setTypeDialogOpen(false);
      loadCorrespondenceTypes();
    } catch (error) {
      showNotification("خطأ في حفظ نوع المراسلة", "error");
      console.error("Error saving type:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (typeId) => {
    if (
      !window.confirm(
        "هل أنت متأكد من حذف هذا النوع؟ سيتم حذف جميع الإجراءات المرتبطة به."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await correspondenceTypesApi.delete(typeId);
      showNotification("تم حذف نوع المراسلة بنجاح");
      loadCorrespondenceTypes();
      if (selectedTypeId === typeId) {
        setSelectedTypeId(null);
        setProcedures([]);
      }
    } catch (error) {
      showNotification("خطأ في حذف نوع المراسلة", "error");
      console.error("Error deleting type:", error);
    } finally {
      setLoading(false);
    }
  };

  // Procedure management functions
  const handleAddProcedure = () => {
    if (!selectedTypeId) {
      showNotification("يرجى اختيار نوع المراسلة أولاً", "warning");
      return;
    }

    setEditingProcedure(null);
    setProcedureForm({
      procedure_name: "",
      description: "",
      is_initial: false,
      is_final: false,
      procedure_order: procedures.length + 1,
    });
    setProcedureDialogOpen(true);
  };

  const handleEditProcedure = (procedure) => {
    setEditingProcedure(procedure);
    setProcedureForm({
      procedure_name: procedure.procedure_name || "",
      description: procedure.description || "",
      is_initial: procedure.is_initial || false,
      is_final: procedure.is_final || false,
      procedure_order: procedure.procedure_order || 1,
    });
    setProcedureDialogOpen(true);
  };

  const handleSaveProcedure = async () => {
    try {
      setLoading(true);
      const procedureData = {
        ...procedureForm,
        correspondence_type: selectedTypeId,
      };

      if (editingProcedure) {
        await correspondenceTypeProceduresApi.update(
          editingProcedure.id,
          procedureData
        );
        showNotification("تم تحديث الإجراء بنجاح");
      } else {
        await correspondenceTypeProceduresApi.create(procedureData);
        showNotification("تم إضافة الإجراء بنجاح");
      }
      setProcedureDialogOpen(false);
      loadProcedures(selectedTypeId);
    } catch (error) {
      showNotification("خطأ في حفظ الإجراء", "error");
      console.error("Error saving procedure:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcedure = async (procedureId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الإجراء؟")) {
      return;
    }

    try {
      setLoading(true);
      await correspondenceTypeProceduresApi.delete(procedureId);
      showNotification("تم حذف الإجراء بنجاح");
      loadProcedures(selectedTypeId);
    } catch (error) {
      showNotification("خطأ في حذف الإجراء", "error");
      console.error("Error deleting procedure:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Drag and drop for procedure ordering
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = procedures.findIndex((item) => item.id === active.id);
      const newIndex = procedures.findIndex((item) => item.id === over.id);

      const updatedItems = arrayMove(procedures, oldIndex, newIndex).map(
        (item, index) => ({
          ...item,
          procedure_order: index + 1,
        })
      );

      setProcedures(updatedItems);

      // Save new order to backend
      try {
        await Promise.all(
          updatedItems.map((item) =>
            correspondenceTypeProceduresApi.update(item.id, {
              ...item,
              correspondence_type: selectedTypeId,
            })
          )
        );
        showNotification("تم تحديث ترتيب الإجراءات بنجاح");
      } catch (error) {
        showNotification("خطأ في حفظ ترتيب الإجراءات", "error");
        console.error("Error updating procedure order:", error);
        // Reload to get correct order
        loadProcedures(selectedTypeId);
      }
    }
  };

  return (
    <Box sx={{ width: "100%", p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <SettingsIcon />
        إعدادات الخطابات والإجراءات
      </Typography>

      <Paper sx={{ width: "100%" }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="configuration tabs"
        >
          <Tab label="أنواع الخطابات" />
          <Tab label="إجراءات الأنواع" />
        </Tabs>

        {/* Correspondence Types Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">إدارة أنواع الخطابات</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddType}
              disabled={loading}
            >
              إضافة نوع جديد
            </Button>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {correspondenceTypes.map((type) => (
              <Card
                key={type.correspondence_type_id || type.type_id}
                sx={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  '&:hover': {
                    boxShadow: 3,
                  },
                }}
              >
                {/* ID at the beginning */}
                <Box
                  sx={{
                    minWidth: 80,
                    mr: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'primary.main',
                    color: 'white',
                    borderRadius: 1,
                    p: 1,
                    fontWeight: 'bold',
                  }}
                >
                  #{type.correspondence_type_id || type.type_id}
                </Box>

                {/* Type name - takes remaining space */}
                <Box sx={{ flexGrow: 1, mr: 2 }}>
                  <Typography variant="h6" component="div">
                    {type.type_name}
                  </Typography>
                </Box>

                {/* Actions at the end */}
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton
                    color="primary"
                    onClick={() => handleEditType(type)}
                    title="تعديل"
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() =>
                      handleDeleteType(
                        type.correspondence_type_id || type.type_id
                      )
                    }
                    title="حذف"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <Button
                    size="small"
                    variant={
                      selectedTypeId ===
                      (type.correspondence_type_id || type.type_id)
                        ? "contained"
                        : "outlined"
                    }
                    onClick={() => {
                      const typeId =
                        type.correspondence_type_id || type.type_id;
                      setSelectedTypeId(typeId);
                      setTabValue(1); // Switch to procedures tab
                      loadProcedures(typeId); // Load procedures for this type
                    }}
                    startIcon={<SettingsIcon />}
                  >
                    إدارة الإجراءات
                  </Button>
                </Box>
              </Card>
            ))}
          </Box>
        </TabPanel>

        {/* Procedures Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">
              إدارة الإجراءات
              {selectedTypeId && (
                <Chip
                  label={
                    correspondenceTypes.find(
                      (t) =>
                        (t.correspondence_type_id || t.type_id) ===
                        selectedTypeId
                    )?.type_name || "نوع محدد"
                  }
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProcedure}
              disabled={loading || !selectedTypeId}
            >
              إضافة إجراء جديد
            </Button>
          </Box>

          {!selectedTypeId ? (
            <Alert severity="info">
              يرجى اختيار نوع المراسلة من التبويب الأول لإدارة إجراءاته
            </Alert>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={procedures.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <List>
                  {procedures.map((procedure) => (
                    <SortableItem
                      key={procedure.id}
                      procedure={procedure}
                      onEdit={handleEditProcedure}
                      onDelete={handleDeleteProcedure}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          )}
        </TabPanel>
      </Paper>

      {/* Type Dialog */}
      <Dialog
        open={typeDialogOpen}
        onClose={() => setTypeDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingType ? "تعديل نوع المراسلة" : "إضافة نوع مراسلة جديد"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="اسم النوع"
            fullWidth
            variant="outlined"
            value={typeForm.type_name}
            onChange={(e) =>
              setTypeForm({ ...typeForm, type_name: e.target.value })
            }
            required
            helperText="اسم نوع المراسلة (مطلوب)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTypeDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleSaveType}
            variant="contained"
            disabled={loading || !typeForm.type_name}
          >
            {editingType ? "تحديث" : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Procedure Dialog */}
      <Dialog
        open={procedureDialogOpen}
        onClose={() => setProcedureDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingProcedure ? "تعديل الإجراء" : "إضافة إجراء جديد"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="اسم الإجراء"
            fullWidth
            variant="outlined"
            value={procedureForm.procedure_name}
            onChange={(e) =>
              setProcedureForm({
                ...procedureForm,
                procedure_name: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="الوصف"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={procedureForm.description}
            onChange={(e) =>
              setProcedureForm({
                ...procedureForm,
                description: e.target.value,
              })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="الترتيب"
            type="number"
            fullWidth
            variant="outlined"
            value={procedureForm.procedure_order}
            onChange={(e) =>
              setProcedureForm({
                ...procedureForm,
                procedure_order: parseInt(e.target.value) || 1,
              })
            }
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={procedureForm.is_initial}
                onChange={(e) =>
                  setProcedureForm({
                    ...procedureForm,
                    is_initial: e.target.checked,
                  })
                }
              />
            }
            label="إجراء ابتدائي (يتم تعيينه تلقائياً للمراسلات الجديدة)"
            sx={{ mb: 1 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={procedureForm.is_final}
                onChange={(e) =>
                  setProcedureForm({
                    ...procedureForm,
                    is_final: e.target.checked,
                  })
                }
              />
            }
            label="إجراء نهائي (يعتبر المراسلة مكتملة)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProcedureDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleSaveProcedure}
            variant="contained"
            disabled={loading || !procedureForm.procedure_name}
          >
            {editingProcedure ? "تحديث" : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CorrespondenceConfig;
