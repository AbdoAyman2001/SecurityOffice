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
} from "@mui/material";
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Mail as MailIcon,
  AttachFile as AttachIcon,
  Add as AddIcon,
  Lock as LockIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import {
  correspondenceApi,
  correspondenceTypesApi,
  contactsApi,
} from "../services/apiService";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header";

const LetterForm = () => {
  const navigate = useNavigate();
  const { 
    user, 
    canCreateCorrespondence, 
    canEditCorrespondence, 
    canDeleteCorrespondence,
    isAdmin,
    getUserName 
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
    direction: "incoming",
    priority: "normal",
    summary: "",
    parent_correspondence: null,
  });

  // Lookup data
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [attachments, setAttachments] = useState([]);

  // Contact roles
  const contactRoles = [
    { value: "sender", label: "المرسل" },
    { value: "recipient", label: "المستقبل" },
    { value: "cc", label: "نسخة" },
    { value: "bcc", label: "نسخة مخفية" },
  ];

  // Direction options
  const directionOptions = [
    { value: "incoming", label: "واردة" },
    { value: "outgoing", label: "صادرة" },
    { value: "internal", label: "داخلية" },
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

      const response = await correspondenceApi.create(correspondenceData);
      const correspondenceId = response.data.correspondence_id;

      // Add contacts if any
      if (selectedContacts.length > 0) {
        for (const contact of selectedContacts) {
          if (contact.contact) {
            await correspondenceApi.addContact(correspondenceId, {
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
          formData.append("correspondence", correspondenceId);
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

  useEffect(() => {
    // Check permissions
    if (!canCreateCorrespondence()) {
      setHasPermission(false);
      setError('ليس لديك صلاحية لإنشاء المراسلات');
      return;
    }
    
    fetchLookupData();
  }, [canCreateCorrespondence]);

  // Show permission error if user doesn't have access
  if (!hasPermission) {
    return (
      <>
        <Header />
        <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
          <Paper
            elevation={2}
            sx={{
              p: 4,
              borderRadius: 2,
              textAlign: 'center',
              border: '2px solid #f44336',
            }}
          >
            <LockIcon sx={{ fontSize: 60, color: 'error.main', mb: 2 }} />
            <Typography variant="h4" color="error" gutterBottom>
              غير مصرح لك بالوصول
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              ليس لديك صلاحية لإنشاء المراسلات. يرجى التواصل مع المدير للحصول على الصلاحيات المطلوبة.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/dashboard')}
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
      <Header />
      <Box sx={{ maxWidth: 1200, mx: "auto", p: 3 }}>
        {/* User Info Header */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  fontFamily: "Cairo, sans-serif",
                }}
              >
                إنشاء مراسلة جديدة
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                المستخدم: {getUserName()} • الدور: {isAdmin() ? 'مدير' : 'مستخدم عادي'}
              </Typography>
            </Box>
            <Chip
              label={canEditCorrespondence() ? 'صلاحية كاملة' : 'صلاحية محدودة'}
              color={canEditCorrespondence() ? 'success' : 'warning'}
              variant="outlined"
            />
          </Box>
        </Paper>
      {/* Header */}
      <Paper
        elevation={2}
        sx={{
          p: 3,
          mb: 3,
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
            fontWeight: 600,
            fontFamily: "Cairo, sans-serif",
          }}
        >
          <MailIcon sx={{ fontSize: 40 }} />
          إضافة مراسلة جديدة
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
          قم بملء جميع البيانات المطلوبة لإنشاء مراسلة جديدة في النظام
        </Typography>
      </Paper>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <Paper
          elevation={2}
          sx={{ p: 4, mb: 3, borderRadius: 2 }}
          style={{ display: "flex", flexDirection: "column" }}
        >
          <Typography
            variant="h5"
            sx={{
              mb: 3,
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
                height: 24,
                backgroundColor: "primary.main",
                borderRadius: 1,
                mr: 1,
              }}
            />
            المعلومات الأساسية
          </Typography>

          <Grid
            container
            spacing={3}
            sx={{
              width: "100%",
              margin: 0,
              "& .MuiGrid-item": {
                paddingLeft: "12px !important",
                paddingTop: "12px !important",
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
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  sx={{
                    borderRadius: 2,
                    width: "100%",
                  }}
                >
                  {correspondenceTypes.map((type) => (
                    <MenuItem
                      key={type.correspondence_type_id}
                      value={type.correspondence_type_id}
                    >
                      {type.type_name}
                    </MenuItem>
                  ))}
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

        {/* Contacts Section */}
        <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
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
                height: 24,
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
              mb: 3,
              borderRadius: 2,
              px: 3,
              py: 1.5,
            }}
          >
            إضافة جهة اتصال
          </Button>

          {selectedContacts.map((contact, index) => (
            <Paper
              key={index}
              elevation={1}
              sx={{
                p: 3,
                mb: 2,
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
                <FormControl sx={{ flexGrow: 1 }}>
                  <InputLabel>جهة الاتصال</InputLabel>
                  <Select
                    value={contact.contact}
                    label="جهة الاتصال"
                    onChange={(e) =>
                      handleContactChange(index, "contact", e.target.value)
                    }
                    sx={{
                      borderRadius: 2,
                    }}
                  >
                    {contacts.map((c) => (
                      <MenuItem key={c.contact_id} value={c.contact_id}>
                        {c.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

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
        <Paper elevation={2} sx={{ p: 4, mb: 3, borderRadius: 2 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 3,
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
                height: 24,
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
                mb: 3,
                borderRadius: 2,
                px: 3,
                py: 1.5,
              }}
            >
              إضافة مرفقات
            </Button>
          </label>

          {attachments.length > 0 && (
            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 2, color: "text.secondary" }}
              >
                الملفات المرفقة ({attachments.length}):
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {attachments.map((attachment, index) => (
                  <Paper
                    key={index}
                    elevation={1}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
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
        <Paper elevation={2} sx={{ p: 4, borderRadius: 2 }}>
          <Box
            sx={{
              display: "flex",
              gap: 3,
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
                px: 4,
                py: 1.5,
                minWidth: 150,
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
                px: 4,
                py: 1.5,
                minWidth: 150,
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
      </Box>
    </>
  );
};

export default LetterForm;
