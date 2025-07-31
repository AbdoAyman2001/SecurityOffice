// Date formatting utilities

/**
 * Format date to Arabic locale
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return 'غير محدد';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'تاريخ غير صحيح';
  }
};

/**
 * Format date and time to Arabic locale
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return 'غير محدد';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    
    return dateObj.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'تاريخ غير صحيح';
  }
};

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string for input
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
};

/**
 * Get relative time (e.g., "منذ ساعتين")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export const getRelativeTime = (date) => {
  if (!date) return 'غير محدد';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
    
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) {
      return 'منذ لحظات';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `منذ ${minutes} دقيقة${minutes > 1 ? '' : ''}`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `منذ ${hours} ساعة${hours > 1 ? '' : ''}`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `منذ ${days} يوم${days > 1 ? '' : ''}`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `منذ ${months} شهر${months > 1 ? '' : ''}`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `منذ ${years} سنة${years > 1 ? '' : ''}`;
    }
  } catch (error) {
    console.error('Error getting relative time:', error);
    return 'تاريخ غير صحيح';
  }
};

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is today
 */
export const isToday = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    const now = new Date();
    
    return dateObj < now;
  } catch (error) {
    return false;
  }
};

/**
 * Get date range string (e.g., "من 2023-01-01 إلى 2023-01-31")
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Date range string
 */
export const formatDateRange = (startDate, endDate) => {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  
  if (start === 'غير محدد' && end === 'غير محدد') {
    return 'غير محدد';
  } else if (start === 'غير محدد') {
    return `حتى ${end}`;
  } else if (end === 'غير محدد') {
    return `من ${start}`;
  } else {
    return `من ${start} إلى ${end}`;
  }
};
