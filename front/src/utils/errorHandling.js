/**
 * Utility functions for handling Django REST Framework errors
 * and converting them to user-friendly Arabic messages
 */

/**
 * Parse DRF error response and return user-friendly Arabic message
 * @param {Object} error - Axios error object
 * @returns {string} - User-friendly error message in Arabic
 */
export const parseDRFError = (error) => {
  // Debug logging to understand error structure
  console.log('parseDRFError called with:', error);
  console.log('error.response:', error.response);
  console.log('error.response.data:', error.response?.data);
  
  // Handle network errors
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
      return 'خطأ في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.';
    }
    return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
  }

  const { status, data } = error.response;

  // Handle different HTTP status codes
  switch (status) {
    case 400: // Bad Request
      return parseBadRequestError(data);
    
    case 401: // Unauthorized
      return 'انتهت صلاحية جلسة العمل. يرجى تسجيل الدخول مرة أخرى.';
    
    case 403: // Forbidden
      return 'ليس لديك الصلاحية للقيام بهذا الإجراء.';
    
    case 404: // Not Found
      return 'العنصر المطلوب غير موجود.';
    
    case 409: // Conflict
      return parseConflictError(data);
    
    case 422: // Unprocessable Entity
      return parseValidationError(data);
    
    case 429: // Too Many Requests
      return 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.';
    
    case 500: // Internal Server Error
      return 'خطأ في الخادم. يرجى المحاولة مرة أخرى أو الاتصال بالدعم الفني.';
    
    case 502: // Bad Gateway
      return 'الخادم غير متاح حالياً. يرجى المحاولة مرة أخرى بعد قليل.';
    
    case 503: // Service Unavailable
      return 'الخدمة غير متاحة حالياً. يرجى المحاولة مرة أخرى بعد قليل.';
    
    default:
      return parseGenericError(data);
  }
};

/**
 * Parse 400 Bad Request errors
 * @param {Object} data - Error response data
 * @returns {string} - User-friendly error message
 */
const parseBadRequestError = (data) => {
  // Debug logging to understand data structure
  console.log('parseBadRequestError called with data:', data);
  console.log('data.non_field_errors:', data?.non_field_errors);
  
  // Handle field validation errors
  if (data && typeof data === 'object') {
    // Check for specific field errors
    const fieldErrors = parseFieldErrors(data);
    if (fieldErrors.length > 0) {
      return fieldErrors.join('\n');
    }

    // Check for non-field errors
    if (data.non_field_errors && Array.isArray(data.non_field_errors)) {
      console.log('Processing non_field_errors:', data.non_field_errors);
      return parseNonFieldErrors(data.non_field_errors);
    }

    // Check for unique constraint errors
    if (data.detail && data.detail.includes('unique')) {
      return parseUniqueConstraintError(data.detail);
    }

    // Check for general error messages
    if (data.error) {
      return data.error;
    }

    if (data.message) {
      return data.message;
    }

    if (data.detail) {
      return data.detail;
    }
  }

  return 'البيانات المدخلة غير صحيحة. يرجى مراجعة الحقول والمحاولة مرة أخرى.';
};

/**
 * Parse field-specific validation errors
 * @param {Object} data - Error response data
 * @returns {Array} - Array of field error messages
 */
const parseFieldErrors = (data) => {
  const fieldErrorMessages = [];
  const fieldNameMap = {
    'reference_number': 'الرقم المرجعي',
    'correspondence_date': 'تاريخ الخطاب',
    'type': 'نوع الخطاب',
    'subject': 'الموضوع',
    'contact': 'جهة الاتصال',
    'priority': 'الأولوية',
    'summary': 'الملخص',
    'current_status': 'الحالة',
    'attachments': 'المرفقات',
    'parent_correspondence': 'الخطاب السابق'
  };

  Object.keys(data).forEach(fieldName => {
    if (Array.isArray(data[fieldName])) {
      const arabicFieldName = fieldNameMap[fieldName] || fieldName;
      const errors = data[fieldName];
      
      errors.forEach(errorMsg => {
        // Translate common validation messages
        const translatedError = translateValidationMessage(errorMsg);
        fieldErrorMessages.push(`${arabicFieldName}: ${translatedError}`);
      });
    }
  });

  return fieldErrorMessages;
};

/**
 * Parse non-field errors
 * @param {Array} errors - Array of non-field errors
 * @returns {string} - Combined error message
 */
const parseNonFieldErrors = (errors) => {
  console.log('parseNonFieldErrors called with:', errors);
  
  if (!Array.isArray(errors)) {
    return 'حدث خطأ في التحقق من البيانات.';
  }

  const translatedErrors = errors.map(error => {
    console.log('Processing error:', error);
    
    // Handle specific unique constraint errors
    if (error.includes('reference_number') && error.includes('correspondence_date') && error.includes('unique')) {
      return 'يوجد خطاب آخر بنفس الرقم المرجعي وتاريخ الخطاب. يرجى تغيير أحد هذين الحقلين.';
    }
    
    // Handle general unique constraint errors
    if (error.includes('unique')) {
      return parseUniqueConstraintError(error);
    }
    
    // Handle other common errors
    return translateValidationMessage(error);
  }).join('\n');
};

/**
 * Parse unique constraint errors
 * @param {string} errorDetail - Error detail message
 * @returns {string} - User-friendly error message
 */
const parseUniqueConstraintError = (errorDetail) => {
  // Handle specific unique constraint patterns
  if (errorDetail.includes('reference_number')) {
    return 'الرقم المرجعي مستخدم من قبل. يرجى استخدام رقم مرجعي مختلف.';
  }
  
  if (errorDetail.includes('email')) {
    return 'عنوان البريد الإلكتروني مستخدم من قبل.';
  }
  
  // Generic unique constraint error
  return 'القيمة المدخلة مستخدمة من قبل. يرجى استخدام قيمة مختلفة.';
};

/**
 * Parse RESTRICT constraint errors
 * @param {string} errorDetail - Error detail message
 * @returns {string} - User-friendly error message
 */
const parseRestrictConstraintError = (errorDetail) => {
  // Handle specific RESTRICT patterns
  if (errorDetail.includes('User') || errorDetail.includes('user')) {
    return 'لا يمكن حذف هذا المستخدم لأنه مرتبط ببيانات أخرى في النظام.';
  }
  
  if (errorDetail.includes('Contact') || errorDetail.includes('contact')) {
    return 'لا يمكن حذف هذا الاتصال لأنه مرتبط بخطابات أو بيانات أخرى.';
  }
  
  if (errorDetail.includes('CorrespondenceType') || errorDetail.includes('correspondence_type')) {
    return 'لا يمكن حذف نوع الخطاب لأنه مستخدم في خطابات موجودة.';
  }
  
  if (errorDetail.includes('Procedure') || errorDetail.includes('procedure')) {
    return 'لا يمكن حذف هذا الإجراء لأنه مرتبط بخطابات أو بيانات أخرى.';
  }
  
  // Generic RESTRICT error
  return 'لا يمكن حذف هذا العنصر لأنه مرتبط ببيانات أخرى في النظام. يرجى حذف البيانات المرتبطة أولاً.';
};

/**
 * Parse foreign key constraint errors
 * @param {string} errorDetail - Error detail message
 * @returns {string} - User-friendly error message
 */
const parseForeignKeyConstraintError = (errorDetail) => {
  // Handle specific foreign key patterns
  if (errorDetail.includes('contact') || errorDetail.includes('Contact')) {
    return 'الاتصال المحدد غير موجود. يرجى اختيار اتصال صحيح.';
  }
  
  if (errorDetail.includes('user') || errorDetail.includes('User')) {
    return 'المستخدم المحدد غير موجود.';
  }
  
  if (errorDetail.includes('type') || errorDetail.includes('Type')) {
    return 'نوع الخطاب المحدد غير موجود. يرجى اختيار نوع صحيح.';
  }
  
  if (errorDetail.includes('procedure') || errorDetail.includes('Procedure')) {
    return 'الإجراء المحدد غير موجود. يرجى اختيار إجراء صحيح.';
  }
  
  // Generic foreign key error
  return 'العنصر المرجعي غير موجود. يرجى التحقق من البيانات المدخلة.';
};

/**
 * Parse check constraint errors
 * @param {string} errorDetail - Error detail message
 * @returns {string} - User-friendly error message
 */
const parseCheckConstraintError = (errorDetail) => {
  // Handle specific check constraint patterns
  if (errorDetail.includes('priority')) {
    return 'قيمة الأولوية غير صحيحة. يرجى اختيار أولوية صحيحة.';
  }
  
  if (errorDetail.includes('direction')) {
    return 'اتجاه الخطاب غير صحيح. يرجى اختيار اتجاه صحيح.';
  }
  
  if (errorDetail.includes('status')) {
    return 'حالة الخطاب غير صحيحة. يرجى اختيار حالة صحيحة.';
  }
  
  // Generic check constraint error
  return 'القيمة المدخلة لا تتوافق مع القيود المحددة. يرجى التحقق من البيانات.';
};

/**
 * Parse NOT NULL constraint errors
 * @param {string} errorDetail - Error detail message
 * @returns {string} - User-friendly error message
 */
const parseNotNullConstraintError = (errorDetail) => {
  // Handle specific NOT NULL patterns
  if (errorDetail.includes('reference_number')) {
    return 'الرقم المرجعي مطلوب ولا يمكن أن يكون فارغاً.';
  }
  
  if (errorDetail.includes('correspondence_date')) {
    return 'تاريخ الخطاب مطلوب ولا يمكن أن يكون فارغاً.';
  }
  
  if (errorDetail.includes('subject')) {
    return 'موضوع الخطاب مطلوب ولا يمكن أن يكون فارغاً.';
  }
  
  if (errorDetail.includes('contact')) {
    return 'الاتصال مطلوب ولا يمكن أن يكون فارغاً.';
  }
  
  // Generic NOT NULL error
  return 'هذا الحقل مطلوب ولا يمكن أن يكون فارغاً.';
};

/**
 * Parse 409 Conflict errors
 * @param {Object} data - Error response data
 * @returns {string} - User-friendly error message
 */
const parseConflictError = (data) => {
  if (data && data.detail) {
    return parseUniqueConstraintError(data.detail);
  }
  
  return 'تعارض في البيانات. العنصر موجود مسبقاً أو يتعارض مع بيانات أخرى.';
};

/**
 * Parse validation errors (422)
 * @param {Object} data - Error response data
 * @returns {string} - User-friendly error message
 */
const parseValidationError = (data) => {
  return parseBadRequestError(data);
};

/**
 * Parse generic errors
 * @param {Object} data - Error response data
 * @returns {string} - User-friendly error message
 */
const parseGenericError = (data) => {
  if (data && data.detail) {
    return data.detail;
  }
  
  if (data && data.error) {
    return data.error;
  }
  
  if (data && data.message) {
    return data.message;
  }
  
  return 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
};

/**
 * Translate common DRF validation messages to Arabic
 * @param {string} message - Original validation message
 * @returns {string} - Translated message
 */
const translateValidationMessage = (message) => {
  const translations = {
    // Basic validation messages
    'This field is required.': 'هذا الحقل مطلوب.',
    'This field may not be blank.': 'هذا الحقل لا يمكن أن يكون فارغاً.',
    'This field may not be null.': 'هذا الحقل مطلوب.',
    'Enter a valid email address.': 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
    'Enter a valid URL.': 'يرجى إدخال رابط صحيح.',
    'Enter a valid date.': 'يرجى إدخال تاريخ صحيح.',
    'Enter a valid time.': 'يرجى إدخال وقت صحيح.',
    'Enter a valid number.': 'يرجى إدخال رقم صحيح.',
    'Enter a valid integer.': 'يرجى إدخال رقم صحيح.',
    'Enter a valid decimal number.': 'يرجى إدخال رقم عشري صحيح.',
    
    // Length and range validation
    'Ensure this value is greater than or equal to': 'يجب أن تكون القيمة أكبر من أو تساوي',
    'Ensure this value is less than or equal to': 'يجب أن تكون القيمة أقل من أو تساوي',
    'Ensure this field has no more than': 'يجب ألا يتجاوز هذا الحقل',
    'Ensure this field has at least': 'يجب أن يحتوي هذا الحقل على الأقل على',
    'Ensure this value has at most': 'يجب ألا تتجاوز القيمة',
    'Ensure this value has at least': 'يجب أن تحتوي القيمة على الأقل على',
    'characters': 'حرف',
    'character': 'حرف',
    
    // Choice validation
    'Invalid choice.': 'اختيار غير صحيح.',
    'Not a valid choice.': 'اختيار غير صحيح.',
    'Select a valid choice.': 'يرجى اختيار خيار صحيح.',
    
    // Unique constraint messages
    'This field must be unique.': 'هذا الحقل يجب أن يكون فريداً.',
    'already exists': 'موجود مسبقاً',
    'must be unique': 'يجب أن يكون فريداً',
    'The fields reference_number, correspondence_date must make a unique set.': 'يوجد خطاب آخر بنفس الرقم المرجعي وتاريخ الخطاب. يرجى تغيير أحد هذين الحقلين.',
    
    // Authentication and authorization
    'Authentication credentials were not provided.': 'لم يتم توفير بيانات المصادقة.',
    'Invalid token.': 'رمز المصادقة غير صحيح.',
    'Token has expired.': 'انتهت صلاحية رمز المصادقة.',
    'Permission denied.': 'ليس لديك الصلاحية للقيام بهذا الإجراء.',
    'You do not have permission to perform this action.': 'ليس لديك الصلاحية للقيام بهذا الإجراء.',
    
    // HTTP status messages
    'Not found.': 'العنصر المطلوب غير موجود.',
    'Method not allowed.': 'العملية غير مسموحة.',
    'Unsupported media type.': 'نوع الملف غير مدعوم.',
    'Request was throttled.': 'تم تجاوز الحد المسموح من الطلبات.',
    'Bad request.': 'طلب غير صحيح.',
    'Internal server error.': 'خطأ في الخادم.',
    
    // Database constraint messages
    'UNIQUE constraint failed': 'فشل في قيد الفرادة',
    'NOT NULL constraint failed': 'فشل في قيد عدم الفراغ',
    'FOREIGN KEY constraint failed': 'فشل في قيد المفتاح الأجنبي',
    'CHECK constraint failed': 'فشل في قيد التحقق',
    'cannot be deleted because it is referenced': 'لا يمكن حذفه لأنه مرجع إليه',
    'violates foreign key constraint': 'ينتهك قيد المفتاح الأجنبي',
    'violates unique constraint': 'ينتهك قيد الفرادة',
    'violates not-null constraint': 'ينتهك قيد عدم الفراغ',
    'violates check constraint': 'ينتهك قيد التحقق',
    
    // File upload messages
    'The submitted file is empty.': 'الملف المرسل فارغ.',
    'No file was submitted.': 'لم يتم إرسال أي ملف.',
    'The submitted data was not a file.': 'البيانات المرسلة ليست ملفاً.',
    'File too large.': 'الملف كبير جداً.',
    'Invalid file type.': 'نوع الملف غير صحيح.',
    
    // Date and time validation
    'Date has wrong format.': 'تنسيق التاريخ غير صحيح.',
    'Time has wrong format.': 'تنسيق الوقت غير صحيح.',
    'Datetime has wrong format.': 'تنسيق التاريخ والوقت غير صحيح.',
    'Expected a date but got a datetime.': 'متوقع تاريخ لكن تم الحصول على تاريخ ووقت.',
    'Expected a datetime but got a date.': 'متوقع تاريخ ووقت لكن تم الحصول على تاريخ فقط.',
    
    // JSON and data format messages
    'JSON parse error': 'خطأ في تحليل JSON',
    'Invalid JSON.': 'JSON غير صحيح.',
    'Malformed JSON.': 'JSON مشوه.',
    'Expected a dictionary but got': 'متوقع قاموس لكن تم الحصول على',
    'Expected a list but got': 'متوقعة قائمة لكن تم الحصول على',
    
    // Model validation messages
    'Instance with this': 'مثيل بهذا',
    'does not exist': 'غير موجود',
    'is not a valid': 'ليس صحيحاً',
    'Invalid pk': 'مفتاح أساسي غير صحيح',
    'Incorrect type': 'نوع غير صحيح',
  };

  // Check for exact matches first
  if (translations[message]) {
    return translations[message];
  }

  // Check for partial matches
  for (const [english, arabic] of Object.entries(translations)) {
    if (message.includes(english)) {
      return message.replace(english, arabic);
    }
  }

  // Return original message if no translation found
  return message;
};

/**
 * Parse attachment upload errors specifically
 * @param {Object} error - Axios error object
 * @returns {string} - User-friendly error message
 */
export const parseAttachmentError = (error) => {
  if (!error.response) {
    return 'فشل في رفع المرفقات. يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى.';
  }

  const { status, data } = error.response;

  switch (status) {
    case 400:
      if (data && data.error) {
        if (data.error.includes('correspondence_id')) {
          return 'خطأ في معرف الخطاب. يرجى إعادة تحميل الصفحة والمحاولة مرة أخرى.';
        }
        if (data.error.includes('files')) {
          return 'لم يتم اختيار أي ملفات للرفع.';
        }
        return data.error;
      }
      return 'البيانات المرسلة للمرفقات غير صحيحة.';
    
    case 413: // Payload Too Large
      return 'حجم الملفات كبير جداً. يرجى اختيار ملفات أصغر حجماً.';
    
    case 415: // Unsupported Media Type
      return 'نوع الملف غير مدعوم. يرجى اختيار ملفات من النوع المسموح.';
    
    default:
      return parseDRFError(error);
  }
};
