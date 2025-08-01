import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  List,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableProcedureItem from './SortableProcedureItem';

/**
 * Tab component for managing correspondence procedures
 */
const ProceduresTab = ({
  procedures,
  selectedTypeId,
  correspondenceTypes,
  loading,
  onAddProcedure,
  onEditProcedure,
  onDeleteProcedure,
  onDragEnd,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const selectedType = correspondenceTypes.find(
    (type) => type.correspondence_type_id === selectedTypeId
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6" component="h2">
            إجراءات الخطابات
          </Typography>
          {selectedType && (
            <Typography variant="body2" color="text.secondary">
              النوع المحدد: {selectedType.type_name}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddProcedure}
          disabled={loading || !selectedTypeId}
        >
          إضافة إجراء جديد
        </Button>
      </Box>

      {!selectedTypeId ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          يرجى اختيار نوع الخطاب من التبويب الأول لإدارة الإجراءات المرتبطة به.
        </Alert>
      ) : procedures.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              لا توجد إجراءات لهذا النوع
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ابدأ بإضافة إجراء جديد لتنظيم سير العمل
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom>
              الإجراءات ({procedures.length})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              يمكنك سحب وإفلات الإجراءات لتغيير ترتيبها
            </Typography>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={procedures.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <List>
                  {procedures.map((procedure) => (
                    <SortableProcedureItem
                      key={procedure.id}
                      procedure={procedure}
                      onEdit={onEditProcedure}
                      onDelete={onDeleteProcedure}
                    />
                  ))}
                </List>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ProceduresTab;
