// File handling utilities for Russian Letter Form

// Parse PDF content using backend API (primary method)
export const parsePdfContentViaBackend = async (file) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const authToken = localStorage.getItem('authToken');
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE_URL}/api/parse-pdf-content/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${authToken}`,
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error parsing PDF content via backend:', error);
    return {
      success: false,
      parsed: false,
      error: error.message
    };
  }
};

// Parse filename using backend API (fallback method)
export const parseFilenameViaBackend = async (filename) => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const authToken = localStorage.getItem('authToken');
    
    const response = await fetch(`${API_BASE_URL}/api/parse-filename/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${authToken}`,
      },
      body: JSON.stringify({ filename })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error parsing filename via backend:', error);
    return {
      success: false,
      parsed: false,
      error: error.message
    };
  }
};

// Analyze attachments and auto-fill form using backend parsing
export const analyzeAttachmentsAndAutoFill = async (attachments, setFormData) => {
  // Process files with priority: PDF content parsing first, then filename parsing
  for (const file of attachments) {
    try {
      let parseResult = null;
      
      // For PDF files, try content parsing first
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        console.log(`Attempting PDF content parsing for: ${file.name}`);
        parseResult = await parsePdfContentViaBackend(file);
        
        // If PDF content parsing failed, fall back to filename parsing
        if (!parseResult.success || !parseResult.parsed) {
          console.log(`PDF content parsing failed for ${file.name}, trying filename parsing...`);
          parseResult = await parseFilenameViaBackend(file.name);
        }
      } else {
        // For non-PDF files, use filename parsing
        parseResult = await parseFilenameViaBackend(file.name);
      }
      
      if (parseResult.success && parseResult.parsed && parseResult.data) {
        // Auto-fill form with parsed data
        setFormData(prev => ({
          ...prev,
          reference_number: parseResult.data.reference_number || prev.reference_number,
          correspondence_date: parseResult.data.correspondence_date || prev.correspondence_date,
          subject: parseResult.data.subject || prev.subject
        }));
        
        const method = parseResult.method || parseResult.pattern || 'unknown';
        console.log(`Auto-filled form from ${file.name} using method: ${method}`);
        return; // Stop after first successful parse
      }
    } catch (error) {
      console.error(`Error parsing file ${file.name}:`, error);
      // Continue to next file
    }
  }
};

// Validate file types (if needed for specific validations)
export const validateFileType = (file, allowedTypes = []) => {
  if (allowedTypes.length === 0) return true;
  
  const fileExtension = file.name.split('.').pop().toLowerCase();
  return allowedTypes.includes(fileExtension);
};

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 بايت';
  
  const k = 1024;
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Check if file is a valid attachment type
export const isValidAttachment = (file) => {
  // For now, accept all file types as mentioned in the original code
  return true;
};

// Process multiple files and return valid ones
export const processFiles = (files) => {
  return Array.from(files).filter(file => {
    // Basic validation
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      console.warn(`File ${file.name} is too large (${formatFileSize(file.size)})`);
      return false;
    }
    
    return isValidAttachment(file);
  });
};
