// File handling utilities for Russian Letter Form

// Parse PDF filename to extract letter information
export const parsePdfFilename = (filename) => {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
  
  // Pattern: [number] [space] [dd] [space] [8-digit-date]_[subject]
  // Example: "7612 dd 22072025_On the Site Access for Contractor's Vehicle (Chevrolet ,2500, 1998, Green)"
  const pattern = /^(\d+)\s+[a-z]+\s+(\d{8})[_ ]?(.*)$/i;
  const match = nameWithoutExt.match(pattern);
  
  if (match) {
    const [, refNumber, dateStr, subject] = match;
    
    // Parse date from DDMMYYYY format
    const day = dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const year = dateStr.substring(4, 8);
    const formattedDate = `${year}-${month}-${day}`;
    
    return {
      reference_number: refNumber,
      correspondence_date: formattedDate,
      subject: subject.trim(),
      parsed: true
    };
  }
  
  return { parsed: false };
};

// Analyze attachments and auto-fill form if PDF with correct pattern is found
export const analyzeAttachmentsAndAutoFill = (attachments, setFormData) => {
  const pdfFiles = attachments.filter(file => 
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
  
  for (const pdfFile of pdfFiles) {
    const parsed = parsePdfFilename(pdfFile.name);
    if (parsed.parsed) {
      // Auto-fill form with parsed data
      setFormData(prev => ({
        ...prev,
        reference_number: parsed.reference_number,
        correspondence_date: parsed.correspondence_date,
        subject: parsed.subject
      }));
      
      console.log('Auto-filled form from PDF filename:', parsed);
      break; // Use the first matching PDF
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
