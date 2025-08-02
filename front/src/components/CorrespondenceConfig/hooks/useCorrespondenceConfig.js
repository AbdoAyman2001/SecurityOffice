import { useState, useEffect } from 'react';
import {
  correspondenceTypesApi,
  correspondenceTypeProceduresApi,
} from '../../../services/apiService';
import { parseDRFError } from '../../../utils/errorHandling';
import { useNotification } from './useNotification';

/**
 * Custom hook for managing correspondence configuration
 * Handles CRUD operations for correspondence types and procedures
 */
export const useCorrespondenceConfig = () => {
  const { showSuccess, showError, showWarning } = useNotification();

  // Data state
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
    type_name: '',
    category: '',
  });
  const [procedureForm, setProcedureForm] = useState({
    procedure_name: '',
    description: '',
    is_initial: false,
    is_final: false,
    procedure_order: 1,
  });

  // Load correspondence types
  const loadCorrespondenceTypes = async () => {
    try {
      setLoading(true);
      const response = await correspondenceTypesApi.getAll();
      setCorrespondenceTypes(response.data.results || response.data);
    } catch (error) {
      const errorMessage = parseDRFError(error);
      showError(errorMessage || 'خطأ في تحميل أنواع الخطابات');
      console.error('Error loading correspondence types:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load procedures for a specific type
  const loadProcedures = async (typeId) => {
    try {
      setLoading(true);
      const response = await correspondenceTypeProceduresApi.getByType(typeId);
      const proceduresList = response.data.results || response.data;
      // Sort by procedure_order
      proceduresList.sort((a, b) => a.procedure_order - b.procedure_order);
      setProcedures(proceduresList);
    } catch (error) {
      const errorMessage = parseDRFError(error);
      showError(errorMessage || 'خطأ في تحميل الإجراءات');
      console.error('Error loading procedures:', error);
    } finally {
      setLoading(false);
    }
  };

  // Type management functions
  const handleAddType = () => {
    setEditingType(null);
    setTypeForm({ type_name: '', category: '' });
    setTypeDialogOpen(true);
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      type_name: type.type_name || '',
      category: type.category || '',
    });
    setTypeDialogOpen(true);
  };

  const handleSaveType = async () => {
    try {
      setLoading(true);
      if (editingType) {
        await correspondenceTypesApi.update(
          editingType.correspondence_type_id,
          typeForm
        );
        showSuccess('تم تحديث نوع الخطاب بنجاح');
      } else {
        await correspondenceTypesApi.create(typeForm);
        showSuccess('تم إضافة نوع الخطاب بنجاح');
      }
      setTypeDialogOpen(false);
      loadCorrespondenceTypes();
    } catch (error) {
      const errorMessage = parseDRFError(error);
      showError(errorMessage || 'خطأ في حفظ نوع الخطاب');
      console.error('Error saving type:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteType = async (typeId) => {
    if (
      !window.confirm(
        'هل أنت متأكد من حذف هذا النوع؟ سيتم حذف جميع الإجراءات المرتبطة به.'
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await correspondenceTypesApi.delete(typeId);
      showSuccess('تم حذف نوع الخطاب بنجاح');
      loadCorrespondenceTypes();
      if (selectedTypeId === typeId) {
        setSelectedTypeId(null);
        setProcedures([]);
      }
    } catch (error) {
      const errorMessage = parseDRFError(error);
      showError(errorMessage || 'خطأ في حذف نوع الخطاب');
      console.error('Error deleting type:', error);
    } finally {
      setLoading(false);
    }
  };

  // Procedure management functions
  const handleAddProcedure = () => {
    if (!selectedTypeId) {
      showWarning('يرجى اختيار نوع الخطاب أولاً');
      return;
    }

    setEditingProcedure(null);
    setProcedureForm({
      procedure_name: '',
      description: '',
      is_initial: false,
      is_final: false,
      procedure_order: procedures.length + 1,
    });
    setProcedureDialogOpen(true);
  };

  const handleEditProcedure = (procedure) => {
    setEditingProcedure(procedure);
    setProcedureForm({
      procedure_name: procedure.procedure_name || '',
      description: procedure.description || '',
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
        await correspondenceTypeProceduresApi.update(editingProcedure.id, procedureData);
        showSuccess('تم تحديث الإجراء بنجاح');
      } else {
        await correspondenceTypeProceduresApi.create(procedureData);
        showSuccess('تم إضافة الإجراء بنجاح');
      }
      setProcedureDialogOpen(false);
      loadProcedures(selectedTypeId);
    } catch (error) {
      const errorMessage = parseDRFError(error);
      showError(errorMessage || 'خطأ في حفظ الإجراء');
      console.error('Error saving procedure:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProcedure = async (procedureId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإجراء؟')) {
      return;
    }

    try {
      setLoading(true);
      await correspondenceTypeProceduresApi.delete(procedureId);
      showSuccess('تم حذف الإجراء بنجاح');
      loadProcedures(selectedTypeId);
    } catch (error) {
      const errorMessage = parseDRFError(error);
      showError(errorMessage || 'خطأ في حذف الإجراء');
      console.error('Error deleting procedure:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle drag and drop for procedure ordering
  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = procedures.findIndex((item) => item.id === active.id);
    const newIndex = procedures.findIndex((item) => item.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      console.error('Drag and drop error: Could not find procedure indices', {
        activeId: active.id,
        overId: over.id,
        oldIndex,
        newIndex,
        procedures: procedures.map(p => ({ id: p.id, name: p.procedure_name }))
      });
      showError('خطأ في العثور على الإجراءات المحددة');
      return;
    }

    // Create new array with reordered items
    const newProcedures = [...procedures];
    const [reorderedItem] = newProcedures.splice(oldIndex, 1);
    newProcedures.splice(newIndex, 0, reorderedItem);

    // Update procedure_order for all items
    const updatedProcedures = newProcedures.map((proc, index) => ({
      ...proc,
      procedure_order: index + 1,
    }));

    // Optimistically update the UI
    setProcedures(updatedProcedures);

    try {
      // Update the order in the backend sequentially to avoid race conditions
      console.log('Updating procedure order...', updatedProcedures.map(p => ({ id: p.id, order: p.procedure_order })));
      
      for (const proc of updatedProcedures) {
        try {
          await correspondenceTypeProceduresApi.update(proc.id, {
            procedure_name: proc.procedure_name,
            description: proc.description,
            is_initial: proc.is_initial,
            is_final: proc.is_final,
            procedure_order: proc.procedure_order,
            correspondence_type: selectedTypeId,
          });
        } catch (updateError) {
          console.error(`Failed to update procedure ${proc.id}:`, updateError);
          throw updateError; // Re-throw to trigger the catch block below
        }
      }
      
      showSuccess('تم تحديث ترتيب الإجراءات بنجاح');
    } catch (error) {
      const errorMessage = parseDRFError(error);
      showError(errorMessage || 'خطأ في تحديث ترتيب الإجراءات');
      console.error('Error updating procedure order:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Reload procedures to revert changes
      if (selectedTypeId) {
        loadProcedures(selectedTypeId);
      }
    }
  };

  // Initialize data on mount
  useEffect(() => {
    loadCorrespondenceTypes();
  }, []);

  // Load procedures when selected type changes
  useEffect(() => {
    if (selectedTypeId) {
      loadProcedures(selectedTypeId);
    }
  }, [selectedTypeId]);

  return {
    // State
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

    // Actions
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
    loadCorrespondenceTypes,
    loadProcedures,
  };
};
