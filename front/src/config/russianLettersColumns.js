// Column configuration for Russian Letters table
// Based on the backend response structure provided by the user

export const russianLettersColumns = [
  {
    id: 'correspondence_id',
    label: 'معرف المراسلة',
    sortable: true,
    filterable: true,
    editable: false,
    width: 120,
    type: 'number',
    primaryKey: true,
    getValue: (row) => row.correspondence_id,
    defaultValue: 'غير محدد'
  },
  {
    id: 'reference_number',
    label: 'الرقم المرجعي',
    sortable: true,
    filterable: true,
    editable: true,
    width: 180,
    type: 'text',
    getValue: (row) => row.reference_number || 'غير محدد',
    defaultValue: 'غير محدد'
  },
  {
    id: 'correspondence_date',
    label: 'تاريخ المراسلة',
    sortable: true,
    filterable: true,
    editable: true,
    width: 140,
    type: 'date',
    getValue: (row) => row.correspondence_date || 'غير محدد',
    defaultValue: 'غير محدد'
  },
  {
    id: 'contact',
    label: 'جهة الاتصال',
    sortable: true,
    filterable: true,
    editable: false,
    width: 150,
    type: 'text',
    getValue: (row) => row.contact_name || 'غير محدد',
    defaultValue: 'غير محدد'
  },
  {
    id: 'type',
    label: 'النوع',
    sortable: true,
    filterable: true,
    editable: true,
    width: 140,
    type: 'select',
    getValue: (row) => row.type_name || 'غير محدد',
    defaultValue: 'غير محدد'
  },
  {
    id: 'subject',
    label: 'الموضوع',
    sortable: true,
    filterable: false, // Too many unique values
    editable: true,
    width: 250,
    type: 'text',
    multiline: true,
    getValue: (row) => row.subject || 'غير محدد',
    defaultValue: 'غير محدد'
  },
  {
    id: 'direction',
    label: 'الاتجاه',
    sortable: true,
    filterable: true,
    editable: false,
    width: 120,
    type: 'direction',
    getValue: (row) => row.direction || 'غير محدد',
    defaultValue: 'غير محدد',
    options: [
      { value: 'Incoming', label: 'وارد' },
      { value: 'Outgoing', label: 'صادر' },
      { value: 'Internal', label: 'داخلي' }
    ]
  },
  {
    id: 'priority',
    label: 'الأولوية',
    sortable: true,
    filterable: true,
    editable: true,
    width: 120,
    type: 'priority',
    getValue: (row) => row.priority || 'normal',
    defaultValue: 'normal',
    options: [
      { value: 'high', label: 'عالية' },
      { value: 'normal', label: 'عادية' },
      { value: 'low', label: 'منخفضة' }
    ]
  },
  {
    id: 'current_status',
    label: 'الحالة الحالية',
    sortable: true,
    filterable: true,
    editable: false,
    width: 200,
    type: 'text',
    getValue: (row) => row.current_status_name || 'غير محدد',
    defaultValue: 'غير محدد'
  },
  {
    id: 'assigned_to',
    label: 'مُكلف إلى',
    sortable: true,
    filterable: true,
    editable: true,
    width: 150,
    type: 'select',
    getValue: (row) => row.assigned_to?.full_name_arabic || row.assigned_to?.username || 'غير مُكلف',
    defaultValue: 'غير مُكلف'
  },
  {
    id: 'summary',
    label: 'الملخص',
    sortable: false,
    filterable: false,
    editable: true,
    width: 200,
    type: 'text',
    multiline: true,
    getValue: (row) => row.summary || 'لا يوجد ملخص',
    defaultValue: 'لا يوجد ملخص'
  },
  {
    id: 'attachments',
    label: 'المرفقات',
    sortable: false,
    filterable: false,
    editable: false,
    width: 120,
    type: 'attachments',
    getValue: (row) => row.attachments || [],
    defaultValue: []
  },
  {
    id: 'status_logs',
    label: 'سجل الحالات',
    sortable: false,
    filterable: false,
    editable: false,
    width: 140,
    type: 'status_logs',
    getValue: (row) => row.status_logs || [],
    defaultValue: []
  },
  {
    id: 'parent_correspondence',
    label: 'المراسلة الأصل',
    sortable: true,
    filterable: true,
    editable: false,
    width: 150,
    type: 'parent_correspondence',
    getValue: (row) => row.parent_correspondence?.reference_number || 'لا يوجد',
    defaultValue: 'لا يوجد'
  },
  {
    id: 'created_at',
    label: 'تاريخ الإنشاء',
    sortable: true,
    filterable: true,
    editable: false,
    width: 140,
    type: 'datetime',
    getValue: (row) => row.created_at,
    defaultValue: 'غير محدد'
  },
  {
    id: 'updated_at',
    label: 'تاريخ التحديث',
    sortable: true,
    filterable: true,
    editable: false,
    width: 140,
    type: 'datetime',
    getValue: (row) => row.updated_at,
    defaultValue: 'غير محدد'
  }
];

// Field definitions for advanced filtering
export const russianLettersFields = [
  {
    id: 'correspondence_id',
    label: 'معرف المراسلة',
    type: 'number',
    operators: ['equals', 'not_equals', 'greater_than', 'less_than', 'between']
  },
  {
    id: 'reference_number',
    label: 'الرقم المرجعي',
    type: 'text',
    operators: ['contains', 'equals', 'starts_with', 'ends_with', 'not_equals']
  },
  {
    id: 'correspondence_date',
    label: 'تاريخ المراسلة',
    type: 'date',
    operators: ['equals', 'before', 'after', 'between']
  },
  {
    id: 'contact_name',
    label: 'جهة الاتصال',
    type: 'select',
    operators: ['equals', 'not_equals', 'in']
  },
  {
    id: 'type_name',
    label: 'النوع',
    type: 'select',
    operators: ['equals', 'not_equals', 'in']
  },
  {
    id: 'subject',
    label: 'الموضوع',
    type: 'text',
    operators: ['contains', 'equals', 'starts_with', 'ends_with', 'not_equals']
  },
  {
    id: 'direction',
    label: 'الاتجاه',
    type: 'select',
    operators: ['equals', 'not_equals', 'in'],
    options: [
      { value: 'Incoming', label: 'وارد' },
      { value: 'Outgoing', label: 'صادر' },
      { value: 'Internal', label: 'داخلي' }
    ]
  },
  {
    id: 'priority',
    label: 'الأولوية',
    type: 'select',
    operators: ['equals', 'not_equals', 'in'],
    options: [
      { value: 'high', label: 'عالية' },
      { value: 'normal', label: 'عادية' },
      { value: 'low', label: 'منخفضة' }
    ]
  },
  {
    id: 'current_status_name',
    label: 'الحالة الحالية',
    type: 'select',
    operators: ['equals', 'not_equals', 'in']
  },
  {
    id: 'assigned_to',
    label: 'مُكلف إلى',
    type: 'select',
    operators: ['equals', 'not_equals', 'in', 'is_null', 'is_not_null']
  },
  {
    id: 'created_at',
    label: 'تاريخ الإنشاء',
    type: 'datetime',
    operators: ['equals', 'before', 'after', 'between']
  },
  {
    id: 'updated_at',
    label: 'تاريخ التحديث',
    type: 'datetime',
    operators: ['equals', 'before', 'after', 'between']
  }
];

// Operator definitions with Arabic labels
export const operatorLabels = {
  'contains': 'يحتوي على',
  'equals': 'يساوي',
  'not_equals': 'لا يساوي',
  'starts_with': 'يبدأ بـ',
  'ends_with': 'ينتهي بـ',
  'greater_than': 'أكبر من',
  'less_than': 'أصغر من',
  'between': 'بين',
  'before': 'قبل',
  'after': 'بعد',
  'in': 'ضمن',
  'is_null': 'فارغ',
  'is_not_null': 'غير فارغ'
};
