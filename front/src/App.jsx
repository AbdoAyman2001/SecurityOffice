import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Toolbar } from '@mui/material';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';

// Import components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import PeopleManagement from './pages/PeopleManagement';
import CorrespondenceManagement from './pages/CorrespondenceManagement';
import PermitsManagement from './pages/PermitsManagement';
import VehicleManagement from './pages/VehicleManagement';
import CardPermitsManagement from './pages/CardPermitsManagement';
import SettingsManagement from './pages/SettingsManagement';
import LetterForm from './pages/LetterForm';
import RussianLetterForm from './pages/RussianLetterForm';
import RussianLetters from './pages/RussianLetters';
import RussianLetterDetail from './pages/RussianLetterDetail';
import NewCorrespondence from './pages/NewCorrespondence';
import CorrespondenceConfig from './pages/CorrespondenceConfig';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Create RTL cache
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

// Create RTL theme with Arabic support
const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Cairo, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#dc004e',
      light: '#ff5983',
      dark: '#9a0036',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          direction: 'rtl',
          fontFamily: 'Cairo, "Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
  },
});

// Placeholder for missing pages
const AccidentsManagement = () => (
  <Box sx={{ p: 3 }}>
    <h2>إدارة الحوادث</h2>
    <p>هذه الصفحة قيد التطوير...</p>
  </Box>
);

const RelocationManagement = () => (
  <Box sx={{ p: 3 }}>
    <h2>إدارة النقل والإسكان</h2>
    <p>هذه الصفحة قيد التطوير...</p>
  </Box>
);

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <AuthProvider>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Router>
            <Box sx={{ display: 'flex', direction: 'rtl' }}>
            <Navbar onMenuClick={handleMenuClick} />
            <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
            
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 0,
                backgroundColor: 'background.default',
                minHeight: '100vh',
              }}
            >
              <Toolbar /> {/* Spacer for fixed navbar */}
              
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/people" element={<ProtectedRoute><PeopleManagement /></ProtectedRoute>} />
                <Route path="/correspondence" element={<ProtectedRoute><CorrespondenceManagement /></ProtectedRoute>} />
                <Route path="/permits" element={<ProtectedRoute><PermitsManagement /></ProtectedRoute>} />
                <Route path="/vehicles" element={<ProtectedRoute><VehicleManagement /></ProtectedRoute>} />
                <Route path="/cards" element={<ProtectedRoute><CardPermitsManagement /></ProtectedRoute>} />
                <Route path="/accidents" element={<ProtectedRoute><AccidentsManagement /></ProtectedRoute>} />
                <Route path="/relocation" element={<ProtectedRoute><RelocationManagement /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsManagement /></ProtectedRoute>} />
                <Route path="/correspondence-config" element={<ProtectedRoute><CorrespondenceConfig /></ProtectedRoute>} />
                <Route path="/forms/letter" element={<ProtectedRoute><LetterForm /></ProtectedRoute>} />
                <Route path="/forms/russian-letter" element={<ProtectedRoute><RussianLetterForm /></ProtectedRoute>} />
                <Route path="/forms/new-correspondence" element={<ProtectedRoute><NewCorrespondence /></ProtectedRoute>} />
                <Route path="/russian-letters" element={<ProtectedRoute><RussianLetters /></ProtectedRoute>} />
                <Route path="/russian-letters/:id" element={<ProtectedRoute><RussianLetterDetail /></ProtectedRoute>} />
              </Routes>
            </Box>
          </Box>
          </Router>
        </ThemeProvider>
      </CacheProvider>
    </AuthProvider>
  );
}

export default App;
