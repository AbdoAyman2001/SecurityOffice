import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  correspondenceApi,
  correspondenceTypesApi,
  correspondenceTypeProceduresApi,
  contactsApi,
  attachmentsApi
} from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';
import { parseDRFError, parseAttachmentError } from '../utils/errorHandling';

export const useRussianLetterForm = () => {
  const navigate = useNavigate();
  const { user, canCreateCorrespondence } = useAuth();

  // Form state
  const [formData, setFormData] = useState({
    reference_number: '',
    correspondence_date: new Date().toISOString().split('T')[0],
    parent_correspondence: null,
    type: '',
    subject: '',
    direction: 'Incoming', // Always Incoming for Russian letters
    priority: 'normal',
    summary: '',
    current_status: '',
    assigned_to: null, // Always null initially
    contact: '', // Will be set to ASE contact ID
    attachments: [] // Required field for .msg files
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data state
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [correspondences, setCorrespondences] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [hasPermission, setHasPermission] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [parentSearchTerm, setParentSearchTerm] = useState('');

  // Fetch required data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [typesResponse, correspondencesResponse, proceduresResponse, contactsResponse] = await Promise.all([
        correspondenceTypesApi.getAll(),
        correspondenceApi.getAll(),
        correspondenceTypeProceduresApi.getAll(),
        contactsApi.getAll()
      ]);

      setCorrespondenceTypes(typesResponse.data.results || typesResponse.data || []);
      setCorrespondences(correspondencesResponse.data.results || correspondencesResponse.data || []);
      setProcedures(proceduresResponse.data.results || proceduresResponse.data || []);
      const contactsData = contactsResponse.data.results || contactsResponse.data || [];
      setContacts(contactsData);
      
      // Find ASE contact and set as default
      const aseContact = contactsData.find(contact => 
        contact.name?.toLowerCase().includes('ase') || 
        contact.company_name?.toLowerCase().includes('ase')
      );
      if (aseContact) {
        setFormData(prev => ({ ...prev, contact: aseContact.id || aseContact.contact_id }));
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      // Use comprehensive DRF error parsing for data fetching errors
      const errorMessage = parseDRFError(err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field, value) => {
    console.log(`handleInputChange called: field=${field}, value=${value}`);
    setFormData(prev => {
      console.log('Previous formData:', prev);
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Auto-select initial status when correspondence type is selected
      if (field === 'type' && value) {
        console.log('Type selected, looking for initial procedure...');
        const initialProcedure = procedures.find(proc => 
          proc.correspondence_type === value && proc.is_initial === true
        );
        console.log('Found initial procedure:', initialProcedure);
        if (initialProcedure) {
          newData.current_status = initialProcedure.id; // Use 'id' not 'procedure_id'
        }
      }
      
      console.log('New formData:', newData);
      return newData;
    });
  };

  // Validate form
  const validateForm = () => {
    const errors = [];
    
    if (!formData.reference_number.trim()) {
      errors.push('الرقم المرجعى مطلوب');
    }
    
    if (!formData.correspondence_date) {
      errors.push('تاريخ الخطاب مطلوب');
    }
    
    if (!formData.type) {
      errors.push('نوع الخطاب مطلوب');
    }
    
    if (!formData.subject.trim()) {
      errors.push('موضوع الخطاب مطلوب');
    }
    
    if (!formData.contact) {
      errors.push('الجهة المخاطبة مطلوبة');
    }
    
    if (formData.attachments.length === 0) {
      errors.push('يجب إرفاق ملف واحد على الأقل');
    }
    
    if (errors.length > 0) {
      setError(errors.join(' • '));
      return false;
    }
    
    setError(null);
    return true;
  };

  // Handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare data for submission
      const submissionData = {
        ...formData,
        direction: 'Incoming', // Ensure direction is always Incoming
        assigned_to: null // Ensure assigned_to is always null
      };

      // Create the correspondence first
      const response = await correspondenceApi.create(submissionData);
      const correspondenceId = response.data.correspondence?.correspondence_id || response.data.correspondence_id;
      
      // Upload attachments if any
      if (formData.attachments.length > 0) {
        try {
          const uploadResponse = await attachmentsApi.upload(correspondenceId, formData.attachments);
          console.log('Attachments uploaded successfully:', uploadResponse.data);
        } catch (attachmentError) {
          console.error('Error uploading attachments:', attachmentError);
          // Use comprehensive error parsing for attachment errors
          const attachmentErrorMessage = parseAttachmentError(attachmentError);
          setError(attachmentErrorMessage);
          setSuccess(null); // Clear success message if attachments failed
          return; // Stop execution to show the error
        }
      }
      
      setSuccess('تم حفظ الخطاب الروسي بنجاح!');
      
      // Reset form after successful submission
      resetForm();
      
    } catch (err) {
      console.error('Error submitting form:', err);
      // Use comprehensive DRF error parsing
      const errorMessage = parseDRFError(err);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      reference_number: '',
      correspondence_date: new Date().toISOString().split('T')[0],
      parent_correspondence: null,
      type: '',
      subject: '',
      direction: 'Incoming',
      priority: 'normal',
      summary: '',
      current_status: '',
      assigned_to: null,
      contact: '',
      attachments: []
    });
    
    setError(null);
    setSuccess(null);
    setDragActive(false);
    setParentSearchTerm('');
    
    // Re-find and set ASE contact as default
    const aseContact = contacts.find(contact => 
      contact.name?.toLowerCase().includes('ase') || 
      contact.company_name?.toLowerCase().includes('ase')
    );
    if (aseContact) {
      setFormData(prev => ({ ...prev, contact: aseContact.id || aseContact.contact_id }));
    }
  };

  // Handle cancel
  const handleCancel = () => {
    resetForm();
    // navigate('/russian-letters');
  };

  // Initialize data on mount
  useEffect(() => {
    fetchData();
  }, []);

  return {
    // State
    formData,
    loading,
    submitting,
    error,
    success,
    correspondenceTypes,
    correspondences,
    procedures,
    contacts,
    hasPermission,
    dragActive,
    parentSearchTerm,
    
    // Actions
    handleInputChange,
    handleSubmit,
    handleCancel,
    resetForm,
    setError,
    setSuccess,
    setDragActive,
    setParentSearchTerm,
    setFormData,
    
    // Computed
    filteredCorrespondences: correspondences.filter(corr => {
      if (!parentSearchTerm) return correspondences;
      const searchLower = parentSearchTerm.toLowerCase();
      return (
        corr.reference_number?.toLowerCase().includes(searchLower) ||
        corr.subject?.toLowerCase().includes(searchLower) ||
        corr.correspondence_id?.toString().includes(searchLower)
      );
    })
  };
};
