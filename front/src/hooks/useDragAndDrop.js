import { useEffect, useCallback, useState } from 'react';
import { processFiles, analyzeAttachmentsAndAutoFill } from '../utils/fileUtils';

export const useDragAndDrop = (formData, setFormData, setDragActive,resetForm) => {
  
  // Process .msg files by sending them to backend for attachment extraction
  const processMsgFiles = useCallback(async (msgFiles, setFormData) => {
    // Get the API base URL (same as used in authService)
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    
    try {
      for (const msgFile of msgFiles) {
        const formData = new FormData();
        formData.append('file', msgFile);
        
        // Get the auth token (same format as used in authService)
        const authToken = localStorage.getItem('authToken');
        
        const response = await fetch(`${API_BASE_URL}/api/process-msg/`, {
          method: 'POST',
          headers: {
            'Authorization': `Token ${authToken}`,
          },
          body: formData
        });
        
        if (!response.ok) {
          // Handle different response types gracefully
          let errorMessage = 'Failed to process .msg file';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (jsonError) {
            // If response is not JSON, use status text
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }
        
        const result = await response.json();
        
        if (result.success && result.attachments && result.attachments.length > 0) {
          // Convert hex data back to File objects
          const extractedFiles = result.attachments.map(attachment => {
            // Convert hex string back to binary data
            const binaryData = new Uint8Array(
              attachment.data.match(/.{1,2}/g).map(byte => parseInt(byte, 16))
            );
            
            // Create a new File object from the binary data
            const file = new File([binaryData], attachment.name, {
              type: attachment.mime_type || 'application/octet-stream'
            });
            
            // Add size property for display
            Object.defineProperty(file, 'size', {
              value: attachment.size,
              writable: false
            });
            
            return file;
          });
          
          // REPLACE previous attachments with MSG file + extracted files (don't append)
          const allFiles = [msgFile, ...extractedFiles];
          setFormData(prev => ({
            ...prev,
            attachments: allFiles
          }));
          
          // Analyze extracted files for patterns (async)
          analyzeAttachmentsAndAutoFill(extractedFiles, setFormData).catch(error => {
            console.error('Error analyzing extracted files:', error);
          });
          
          console.log(`Replaced attachments with ${msgFile.name} and extracted ${result.attachments.length} attachments`);
        } else {
          // If no attachments found, still include the MSG file itself
          setFormData(prev => ({
            ...prev,
            attachments: [msgFile]
          }));
          console.log(`No attachments found in ${msgFile.name}, but included the MSG file itself`);
        }
      }
    } catch (error) {
      console.error('Error processing .msg files:', error);
      // Don't fail the entire operation, just log the error
    }
  }, []);
  
  // Handle file drag and drop (global)
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    resetForm();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = useCallback(async (files) => {
    // Accept all file types now
    if (files.length === 0) {
      console.warn('No files selected');
      return;
    }

    const regularFiles = [];
    const msgFiles = [];
    
    // Separate .msg files from regular files
    files.forEach(file => {
      if (file.name.toLowerCase().endsWith('.msg')) {
        msgFiles.push(file);
      } else {
        regularFiles.push(file);
      }
    });
    
    // If MSG files are present, they will replace all attachments
    // Otherwise, add regular files to existing attachments
    if (msgFiles.length > 0) {
      // Process .msg files by sending them to backend
      // This will replace all previous attachments
      await processMsgFiles(msgFiles, setFormData);
    } else if (regularFiles.length > 0) {
      // Add regular files directly to attachments (append to existing)
      setFormData(prev => {
        const newAttachments = [...prev.attachments, ...regularFiles];
        return {
          ...prev,
          attachments: newAttachments
        };
      });
      
      // Analyze regular files for patterns (async)
      analyzeAttachmentsAndAutoFill(regularFiles, setFormData).catch(error => {
        console.error('Error analyzing regular files:', error);
      });
    }
  }, [setFormData, processMsgFiles]);

  const removeAttachment = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  }, [setFormData]);

  // Global drag and drop event handlers
  const handleGlobalDragOver = useCallback((e) => {
    e.preventDefault();
    setDragActive(true);
  }, [setDragActive]);

  const handleGlobalDragLeave = useCallback((e) => {
    if (e.clientX === 0 && e.clientY === 0) {
      setDragActive(false);
    }
  }, [setDragActive]);

  const handleGlobalDrop = useCallback((e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  }, [setDragActive, handleFiles]);

  // Add global drag and drop event listeners
  useEffect(() => {
    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragleave', handleGlobalDragLeave);
    document.addEventListener('drop', handleGlobalDrop);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragleave', handleGlobalDragLeave);
      document.removeEventListener('drop', handleGlobalDrop);
    };
  }, [handleGlobalDragOver, handleGlobalDragLeave, handleGlobalDrop]);

  return {
    handleDrag,
    handleDrop,
    handleFiles,
    removeAttachment
  };
};
