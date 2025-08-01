import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  CircularProgress,
  Typography,
  Box,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import InlineEditCell from './InlineEditCell';
import { correspondenceTypesApi, peopleApi } from '../../services/apiService';

const RussianLettersTable = ({
  letters,
  loading,
  error,
  sortConfig,
  onSort,
  onUpdateLetter
}) => {
  const navigate = useNavigate();
  const { canEditCorrespondence } = useAuth();
  
  const [correspondenceTypes, setCorrespondenceTypes] = useState([]);
  const [users, setUsers] = useState([]);

  // Fetch options for inline editing
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [typesResponse, usersResponse] = await Promise.all([
          correspondenceTypesApi.getAll({ category: 'Russian' }),
          peopleApi.getAll()
        ]);
        
        setCorrespondenceTypes(typesResponse.data.results || typesResponse.data || []);
        setUsers(usersResponse.data.results || usersResponse.data || []);
      } catch (error) {
        console.error('Error fetching options:', error);
      }
    };

    fetchOptions();
  }, []);

  const handleViewLetter = (letterId) => {
    navigate(`/correspondence/${letterId}`);
  };

  const handleEditLetter = (letterId) => {
    navigate(`/correspondence/${letterId}/edit`);
  };

  const handleInlineEdit = async (letterId, fieldName, value) => {
    try {
      const updateData = { [fieldName]: value };
      const result = await onUpdateLetter(letterId, updateData);
      return result;
    } catch (error) {
      console.error('Error updating letter:', error);
      return { success: false, error: 'فشل في التحديث' };
    }
  };

  const getDisplayValue = (letter, field) => {
    switch (field) {
      case 'type':
        return letter.type?.type_name || 'غير محدد';
      case 'current_status':
        return letter.current_status?.procedure_name || 
               letter.current_status?.description || 
               letter.current_status?.status || 'غير محدد';
      case 'assigned_to':
        if (!letter.assigned_to) return 'غير مخصص';
        return letter.assigned_to.first_name || 
               letter.assigned_to.username || 
               letter.assigned_to.email || 'غير محدد';
      default:
        return letter[field];
    }
  };

  const priorityOptions = [
    { value: 'high', label: 'عالية' },
    { value: 'normal', label: 'عادية' },
    { value: 'low', label: 'منخفضة' }
  ];

  const typeOptions = correspondenceTypes.map(type => ({
    value: type.correspondence_type_id,
    label: type.type_name
  }));

  const userOptions = [
    { value: null, label: 'غير مخصص' },
    ...users.map(user => ({
      value: user.person_record_id,
      label: user.full_name_arabic || user.full_name_english || user.person_record_id
    }))
  ];

  const columns = [
    { 
      id: 'reference_number', 
      label: 'الرقم المرجعي', 
      sortable: true,
      editable: canEditCorrespondence()
    },
    { 
      id: 'correspondence_date', 
      label: 'التاريخ', 
      sortable: true,
      editable: canEditCorrespondence(),
      type: 'date'
    },
    { 
      id: 'type', 
      label: 'النوع', 
      sortable: true,
      editable: canEditCorrespondence(),
      type: 'select',
      options: typeOptions
    },
    { 
      id: 'subject', 
      label: 'الموضوع', 
      sortable: true,
      editable: canEditCorrespondence(),
      multiline: true,
      maxWidth: 250
    },
    { 
      id: 'priority', 
      label: 'الأولوية', 
      sortable: true,
      editable: canEditCorrespondence(),
      type: 'priority',
      options: priorityOptions
    },
    { 
      id: 'current_status', 
      label: 'الحالة', 
      sortable: false,
      editable: false
    },
    { 
      id: 'assigned_to', 
      label: 'المخصص إلى', 
      sortable: true,
      editable: canEditCorrespondence(),
      type: 'select',
      options: userOptions
    },
    { 
      id: 'actions', 
      label: 'الإجراءات', 
      sortable: false,
      editable: false
    }
  ];

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell key={column.id}>
                {column.sortable ? (
                  <TableSortLabel
                    active={sortConfig.field === column.id}
                    direction={sortConfig.field === column.id ? sortConfig.direction : 'asc'}
                    onClick={() => onSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                ) : (
                  column.label
                )}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                </Box>
              </TableCell>
            </TableRow>
          ) : letters.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                <Typography variant="body1" color="textSecondary" sx={{ p: 3 }}>
                  لا توجد خطابات روسية
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            letters.map((letter) => {
              const priorityDisplay = letter.priority === 'high' 
                ? { bgColor: '#ffebee' } 
                : { bgColor: 'transparent' };

              return (
                <TableRow
                  key={letter.correspondence_id}
                  sx={{
                    backgroundColor: priorityDisplay.bgColor,
                    '&:hover': {
                      backgroundColor: letter.priority === 'high' ? '#ffcdd2' : 'action.hover'
                    }
                  }}
                >
                  {/* Reference Number */}
                  <TableCell>
                    <InlineEditCell
                      value={letter.reference_number}
                      displayValue={letter.reference_number || 'غير محدد'}
                      onSave={handleInlineEdit}
                      editable={canEditCorrespondence()}
                      fieldName="reference_number"
                      rowId={letter.correspondence_id}
                      required
                    />
                  </TableCell>

                  {/* Date */}
                  <TableCell>
                    <InlineEditCell
                      value={letter.correspondence_date}
                      type="date"
                      onSave={handleInlineEdit}
                      editable={canEditCorrespondence()}
                      fieldName="correspondence_date"
                      rowId={letter.correspondence_id}
                      required
                    />
                  </TableCell>

                  {/* Type */}
                  <TableCell>
                    <InlineEditCell
                      value={letter.type?.correspondence_type_id}
                      displayValue={getDisplayValue(letter, 'type')}
                      type="select"
                      options={typeOptions}
                      onSave={handleInlineEdit}
                      editable={canEditCorrespondence()}
                      fieldName="type"
                      rowId={letter.correspondence_id}
                    />
                  </TableCell>

                  {/* Subject */}
                  <TableCell>
                    <InlineEditCell
                      value={letter.subject}
                      displayValue={letter.subject || 'بدون موضوع'}
                      onSave={handleInlineEdit}
                      editable={canEditCorrespondence()}
                      fieldName="subject"
                      rowId={letter.correspondence_id}
                      maxWidth={250}
                      multiline
                      required
                    />
                  </TableCell>

                  {/* Priority */}
                  <TableCell>
                    <InlineEditCell
                      value={letter.priority}
                      type="priority"
                      options={priorityOptions}
                      onSave={handleInlineEdit}
                      editable={canEditCorrespondence()}
                      fieldName="priority"
                      rowId={letter.correspondence_id}
                    />
                  </TableCell>

                  {/* Status (Read-only) */}
                  <TableCell>
                    <Typography variant="body2">
                      {getDisplayValue(letter, 'current_status')}
                    </Typography>
                  </TableCell>

                  {/* Assigned To */}
                  <TableCell>
                    <InlineEditCell
                      value={letter.assigned_to?.id || null}
                      displayValue={getDisplayValue(letter, 'assigned_to')}
                      type="select"
                      options={userOptions}
                      onSave={handleInlineEdit}
                      editable={canEditCorrespondence()}
                      fieldName="assigned_to"
                      rowId={letter.correspondence_id}
                    />
                  </TableCell>

                  {/* Actions */}
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="عرض التفاصيل">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewLetter(letter.correspondence_id)}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      {canEditCorrespondence() && (
                        <Tooltip title="تعديل">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleEditLetter(letter.correspondence_id)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default RussianLettersTable;
