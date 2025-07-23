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
  
  return errors.map(error => {
    console.log('Processing individual error:', error);
    
    // Handle specific unique constraint error format
    if (error.includes('The fields reference_number, correspondence_date must make a unique set')) {
      console.log('Matched unique constraint error, returning Arabic translation');
      return 'يوجد خطاب آخر بنفس الرقم المرجعي والتاريخ. يرجى استخدام رقم مرجعي مختلف أو تاريخ مختلف.';
    }
    
    // Handle other unique constraint violations
    if (error.includes('unique') || error.includes('already exists')) {
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
  if (errorDetail.includes('reference_number') && errorDetail.includes('correspondence_date')) {
    return 'يوجد خطاب آخر بنفس الرقم المرجعي والتاريخ. يرجى استخدام رقم مرجعي مختلف أو تاريخ مختلف.';
  }
  
  if (errorDetail.includes('reference_number')) {
    return 'الرقم المرجعي مستخدم من قبل. يرجى استخدام رقم مرجعي مختلف.';
  }
  
  return 'البيانات المدخلة موجودة مسبقاً. يرجى التحقق من البيانات والمحاولة مرة أخرى.';
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
    'This field is required.': 'هذا الحقل مطلوب.',
    'This field may not be blank.': 'هذا الحقل لا يمكن أن يكون فارغاً.',
    'This field may not be null.': 'هذا الحقل مطلوب.',
    'Enter a valid email address.': 'يرجى إدخال عنوان بريد إلكتروني صحيح.',
    'Enter a valid URL.': 'يرجى إدخال رابط صحيح.',
    'Enter a valid date.': 'يرجى إدخال تاريخ صحيح.',
    'Enter a valid time.': 'يرجى إدخال وقت صحيح.',
    'Enter a valid number.': 'يرجى إدخال رقم صحيح.',
    'Ensure this value is greater than or equal to': 'يجب أن تكون القيمة أكبر من أو تساوي',
    'Ensure this value is less than or equal to': 'يجب أن تكون القيمة أقل من أو تساوي',
    'Ensure this field has no more than': 'يجب ألا يتجاوز هذا الحقل',
    'Ensure this field has at least': 'يجب أن يحتوي هذا الحقل على الأقل على',
    'Invalid choice.': 'اختيار غير صحيح.',
    'Not a valid choice.': 'اختيار غير صحيح.',
    'Authentication credentials were not provided.': 'لم يتم توفير بيانات المصادقة.',
    'Invalid token.': 'رمز المصادقة غير صحيح.',
    'Token has expired.': 'انتهت صلاحية رمز المصادقة.',
    'Permission denied.': 'ليس لديك الصلاحية للقيام بهذا الإجراء.',
    'Not found.': 'العنصر المطلوب غير موجود.',
    'Method not allowed.': 'العملية غير مسموحة.',
    'Unsupported media type.': 'نوع الملف غير مدعوم.',
    'Request was throttled.': 'تم تجاوز الحد المسموح من الطلبات.',
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
