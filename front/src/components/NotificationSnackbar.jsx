import React from 'react';
import { Snackbar, Alert } from '@mui/material';

/**
 * Reusable notification component
 * Displays success, error, warning, and info messages
 */
const NotificationSnackbar = ({ notification, onClose }) => {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={notification.severity}
        sx={{ width: '100%' }}
        variant="filled"
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbar;
