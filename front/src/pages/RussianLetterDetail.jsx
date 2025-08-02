import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Typography,
  Alert,
  Button,
  Divider,
  Grid,
  Fab,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import { correspondenceApi } from "../services/apiService";
import { useNotification } from "../components/CorrespondenceConfig/hooks/useNotification";
import NotificationSnackbar from "../components/NotificationSnackbar";

// Import refactored components
import LetterBreadcrumbs from "../components/RussianLetterDetail/LetterBreadcrumbs";
import LetterHeader from "../components/RussianLetterDetail/LetterHeader";
import BasicInformation from "../components/RussianLetterDetail/BasicInformation/BasicInformation";
import DeleteConfirmDialog from "../components/RussianLetterDetail/DeleteConfirmDialog";
import LoadingState from "../components/RussianLetterDetail/LoadingState";
import RussianLetterEditModal from "../components/RussianLetterDetail/RussianLetterEditModal";
import StatusHistoryModal from "../components/RussianLetterDetail/StatusHistoryModal";
import AttachmentsList from "../components/RussianLetterDetail/AttachmentsList";
import RelatedCorrespondenceList from "../components/RussianLetterDetail/RelatedCorrespondenceList";

const RussianLetterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, canEditCorrespondence, canDeleteCorrespondence } =
    useAuth();
  
  // Notification system
  const {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  } = useNotification();

  // State management
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [statusHistoryModalOpen, setStatusHistoryModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [relatedCorrespondence, setRelatedCorrespondence] = useState([]);
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [users, setUsers] = useState([]);

  // Utility function to extract meaningful error messages from API responses
  const extractErrorMessage = (error, fallbackMessage = "حدث خطأ غير متوقع.") => {
    // Handle different error response structures
    if (error?.response?.data) {
      const data = error.response.data;
      
      // Handle field-specific errors (validation errors)
      if (data.errors && typeof data.errors === 'object') {
        const fieldErrors = Object.entries(data.errors)
          .map(([field, messages]) => {
            const messageArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${messageArray.join(', ')}`;
          })
          .join('; ');
        return fieldErrors;
      }
      
      // Handle general error messages
      if (data.error) {
        // Special handling for database constraint violations
        if (data.error.includes('must make a unique set')) {
          return "يوجد خطاب آخر بنفس رقم المرجع وتاريخ المراسلة. يرجى التحقق من البيانات.";
        }
        return data.error;
      }
      if (data.detail) {
        // Special handling for database constraint violations
        if (data.detail.includes('must make a unique set')) {
          return "يوجد خطاب آخر بنفس رقم المرجع وتاريخ المراسلة. يرجى التحقق من البيانات.";
        }
        return data.detail;
      }
      if (data.message) return data.message;
      
      // Handle non_field_errors
      if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
        const errors = data.non_field_errors.join('; ');
        // Special handling for database constraint violations
        if (errors.includes('must make a unique set')) {
          return "يوجد خطاب آخر بنفس رقم المرجع وتاريخ المراسلة. يرجى التحقق من البيانات.";
        }
        return errors;
      }
      
      // Handle direct string response
      if (typeof data === 'string') {
        // Special handling for database constraint violations
        if (data.includes('must make a unique set')) {
          return "يوجد خطاب آخر بنفس رقم المرجع وتاريخ المراسلة. يرجى التحقق من البيانات.";
        }
        return data;
      }
    }
    
    // Handle network errors
    if (error?.message) {
      if (error.message.includes('Network Error')) {
        return "خطأ في الاتصال بالشبكة. يرجى التحقق من اتصال الإنترنت.";
      }
      if (error.message.includes('timeout')) {
        return "انتهت مهلة الاتصال. يرجى المحاولة مرة أخرى.";
      }
      // Special handling for database constraint violations
      if (error.message.includes('must make a unique set')) {
        return "يوجد خطاب آخر بنفس رقم المرجع وتاريخ المراسلة. يرجى التحقق من البيانات.";
      }
      return error.message;
    }
    
    return fallbackMessage;
  };

  // Load letter data
  useEffect(() => {
    if (!isAuthenticated) {
      setError("ليس لديك الصلاحية لعرض تفاصيل الخطاب.");
      setLoading(false);
      return;
    }
    loadLetterData();
  }, [id, isAuthenticated]);

  const loadLetterData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try the new comprehensive API endpoint first
      try {
        const response = await correspondenceApi.getDetailWithRelations(id);
        const data = response.data;

        console.log("Comprehensive letter data:", data);

        // Set all data from the comprehensive response
        setLetter(data.letter);
        setStatusHistory(data.status_history || []);
        setRelatedCorrespondence(data.related_correspondence || []);
        
        // Set correspondence types (filtering will be handled in the hook)
        setCorrespondenceTypes(data.correspondence_types || []);
        
        setContacts(data.contacts || []);
        setProcedures(data.procedures || []);
        
        // Load users separately since it's not in the comprehensive endpoint
        try {
          const usersResponse = await correspondenceApi.getUsers();
          setUsers(usersResponse.data || []);
        } catch (userError) {
          console.warn('Failed to load users:', userError);
          setUsers([]);
        }

        return; // Success, exit early
      } catch (comprehensiveError) {
        console.warn(
          "Comprehensive endpoint failed, falling back to individual calls:",
          comprehensiveError
        );

        // Fallback to original multiple API calls
        const letterResponse = await correspondenceApi.getById(id);
        setLetter(letterResponse.data);

        // Load related data in parallel
        const [
          statusHistoryResponse,
          relatedData,
          typesResponse,
          contactsResponse,
        ] = await Promise.all([
          correspondenceApi.getStatusHistory(id),
          correspondenceApi.getRelatedCorrespondence(id),
          correspondenceApi.getCorrespondenceTypes(),
          correspondenceApi.getContacts(),
        ]);

        setStatusHistory(statusHistoryResponse.data || []);
        setRelatedCorrespondence(relatedData || []);
        
        // Set correspondence types (filtering will be handled in the hook)
        setCorrespondenceTypes(typesResponse.data || []);
        
        setContacts(contactsResponse.data || []);
        
        // Load users and procedures
        try {
          const usersResponse = await correspondenceApi.getUsers();
          setUsers(usersResponse.data || []);
        } catch (userError) {
          console.warn('Failed to load users:', userError);
          setUsers([]);
        }
        
        // Load procedures for current type if available
        if (letterResponse.data?.type?.correspondence_type_id) {
          try {
            const proceduresResponse =
              await correspondenceApi.getTypeProcedures(
                letterResponse.data.type.correspondence_type_id
              );
            setProcedures(proceduresResponse.data || []);
          } catch (procError) {
            console.warn("Failed to load procedures:", procError);
            setProcedures([]);
          }
        } else {
          setProcedures([]);
        }
      }
    } catch (err) {
      console.error("Error loading letter data:", err);
      
      // Extract meaningful error message from API response
      const errorMessage = extractErrorMessage(err, "حدث خطأ أثناء تحميل بيانات الخطاب. يرجى المحاولة مرة أخرى.");
      
      // Show error notification
      showError(errorMessage);
      
      // Also set the error state for backward compatibility
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Event handlers
  const handleDelete = async () => {
    if (!canDeleteCorrespondence()) {
      const errorMessage = "ليس لديك الصلاحية لحذف الخطابات.";
      showError(errorMessage);
      setError(errorMessage);
      return;
    }

    try {
      setDeleting(true);
      await correspondenceApi.delete(id);
      navigate("/russian-letters", {
        state: { message: "تم حذف الخطاب بنجاح." },
      });
    } catch (err) {
      console.error("Error deleting letter:", err);
      
      // Extract meaningful error message from API response
      const errorMessage = extractErrorMessage(err, "حدث خطأ أثناء حذف الخطاب. يرجى المحاولة مرة أخرى.");
      
      // Show error notification
      showError(errorMessage);
      
      // Also set the error state for backward compatibility
      setError(errorMessage);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const handleEditSuccess = (updatedLetter) => {
    setLetter(updatedLetter);
    setEditModalOpen(false);
    loadLetterData();
  };

  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      await correspondenceApi.downloadAttachment(attachmentId, fileName);
    } catch (err) {
      console.error("Error downloading attachment:", err);
      
      // Extract meaningful error message from API response
      const errorMessage = extractErrorMessage(err, "حدث خطأ أثناء تحميل المرفق.");
      
      // Show error notification
      showError(errorMessage);
      
      // Also set the error state for backward compatibility
      setError(errorMessage);
    }
  };

  const handleFieldUpdate = async (fieldName, value) => {
    try {
      // Use the new updateField method for better performance
      const response = await correspondenceApi.updateField(id, fieldName, value);
      
      // Use the complete updated letter data from the backend response
      if (response.data) {
        console.log('Updated letter data from backend:', response.data);
        setLetter(response.data);
        
        // If type changed, use the available_procedures from the response
        if (fieldName === 'type' && response.data.type) {
          // Check if backend provided available_procedures in the response
          if (response.data.available_procedures) {
            const newProcedures = response.data.available_procedures;
            setProcedures(newProcedures);
            console.log('Updated procedures from backend response:', newProcedures.length);
            
            // Show notification about type change
            const typeName = response.data.type.type_name || 'نوع جديد';
            const procedureCount = newProcedures.length;
            if (procedureCount > 0) {
              showNotification(`تم تغيير نوع الخطاب إلى "${typeName}" مع ${procedureCount} حالة متاحة`, 'success');
            } else {
              showNotification(`تم تغيير نوع الخطاب إلى "${typeName}" - لا توجد حالات متاحة لهذا النوع`, 'info');
            }
          } else {
            // Fallback: fetch procedures separately if not included in response
            console.log('Backend did not provide available_procedures, fetching separately');
            try {
              const typeId = response.data.type.correspondence_type_id || response.data.type.id;
              const proceduresResponse = await correspondenceApi.getTypeProcedures(typeId);
              const newProcedures = proceduresResponse.data || [];
              setProcedures(newProcedures);
              console.log('Fallback: Reloaded procedures for new type:', newProcedures.length);
            } catch (procError) {
              console.warn('Failed to reload procedures:', procError);
              setProcedures([]); // Clear procedures on error
            }
          }
        }
      } else {
        console.warn('No data in response, falling back to manual update');
        // Fallback: manual update if backend doesn't return full data
        setLetter(prevLetter => ({
          ...prevLetter,
          [fieldName]: value
        }));
      }
      
    } catch (err) {
      console.error("Error updating field:", err);
      
      // Extract meaningful error message from API response
      const errorMessage = extractErrorMessage(err);
      
      // Show error notification with detailed message
      showError(errorMessage);
      
      // Also set the error state for backward compatibility
      setError(errorMessage);
      
      throw err; // Re-throw to let the component handle the error
    }
  };

  const handleOpenAttachmentFolder = (letterId) => {
    // Open the folder containing attachments for this letter
    // This would typically call an API endpoint that opens the file explorer
    // For now, we'll use a simple approach - you can enhance this based on your backend
    const folderPath = `attachments/${letterId}`;

    // For Windows, you might use something like:
    if (window.electron) {
      // If using Electron
      window.electron.openFolder(folderPath);
    } else {
      // For web browsers, you might trigger a download or show a message
      alert(`مجلد المرفقات: ${folderPath}`);
      // Or you could call an API endpoint that handles folder opening on the server
      // correspondenceApi.openAttachmentFolder(letterId);
    }
  };

  const handlePrint = () => window.print();

  // Utility functions
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case "high":
        return "error";
      case "normal":
        return "primary";
      case "low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = () => "info";

  // Show loading state only when actually loading
  if (loading) {
    return <LoadingState loading={loading} error={null} />;
  }

  // Show not found state
  if (!letter) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">لم يتم العثور على الخطاب المطلوب.</Alert>
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

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: "auto" }}>
      {/* Breadcrumbs */}
      <LetterBreadcrumbs letter={letter} />

      {/* Header with Actions */}
      <LetterHeader
        letter={letter}
        canEditCorrespondence={canEditCorrespondence()}
        canDeleteCorrespondence={canDeleteCorrespondence()}
        onEdit={() => setEditModalOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
        onShowHistory={() => setStatusHistoryModalOpen(true)}
        onPrint={handlePrint}
        getPriorityColor={getPriorityColor}
        getStatusColor={getStatusColor}
      />

      <Grid container spacing={3}>
        {/* Main Information */}
        <Grid item xs={12} md={8} sx={{ width: "100%" }}>
          <BasicInformation
            letter={letter}
            onUpdate={handleFieldUpdate}
            correspondenceTypes={correspondenceTypes}
            contacts={contacts}
            users={users}
            procedures={procedures}
          />

          {/* Attachments */}
          <Card sx={{ mt: 3 }}>
            <CardContent>
              <AttachmentsList
                attachments={letter.attachments || []}
                onDownload={handleDownloadAttachment}
                onOpenFolder={handleOpenAttachmentFolder}
                letterId={letter.correspondence_id}
              />
            </CardContent>
          </Card>

          {/* Related Correspondence */}
          {letter.related_correspondence &&
            letter.related_correspondence.length > 0 && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    المراسلات ذات الصلة
                  </Typography>
                  <RelatedCorrespondenceList
                    relatedCorrespondence={letter.related_correspondence}
                  />
                </CardContent>
              </Card>
            )}
        </Grid>
      </Grid>

      {/* Floating Action Button - Back to List */}
      <Fab
        color="primary"
        sx={{ position: "fixed", bottom: 16, left: 16 }}
        onClick={() => navigate("/russian-letters")}
      >
        <ArrowBackIcon />
      </Fab>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        letter={letter}
        deleting={deleting}
      />

      {/* Edit Modal */}
      <RussianLetterEditModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        letter={letter}
        onSuccess={handleEditSuccess}
        correspondenceTypes={correspondenceTypes}
        contacts={contacts}
        procedures={procedures}
      />

      {/* Status History Modal */}
      <StatusHistoryModal
        open={statusHistoryModalOpen}
        onClose={() => setStatusHistoryModalOpen(false)}
        statusHistory={statusHistory}
        letterTitle={letter.subject || "بدون موضوع"}
      />
      
      {/* Notification Snackbar */}
      <NotificationSnackbar
        notification={notification}
        onClose={hideNotification}
      />
    </Box>
  );
};

export default RussianLetterDetail;
