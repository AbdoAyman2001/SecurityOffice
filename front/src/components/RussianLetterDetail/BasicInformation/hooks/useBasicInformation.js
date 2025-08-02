import { useState } from "react";
import { useAuth } from "../../../../contexts/AuthContext";
import { formatDateForInput } from "../../../../utils/dateUtils";
import {
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

// Field configuration constants
export const FIELD_CONFIG = {
  PRIORITY_OPTIONS: [
    { value: "high", label: "هام وعاجل" },
    { value: "normal", label: "عادي" },
    { value: "low", label: "منخفض" },
  ],
  DIRECTION_OPTIONS: [
    { value: "Incoming", label: "وارد" },
    { value: "Outgoing", label: "صادر" },
  ],
  FIELD_DEFINITIONS: [
    {
      id: "reference_number",
      label: "الرقم المرجعي",
      type: "text",
      icon: AssignmentIcon,
      placeholder: "مثال: 123/45/ص",
      gridPosition: { row: 1, col: 1 }
    },
    {
      id: "subject",
      label: "الموضوع",
      type: "text",
      icon: CategoryIcon,
      placeholder: "موضوع الخطاب",
      multiline: true,
      customStyles: { direction: "ltr", textAlign: "left" },
      gridPosition: { row: 1, col: 2 }
    },
    {
      id: "correspondence_date",
      label: "تاريخ الخطاب",
      type: "date",
      icon: CalendarIcon,
      gridPosition: { row: 2, col: 1 }
    },
    {
      id: "type",
      label: "نوع الخطاب",
      type: "select",
      icon: CategoryIcon,
      gridPosition: { row: 2, col: 2 }
    },
    {
      id: "current_status",
      label: "الحالة",
      type: "select",
      icon: AssignmentIcon,
      gridPosition: { row: 3, col: 1 }
    },
    {
      id: "priority",
      label: "الأولوية",
      type: "select",
      icon: AssignmentIcon,
      gridPosition: { row: 3, col: 2 }
    }
  ]
};

// Helper functions
export const getPriorityLabel = (priority) => {
  const option = FIELD_CONFIG.PRIORITY_OPTIONS.find(opt => opt.value === priority);
  return option ? option.label : priority || "عادي";
};

export const getDirectionLabel = (direction) => {
  const option = FIELD_CONFIG.DIRECTION_OPTIONS.find(opt => opt.value === direction);
  return option ? option.label : direction || "غير محدد";
};

export const getFieldValue = (letter, fieldId) => {
  switch (fieldId) {
    case "type":
      // Handle nested type object structure
      if (letter.type && typeof letter.type === 'object') {
        return letter.type.type_name || "غير محدد";
      }
      // Handle direct type_name field
      if (letter.type_name) {
        return letter.type_name;
      }
      // Handle null or undefined type
      return "لم يتم تحديد نوع الخطاب";
    case "priority":
      return getPriorityLabel(letter.priority);
    case "current_status":
      // Handle nested current_status object structure
      if (letter.current_status && typeof letter.current_status === 'object') {
        return letter.current_status.procedure_name || "غير محدد";
      }
      // Handle direct current_status_name field
      if (letter.current_status_name) {
        return letter.current_status_name;
      }
      // Handle null or undefined status - return placeholder that will be handled by UI
      return null; // Let the UI component handle the display
    case "direction":
      return getDirectionLabel(letter.direction);
    default:
      return letter[fieldId] || "غير محدد";
  }
};

export const getFieldOptions = (fieldId, correspondenceTypes, procedures = [], currentLetter = null, editingField = null, editValue = null) => {
  switch (fieldId) {
    case "type":
      if (!Array.isArray(correspondenceTypes)) {
        console.warn('correspondenceTypes is not an array:', correspondenceTypes);
        return [];
      }
      
      // Filter only Russian correspondence types
      const russianTypes = correspondenceTypes.filter(type => 
        type.category === 'Russian'
      );
      
      console.log('All correspondence types:', correspondenceTypes.length);
      console.log('Russian correspondence types:', russianTypes.length);
      console.log('Russian types details:', russianTypes.map(t => ({ id: t.correspondence_type_id, name: t.type_name })));
      
      return russianTypes.map((type) => ({
        value: type.correspondence_type_id || type.id,
        label: type.type_name,
      }));
    case "current_status":
      // Return procedures as status options, filtered by correspondence type
      if (!Array.isArray(procedures)) {
        console.warn('procedures is not an array:', procedures);
        // Return placeholder option for no procedures available
        return [{
          value: '',
          label: 'لا توجد حالات متاحة',
          disabled: true
        }];
      }
      
      // Determine the current correspondence type ID
      let currentTypeId = null;
      
      // If we're currently editing the type field, use the edit value
      if (editingField === 'type' && editValue) {
        currentTypeId = editValue;
      }
      // Otherwise, get the type from the current letter
      else if (currentLetter) {
        if (currentLetter.type && typeof currentLetter.type === 'object') {
          currentTypeId = currentLetter.type.correspondence_type_id || currentLetter.type.id;
        } else if (currentLetter.type) {
          currentTypeId = currentLetter.type;
        }
      }
      
      console.log('Current type ID for filtering procedures:', currentTypeId);
      console.log('Available procedures before filtering:', procedures.length);
      
      // If no type is selected, show appropriate message
      if (!currentTypeId) {
        return [{
          value: '',
          label: 'يرجى اختيار نوع الخطاب أولاً',
          disabled: true
        }];
      }
      
      // Filter procedures by correspondence type
      const filteredProcedures = procedures.filter(procedure => {
        // Check if procedure belongs to the current correspondence type
        return procedure.correspondence_type_id === currentTypeId || 
               procedure.correspondence_type === currentTypeId ||
               (procedure.correspondence_type && procedure.correspondence_type.id === currentTypeId);
      });
      
      console.log(`Filtered procedures for type ${currentTypeId}:`, filteredProcedures.length);
      console.log('Filtered procedures details:', filteredProcedures.map(p => ({ 
        id: p.id, 
        name: p.procedure_name, 
        order: p.procedure_order,
        type_id: p.correspondence_type_id || p.correspondence_type
      })));
      
      // If no procedures available for this type, show informative message
      if (filteredProcedures.length === 0) {
        return [{
          value: '',
          label: 'لا توجد حالات متاحة لهذا النوع',
          disabled: true
        }];
      }
      
      // Create status options from filtered procedures
      const statusOptions = filteredProcedures.map((procedure) => ({
        value: procedure.id,
        label: procedure.procedure_name,
      }));
      
      // Add a placeholder option at the beginning if current status is null
      const currentStatus = currentLetter?.current_status;
      if (!currentStatus || (typeof currentStatus === 'object' && !currentStatus.id)) {
        statusOptions.unshift({
          value: '',
          label: 'اختر الحالة...',
          disabled: false // Allow selection of empty to clear status
        });
      }
      
      console.log('Status options generated:', statusOptions);
      return statusOptions;
    case "priority":
      return FIELD_CONFIG.PRIORITY_OPTIONS;
    case "direction":
      return FIELD_CONFIG.DIRECTION_OPTIONS;
    default:
      return [];
  }
};

// Custom hook for BasicInformation logic
export const useBasicInformation = (letter, onUpdate) => {
  const { user } = useAuth();
  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Check edit permissions
  const canEdit = user?.canEditCorrespondence ?? true;

  const handleStartEdit = (fieldName, currentValue) => {
    if (!canEdit) return;
    setEditingField(fieldName);
    setError(null);
    setSuccess(false);

    // Handle different field types
    switch (fieldName) {
      case "correspondence_date":
        setEditValue(formatDateForInput(currentValue));
        break;
      case "type":
        // Handle nested type object structure
        if (letter.type && typeof letter.type === 'object') {
          setEditValue(letter.type.correspondence_type_id || letter.type.id || "");
        } else if (letter.type) {
          // Handle direct type field (if it's just an ID)
          setEditValue(letter.type);
        } else {
          // Handle null/undefined type - start with empty selection
          setEditValue("");
        }
        break;
      case "contact":
        setEditValue(letter.contact?.contact_id || letter.contact || "");
        break;
      case "assigned_to":
        setEditValue(letter.assigned_to?.id || letter.assigned_to || "");
        break;
      case "current_status":
        // Handle nested current_status object structure
        if (letter.current_status && typeof letter.current_status === 'object') {
          setEditValue(letter.current_status.id || "");
        } else if (letter.current_status) {
          // Handle direct current_status field (if it's just an ID)
          setEditValue(letter.current_status);
        } else {
          // Handle null/undefined status - start with empty selection
          setEditValue("");
        }
        break;
      case "priority":
        setEditValue(letter.priority || "");
        break;
      case "direction":
        setEditValue(letter.direction || "");
        break;
      default:
        setEditValue(currentValue || "");
    }
  };

  const handleSave = async () => {
    if (!editingField || !onUpdate) return;

    setSaving(true);
    setError(null);

    try {
      await onUpdate(editingField, editValue);
      
      // If we just changed the correspondence type, we need to handle the status field
      if (editingField === 'type') {
        // The status options will change, so we might need to clear the current status
        // if it's not valid for the new type. This will be handled by the parent component
        // when it reloads the procedures for the new type.
        console.log('Correspondence type changed, status options will be updated');
      }
      
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

  return {
    // State
    editingField,
    editValue,
    saving,
    error,
    success,
    canEdit,
    
    // Actions
    handleStartEdit,
    handleSave,
    handleCancel,
    setEditValue,
    setError,
    
    // Helper functions
    getFieldValue: (fieldId) => getFieldValue(letter, fieldId),
    getFieldOptions: (fieldId, correspondenceTypes, procedures) => getFieldOptions(fieldId, correspondenceTypes, procedures, letter, editingField, editValue),
  };
};
