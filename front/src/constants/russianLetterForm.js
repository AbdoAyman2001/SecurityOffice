// Constants for Russian Letter Form

export const PRIORITY_OPTIONS = [
  { value: 'high', label: 'عالية' },
  { value: 'normal', label: 'عادية' },
  { value: 'low', label: 'منخفضة' }
];

export const INITIAL_FORM_DATA = {
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
};

export const FORM_LABELS = {
  reference_number: 'الرقم المرجعى',
  correspondence_date: 'تاريخ الخطاب',
  type: 'نوع الخطاب *',
  priority: 'الأولوية',
  contact: 'الجهة المخاطبة',
  parent_correspondence: 'خطاب سابق (اختياري)',
  subject: 'الموضوع *',
  summary: 'ملخص الخطاب (اختياري)',
  attachments: 'المرفقات *'
};

export const FORM_PLACEHOLDERS = {
  reference_number: 'مثال: 123/45/ص',
  subject: 'موضوع الخطاب الروسي',
  summary: 'ملخص قصير لمحتوى الخطاب الروسي',
  parent_correspondence: 'ابحث بالرقم المرجعى أو الموضوع...'
};

export const MESSAGES = {
  loading: 'جاري تحميل البيانات...',
  submitting: 'جاري الحفظ...',
  success: 'تم حفظ الخطاب الروسي بنجاح!',
  attachmentsRequired: 'يجب إرفاق ملف واحد على الأقل - يمكنك سحب الملفات وإفلاتها في أي مكان على الصفحة',
  attachedFiles: 'الملفات المرفقة:',
  dragAndDrop: 'أفلت الملفات هنا',
  dragAndDropSubtext: 'سيتم إضافة جميع الملفات إلى المرفقات',
  chooseFiles: 'اختيار الملفات',
  cancel: 'إلغاء',
  save: 'حفظ الخطاب الروسي',
  noOptionsText: 'لا توجد خطابات مطابقة',
  clearText: 'مسح',
  openText: 'فتح',
  closeText: 'إغلاق'
};
