import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

/**
 * Tab component for managing correspondence types
 */
const CorrespondenceTypesTab = ({
  correspondenceTypes,
  loading,
  onAddType,
  onEditType,
  onDeleteType,
  onSelectType,
  selectedTypeId,
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" component="h2">
          أنواع الخطابات
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddType}
          disabled={loading}
        >
          إضافة نوع جديد
        </Button>
      </Box>

      {correspondenceTypes.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <SettingsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              لا توجد أنواع خطابات
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ابدأ بإضافة نوع خطاب جديد لإدارة الخطابات
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {correspondenceTypes.map((type) => (
            <Card
              key={type.correspondence_type_id || type.id}
              sx={{
                cursor: 'pointer',
                border: 1,
                borderColor: selectedTypeId === (type.correspondence_type_id || type.id) 
                  ? 'primary.main' 
                  : 'divider',
                backgroundColor: selectedTypeId === (type.correspondence_type_id || type.id) 
                  ? 'primary.light' 
                  : 'transparent',
                '&:hover': {
                  boxShadow: 2,
                  borderColor: 'primary.light',
                },
                width: '100%',
              }}
              onClick={() => onSelectType(type.correspondence_type_id || type.id)}
            >
              <CardContent sx={{p:'16px !important' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 0, justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2,justifyContent: 'space-evenly', flexBasis: '60%'}}>
                    <Typography variant="subtitle1" component="h3" sx={{ mb: 0 }} flexGrow={1}>
                      {type.type_name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5,flexBasis: '40%'}}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        الفئة:
                      </Typography>
                      <Chip
                        label={type.category === 'Russian' ? 'روسية' : 'عامة'}
                        color={type.category === 'Russian' ? 'secondary' : 'default'}
                        size="small"
                        variant="outlined"
                        sx={{ height: 24 }}
                      />
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {selectedTypeId === (type.correspondence_type_id || type.id) && (
                      <Chip
                        label="محدد"
                        color="primary"
                        size="small"
                        variant="outlined"
                        sx={{ mr: 1, height: 24 }}
                      />
                    )}
                    
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditType(type);
                      }}
                      disabled={loading}
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteType(type.correspondence_type_id || type.id);
                      }}
                      disabled={loading}
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default CorrespondenceTypesTab;
