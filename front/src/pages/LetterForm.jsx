import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Autocomplete,
  FormControlLabel,
  Switch,
  Divider,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Mail as MailIcon,
  AttachFile as AttachIcon,
  Add as AddIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  correspondenceApi,
  correspondenceTypesApi,
  contactsApi,
} from "../services/apiService";
import { useAuth } from '../contexts/AuthContext';
import StatusSelector from '../components/StatusSelector';

const LetterForm = () => {
  const navigate = useNavigate();
  const {
    user,
    canCreateCorrespondence,
    canEditCorrespondence,
    canDeleteCorrespondence,
    isAdmin,
    getUserName,
  } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [hasPermission, setHasPermission] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    reference_number: "",
    correspondence_date: new Date().toISOString().split("T")[0],
    type: "",
    subject: "",
    direction: "Incoming",
    priority: "normal",
    summary: "",
    parent_correspondence: null,
  });

  // Lookup data
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [attachments, setAttachments] = useState([]);
  
  // Status tracking
  const [currentStatus, setCurrentStatus] = useState(null);
  const [correspondenceId, setCorrespondenceId] = useState(null);

  // New correspondence type dialog
  const [newTypeDialogOpen, setNewTypeDialogOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [addingType, setAddingType] = useState(false);
  const [typeError, setTypeError] = useState("");

  // Delete correspondence type dialog
  const [deleteTypeDialogOpen, setDeleteTypeDialogOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const [deletingType, setDeletingType] = useState(false);

  // New contact dialog
  const [newContactDialogOpen, setNewContactDialogOpen] = useState(false);
  const [newContactData, setNewContactData] = useState({
    name: '',
    contact_type: 'Person',
    phone: '',
    email: '',
    address: ''
  });
  const [addingContact, setAddingContact] = useState(false);
  const [contactError, setContactError] = useState('');
  const [contactIndexForNew, setContactIndexForNew] = useState(null);

  // Contact roles
  const contactRoles = [
    { value: "sender", label: "المرسل" },
    { value: "recipient", label: "المستقبل" },
    { value: "cc", label: "نسخة" },
    { value: "bcc", label: "نسخة مخفية" },
  ];

  // Direction options
  const directionOptions = [
    { value: "Incoming", label: "واردة" },
    { value: "Outgoing", label: "صادرة" },
    { value: "Internal", label: "داخلية" },
  ];

  // Priority options
  const priorityOptions = [
    { value: "high", label: "عالية" },
    { value: "normal", label: "عادية" },
    { value: "low", label: "منخفضة" },
  ];

  const fetchLookupData = async () => {
    try {
      const [typesResponse, contactsResponse] = await Promise.all([
        correspondenceTypesApi.getAll(),
        contactsApi.getAll(),
      ]);

      setCorrespondenceTypes(typesResponse.data.results || typesResponse.data);
      setContacts(contactsResponse.data.results || contactsResponse.data);
    } catch (err) {
      setError("فشل في تحميل البيانات المرجعية");
      console.error("Error fetching lookup data:", err);
    }
  };

  // Handle new type dialog open/close
  const handleNewTypeDialogOpen = () => {
    setNewTypeDialogOpen(true);
    setTypeError("");
    setNewTypeName("");
  };

  const handleNewTypeDialogClose = () => {
    setNewTypeDialogOpen(false);
  };

  // Handle delete type dialog
  const handleDeleteTypeDialogOpen = (type) => {
    setTypeToDelete(type);
    setDeleteTypeDialogOpen(true);
  };

  const handleDeleteTypeDialogClose = () => {
    setDeleteTypeDialogOpen(false);
    setTypeToDelete(null);
  };

  // Handle type deletion
  const handleDeleteTypeConfirm = async () => {
    if (!typeToDelete) return;

    setDeletingType(true);
    setTypeError("");

    try {
      await correspondenceTypesApi.delete(
        typeToDelete.correspondence_type_id || typeToDelete.type_id
      );

      // Refresh the types list
      await fetchLookupData();

      // Clear form if the deleted type was selected
      if (
        formData.type ===
        (typeToDelete.correspondence_type_id || typeToDelete.type_id)
      ) {
        setFormData((prev) => ({ ...prev, type: "" }));
      }

      setSuccess("تم حذف نوع المراسلة بنجاح");
      setDeleteTypeDialogOpen(false);
      setTypeToDelete(null);
    } catch (err) {
      console.error("Error deleting correspondence type:", err);
      setTypeError(
        err.response?.data?.detail ||
          "فشل في حذف نوع المراسلة. قد يكون مرتبط بمراسلات موجودة."
      );
    } finally {
      setDeletingType(false);
    }
  };

  // Handle new contact dialog
  const handleNewContactDialogOpen = (contactIndex = null) => {
    setContactIndexForNew(contactIndex);
    setNewContactDialogOpen(true);
    setContactError("");
    setNewContactData({
      name: '',
      contact_type: 'Person',
      phone: '',
      email: '',
      address: ''
    });
  };

  const handleNewContactDialogClose = () => {
    setNewContactDialogOpen(false);
    setContactIndexForNew(null);
  };

  const handleNewContactInputChange = (field, value) => {
    setNewContactData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNewContactSubmit = async () => {
    if (!newContactData.name.trim()) {
      setContactError("اسم جهة الاتصال مطلوب");
      return;
    }

    setAddingContact(true);
    setContactError("");

    try {
      const response = await contactsApi.create(newContactData);
      const newContact = response.data;

      // Refresh contacts list
      await fetchLookupData();

      // If this was opened from a specific contact selection, update that contact
      if (contactIndexForNew !== null) {
        handleContactChange(contactIndexForNew, "contact", newContact.contact_id);
      }

      setSuccess(`تم إضافة جهة الاتصال "${newContactData.name}" بنجاح`);
      setNewContactDialogOpen(false);
    } catch (err) {
      console.error("Error creating contact:", err);
      setContactError(
        err.response?.data?.detail ||
        err.response?.data?.name?.[0] ||
        "فشل في إضافة جهة الاتصال"
      );
    } finally {
      setAddingContact(false);
    }
  };

  // Handle new type submission
  const handleNewTypeSubmit = async () => {
    try {
      setTypeError("");

      // Validation
      if (!newTypeName.trim()) {
        setTypeError("يجب إدخال اسم نوع المراسلة");
        return;
      }

      setAddingType(true);

      // Create new correspondence type
      const response = await correspondenceTypesApi.create({
        type_name: newTypeName.trim(),
      });

      // Add to the list
      setCorrespondenceTypes((prev) => [...prev, response.data]);

      // Close dialog and select the new type
      handleNewTypeDialogClose();
      handleInputChange("type", response.data.correspondence_type_id);

      setSuccess("تمت إضافة نوع المراسلة بنجاح");
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error("Error creating correspondence type:", err);
      setTypeError("فشل في إضافة نوع المراسلة");
    } finally {
      setAddingType(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleContactAdd = () => {
    setSelectedContacts((prev) => [
      ...prev,
      { contact: "", role: "recipient" },
    ]);
  };

  const handleContactChange = (index, field, value) => {
    setSelectedContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleContactRemove = (index) => {
    setSelectedContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleAttachmentRemove = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!formData.reference_number.trim()) {
      setError("رقم المرجع مطلوب");
      return false;
    }
    if (!formData.subject.trim()) {
      setError("الموضوع مطلوب");
      return false;
    }
    if (!formData.type) {
      setError("نوع المراسلة مطلوب");
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create the correspondence
      const correspondenceData = {
        ...formData,
        correspondence_date: formData.correspondence_date,
      };

      // Create correspondence
      const response = await correspondenceApi.create(correspondenceData);
      const newCorrespondenceId = response.data.correspondence_id;

      // Set correspondence ID for status tracking
      setCorrespondenceId(newCorrespondenceId);

      // Add contacts if any
      if (selectedContacts.length > 0) {
        for (const contact of selectedContacts) {
          if (contact.contact) {
            await correspondenceApi.addContact(newCorrespondenceId, {
              contact: contact.contact,
              role: contact.role,
            });
          }
        }
      }

      // Handle file attachments (if any)
      if (attachments.length > 0) {
        for (const attachment of attachments) {
          const formData = new FormData();
          formData.append("file", attachment.file);
          formData.append("correspondence", newCorrespondenceId);
          formData.append("file_name", attachment.name);
          formData.append("file_type", attachment.type);
          formData.append("file_size", attachment.size);

          // Note: This would require a separate attachment upload endpoint
          // await attachmentsApi.create(formData);
        }
      }

      setSuccess("تم إنشاء المراسلة بنجاح");

      // Reset form or navigate
      setTimeout(() => {
        navigate("/correspondence");
      }, 2000);
    } catch (err) {
      setError("فشل في إنشاء المراسلة");
      console.error("Error creating correspondence:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/correspondence");
  };

  // Handle status change
  const handleStatusChange = (newStatus) => {
    setCurrentStatus(newStatus);
    setSuccess(`تم تغيير حالة المراسلة إلى: ${newStatus.procedure_name}`);
  };

  useEffect(() => {
    // Check permissions
    if (!canCreateCorrespondence()) {
      setHasPermission(false);
      setError("ليس لديك صلاحية لإنشاء المراسلات");
      return;
    }

    fetchLookupData();
  }, [canCreateCorrespondence]);

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return (
      <>
        <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
          <Paper
            elevation={2}
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: "center",
              border: "2px solid #f44336",
            }}
          >
            <LockIcon sx={{ fontSize: 60, color: "error.main", mb: 2 }} />
            <Typography variant="h4" color="error" gutterBottom>
              غير مصرح لك بالوصول
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              ليس لديك صلاحية لإنشاء المراسلات. يرجى التواصل مع المدير للحصول
              على الصلاحيات المطلوبة.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard")}
              sx={{ borderRadius: 2 }}
            >
              العودة إلى الصفحة الرئيسية
            </Button>
          </Paper>
        </Box>
      </>
    );
  }

  return (
    <>
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 1 }}>
        {/* Form Section */}
        <Paper
          elevation={2}
          sx={{
            p: 1,
            mb: 1,
            background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
            color: "white",
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h4"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              fontSize: 24,
              fontWeight: 600,
              fontFamily: "Cairo, sans-serif",
            }}
          >
            <MailIcon sx={{ fontSize: 40 }} />
            إضافة خطاب جديدة
          </Typography>
        </Paper>

        {/* Alerts */}
        {error && (
          <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 1, borderRadius: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Information Section */}
          <Paper
            elevation={2}
            sx={{ p: 2, mb: 1, borderRadius: 2 }}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <Typography
              variant="h5"
              sx={{
                mb: 2,
                color: "primary.main",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontFamily: "Cairo, sans-serif",
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 20,
                  backgroundColor: "primary.main",
                  borderRadius: 1,
                  mr: 1,
                }}
              />
              المعلومات الأساسية
            </Typography>

            <Grid
              container
              spacing={2}
              sx={{
                width: "100%",
                margin: 0,
                "& .MuiGrid-item": {
                  paddingLeft: "8px !important",
                  paddingTop: "8px !important",
                },
              }}
            >
              <Grid item xs={12} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  label="رقم المرجع *"
                  value={formData.reference_number}
                  onChange={(e) =>
                    handleInputChange("reference_number", e.target.value)
                  }
                  required
                  variant="outlined"
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      width: "100%",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  label="تاريخ المراسلة"
                  type="date"
                  value={formData.correspondence_date}
                  onChange={(e) =>
                    handleInputChange("correspondence_date", e.target.value)
                  }
                  InputLabelProps={{ shrink: true }}
                  variant="outlined"
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      width: "100%",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sx={{ width: "100%" }}>
                <FormControl fullWidth required sx={{ width: "100%" }}>
                  <InputLabel>نوع المراسلة</InputLabel>
                  <Select
                    value={formData.type}
                    label="نوع المراسلة"
                    onChange={(e) => {
                      if (e.target.value === "ADD_NEW") {
                        handleNewTypeDialogOpen();
                      } else {
                        handleInputChange("type", e.target.value);
                      }
                    }}
                    sx={{
                      borderRadius: 2,
                      width: "100%",
                    }}
                  >
                    {correspondenceTypes.map((type) => (
                      <MenuItem
                        key={type.id || type.correspondence_type_id}
                        value={type.id || type.correspondence_type_id}
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span>{type.name_ar || type.type_name}</span>
                        {isAdmin() && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTypeDialogOpen(type);
                            }}
                            sx={{
                              ml: 1,
                              opacity: 0.7,
                              "&:hover": { opacity: 1 },
                            }}
                            title="حذف نوع المراسلة"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </MenuItem>
                    ))}
                    {isAdmin() && (
                      <MenuItem
                        value="ADD_NEW"
                        sx={{ color: "primary.main", fontWeight: "bold" }}
                      >
                        <AddIcon sx={{ mr: 1 }} />
                        إضافة نوع جديد
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ width: "100%" }}>
                <FormControl fullWidth sx={{ width: "100%" }}>
                  <InputLabel>الاتجاه</InputLabel>
                  <Select
                    value={formData.direction}
                    label="الاتجاه"
                    onChange={(e) =>
                      handleInputChange("direction", e.target.value)
                    }
                    sx={{
                      borderRadius: 2,
                      width: "100%",
                    }}
                  >
                    {directionOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ width: "100%" }}>
                <FormControl fullWidth sx={{ width: "100%" }}>
                  <InputLabel>الأولوية</InputLabel>
                  <Select
                    value={formData.priority}
                    label="الأولوية"
                    onChange={(e) =>
                      handleInputChange("priority", e.target.value)
                    }
                    sx={{
                      borderRadius: 2,
                      width: "100%",
                    }}
                  >
                    {priorityOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              backgroundColor:
                                option.value === "high"
                                  ? "#f44336"
                                  : option.value === "normal"
                                  ? "#ff9800"
                                  : "#4caf50",
                            }}
                          />
                          {option.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  label="الموضوع *"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  required
                  variant="outlined"
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      width: "100%",
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sx={{ width: "100%" }}>
                <TextField
                  fullWidth
                  label="الملخص"
                  value={formData.summary}
                  onChange={(e) => handleInputChange("summary", e.target.value)}
                  multiline
                  rows={4}
                  variant="outlined"
                  sx={{
                    width: "100%",
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                      width: "100%",
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Status Tracking Section */}
          {correspondenceId && formData.type && (
            <Paper elevation={2} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  mb: 1.5,
                  color: "primary.main",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <AssignmentIcon />
                حالة المراسلة والإجراءات
              </Typography>
              <StatusSelector
                correspondenceId={correspondenceId}
                correspondenceTypeId={formData.type}
                currentStatus={currentStatus}
                onStatusChange={handleStatusChange}
                disabled={loading}
                showHistory={true}
              />
            </Paper>
          )}

          {/* Contacts Section */}
          <Paper elevation={2} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 1.5,
                color: "primary.main",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontFamily: "Cairo, sans-serif",
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 20,
                  backgroundColor: "primary.main",
                  borderRadius: 1,
                  mr: 1,
                }}
              />
              جهات الاتصال
            </Typography>

            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleContactAdd}
              sx={{
                mb: 2,
                borderRadius: 2,
                px: 2,
                py: 1,
              }}
            >
              إضافة جهة اتصال
            </Button>

            {selectedContacts.map((contact, index) => (
              <Paper
                key={index}
                elevation={1}
                sx={{
                  p: 2,
                  mb: 1.5,
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <Autocomplete
                    sx={{ flexGrow: 1 }}
                    options={contacts}
                    getOptionLabel={(option) => option.name || ''}
                    value={contacts.find(c => c.contact_id === contact.contact) || null}
                    onChange={(event, newValue) => {
                      if (newValue) {
                        handleContactChange(index, "contact", newValue.contact_id);
                      } else {
                        handleContactChange(index, "contact", "");
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="جهة الاتصال"
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {params.InputProps.endAdornment}
                              <IconButton
                                size="small"
                                onClick={() => handleNewContactDialogOpen(index)}
                                title="إضافة جهة اتصال جديدة"
                                sx={{ mr: 1 }}
                              >
                                <AddCircleOutlineIcon color="primary" />
                              </IconButton>
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1">{option.name}</Typography>
                          {option.phone && (
                            <Typography variant="caption" color="text.secondary">
                              {option.phone}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    )}
                    noOptionsText="لا توجد جهات اتصال"
                  />

                  <FormControl sx={{ flexGrow: 1 }}>
                    <InputLabel>الدور</InputLabel>
                    <Select
                      value={contact.role}
                      label="الدور"
                      onChange={(e) =>
                        handleContactChange(index, "role", e.target.value)
                      }
                      sx={{
                        borderRadius: 2,
                      }}
                    >
                      {contactRoles.map((role) => (
                        <MenuItem key={role.value} value={role.value}>
                          {role.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    color="error"
                    onClick={() => handleContactRemove(index)}
                    sx={{
                      borderRadius: 2,
                      height: "56px",
                      width: "56px",
                      minWidth: "56px",
                      flexShrink: 0,
                    }}
                  >
                    <CancelIcon />
                  </Button>
                </Box>
              </Paper>
            ))}
          </Paper>

          {/* Attachments Section */}
          <Paper elevation={2} sx={{ p: 2, mb: 1, borderRadius: 2 }}>
            <Typography
              variant="h6"
              sx={{
                mb: 1.5,
                color: "primary.main",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 1,
                fontFamily: "Cairo, sans-serif",
              }}
            >
              <Box
                sx={{
                  width: 4,
                  height: 20,
                  backgroundColor: "primary.main",
                  borderRadius: 1,
                  mr: 1,
                }}
              />
              المرفقات
            </Typography>

            <input
              accept="*/*"
              style={{ display: "none" }}
              id="file-upload"
              multiple
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="file-upload">
              <Button
                variant="contained"
                component="span"
                startIcon={<AttachIcon />}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                }}
              >
                إضافة مرفقات
              </Button>
            </label>

            {attachments.length > 0 && (
              <Box>
                <Typography
                  variant="body2"
                  sx={{ mb: 1.5, color: "text.secondary" }}
                >
                  الملفات المرفقة ({attachments.length}):
                </Typography>
                <Box
                  sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
                >
                  {attachments.map((attachment, index) => (
                    <Paper
                      key={index}
                      elevation={1}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {attachment.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {Math.round(attachment.size / 1024)} KB
                        </Typography>
                      </Box>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleAttachmentRemove(index)}
                        sx={{
                          borderRadius: 2,
                          height: "40px",
                          width: "40px",
                          minWidth: "40px",
                          flexShrink: 0,
                        }}
                      >
                        <CancelIcon fontSize="small" />
                      </Button>
                    </Paper>
                  ))}
                </Box>
              </Box>
            )}
          </Paper>

          {/* Action Buttons */}
          <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Button
                variant="outlined"
                onClick={handleCancel}
                startIcon={<CancelIcon />}
                size="large"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  minWidth: 120,
                }}
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={<SaveIcon />}
                size="large"
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  minWidth: 120,
                  background: loading
                    ? undefined
                    : "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
                  "&:hover": {
                    background: loading
                      ? undefined
                      : "linear-gradient(135deg, #1565c0 0%, #1976d2 100%)",
                  },
                }}
              >
                {loading ? "جاري الحفظ..." : "حفظ المراسلة"}
              </Button>
            </Box>
          </Paper>
        </form>

        {/* New Correspondence Type Dialog */}
        <Dialog
          open={newTypeDialogOpen}
          onClose={handleNewTypeDialogClose}
          fullWidth
          maxWidth="sm"
          dir="rtl"
        >
          <DialogTitle>إضافة نوع مراسلة جديد</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              يمكنك إضافة نوع مراسلة جديد ليظهر في قائمة أنواع المراسلات.
            </DialogContentText>

            {typeError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {typeError}
              </Alert>
            )}

            <TextField
              autoFocus
              margin="dense"
              label="اسم نوع المراسلة"
              type="text"
              fullWidth
              variant="outlined"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              required
              placeholder="مثال: مراسلة رسمية"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleNewTypeDialogClose}>إلغاء</Button>
            <Button
              onClick={handleNewTypeSubmit}
              variant="contained"
              disabled={addingType || !newTypeName.trim()}
              startIcon={<AddIcon />}
            >
              {addingType ? "جاري الإضافة..." : "إضافة"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Correspondence Type Confirmation Dialog */}
        <Dialog
          open={deleteTypeDialogOpen}
          onClose={handleDeleteTypeDialogClose}
          dir="rtl"
        >
          <DialogTitle>تأكيد حذف نوع المراسلة</DialogTitle>
          <DialogContent>
            <DialogContentText>
              هل أنت متأكد من حذف نوع المراسلة "{typeToDelete?.type_name}"?
              <br />
              <br />
              <strong>تحذير:</strong> لا يمكن التراجع عن هذه العملية. إذا كان
              هناك مراسلات موجودة بهذا النوع، قد يفشل الحذف.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteTypeDialogClose}>إلغاء</Button>
            <Button
              onClick={handleDeleteTypeConfirm}
              color="error"
              variant="contained"
              disabled={deletingType}
              startIcon={<DeleteIcon />}
            >
              {deletingType ? "جاري الحذف..." : "حذف"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* New Contact Dialog */}
        <Dialog
          open={newContactDialogOpen}
          onClose={handleNewContactDialogClose}
          fullWidth
          maxWidth="sm"
          dir="rtl"
        >
          <DialogTitle>إضافة جهة اتصال جديدة</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              يمكنك إضافة جهة اتصال جديدة لتظهر في قائمة جهات الاتصال.
            </DialogContentText>

            {contactError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {contactError}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  label="اسم جهة الاتصال"
                  type="text"
                  fullWidth
                  variant="outlined"
                  value={newContactData.name}
                  onChange={(e) => handleNewContactInputChange('name', e.target.value)}
                  required
                  placeholder="مثال: أحمد محمد"
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>نوع جهة الاتصال</InputLabel>
                  <Select
                    value={newContactData.contact_type}
                    label="نوع جهة الاتصال"
                    onChange={(e) => handleNewContactInputChange('contact_type', e.target.value)}
                  >
                    <MenuItem value="Person">شخص</MenuItem>
                    <MenuItem value="Organization">مؤسسة</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="رقم الهاتف"
                  type="tel"
                  fullWidth
                  variant="outlined"
                  value={newContactData.phone}
                  onChange={(e) => handleNewContactInputChange('phone', e.target.value)}
                  placeholder="مثال: 01234567890"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="البريد الإلكتروني"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={newContactData.email}
                  onChange={(e) => handleNewContactInputChange('email', e.target.value)}
                  placeholder="مثال: example@domain.com"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="العنوان"
                  multiline
                  rows={2}
                  fullWidth
                  variant="outlined"
                  value={newContactData.address}
                  onChange={(e) => handleNewContactInputChange('address', e.target.value)}
                  placeholder="العنوان الكامل (اختياري)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleNewContactDialogClose}>إلغاء</Button>
            <Button
              onClick={handleNewContactSubmit}
              variant="contained"
              disabled={addingContact || !newContactData.name.trim()}
              startIcon={<AddIcon />}
            >
              {addingContact ? "جاري الإضافة..." : "إضافة جهة الاتصال"}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};

export default LetterForm;
