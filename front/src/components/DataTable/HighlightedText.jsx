import React from 'react';
import { Typography, Box } from '@mui/material';

const HighlightedText = ({ 
  text, 
  searchTerm, 
  variant = 'body2',
  sx = {},
  highlightColor = 'primary.main',
  highlightBgColor = 'primary.light',
  ...props 
}) => {
  // If no search term or text, return normal text
  if (!searchTerm || !text || typeof text !== 'string') {
    return (
      <Typography variant={variant} sx={sx} {...props}>
        {text}
      </Typography>
    );
  }

  // Clean and prepare search term
  const cleanSearchTerm = searchTerm.trim();
  if (!cleanSearchTerm) {
    return (
      <Typography variant={variant} sx={sx} {...props}>
        {text}
      </Typography>
    );
  }

  // Split text by search term (case insensitive)
  const regex = new RegExp(`(${cleanSearchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);

  // If no matches found, return normal text
  if (parts.length === 1) {
    return (
      <Typography variant={variant} sx={sx} {...props}>
        {text}
      </Typography>
    );
  }

  return (
    <Typography variant={variant} sx={sx} {...props}>
      {parts.map((part, index) => {
        // Check if this part matches the search term (case insensitive)
        const isMatch = part.toLowerCase() === cleanSearchTerm.toLowerCase();
        
        if (isMatch) {
          return (
            <Box
              key={index}
              component="span"
              sx={{
                backgroundColor: highlightBgColor,
                color: highlightColor,
                fontWeight: 'bold',
                padding: '1px 2px',
                borderRadius: '2px',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
              }}
            >
              {part}
            </Box>
          );
        }
        
        return part;
      })}
    </Typography>
  );
};

export default HighlightedText;
