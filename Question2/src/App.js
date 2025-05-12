import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import StockPage from './pages/StockPage';
import HeatmapPage from './pages/HeatmapPage';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Container, 
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Paper,
  useMediaQuery
} from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import GridViewIcon from '@mui/icons-material/GridView';

// Create a custom theme with a professional color palette
const theme = createTheme({
  palette: {
    primary: {
      main: '#1565c0', // Deeper blue for a more professional look
      light: '#5e92f3',
      dark: '#003c8f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#2e7d32', // Forest green for financial context
      light: '#60ad5e',
      dark: '#005005',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f5f7fa', // Light gray-blue background
      paper: '#ffffff',
    },
    text: {
      primary: '#263238',
      secondary: '#546e7a',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 500,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 500,
      letterSpacing: '-0.5px',
    },
    h6: {
      fontWeight: 500,
    },
    subtitle1: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: '0 2px 4px rgba(21, 101, 192, 0.2)',
        },
        containedSecondary: {
          boxShadow: '0 2px 4px rgba(46, 125, 50, 0.2)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
      },
    },
  },
});

// App component with responsive design
const App = () => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '100vh',
          backgroundColor: 'background.default'
        }}>
          <AppBar 
            position="sticky" 
            elevation={0} 
            sx={{ 
              backgroundColor: 'background.paper', 
              borderBottom: '1px solid', 
              borderColor: 'divider',
              color: 'text.primary'
            }}
          >
            <Container maxWidth="lg">
              <Toolbar disableGutters sx={{ py: 1 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  mr: 3,
                  color: 'primary.main'
                }}>
                  <ShowChartIcon sx={{ mr: 1, fontSize: 28 }} />
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 600,
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Stock Analytics
                  </Typography>
                </Box>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    component={Link} 
                    to="/stocks" 
                    variant="contained"
                    color="primary"
                    startIcon={<ShowChartIcon />}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      borderRadius: 2,
                      px: isMobile ? 1.5 : 2.5
                    }}
                  >
                    {isMobile ? 'Chart' : 'Stock Chart'}
                  </Button>
                  <Button 
                    component={Link} 
                    to="/heatmap" 
                    variant="contained"
                    color="secondary"
                    startIcon={<GridViewIcon />}
                    size={isMobile ? "small" : "medium"}
                    sx={{ 
                      borderRadius: 2,
                      px: isMobile ? 1.5 : 2.5
                    }}
                  >
                    {isMobile ? 'Heatmap' : 'Correlation'}
                  </Button>
                </Box>
              </Toolbar>
            </Container>
          </AppBar>
          
          <Box component="main" sx={{ flexGrow: 1, py: 3 }}>
            <Container maxWidth="lg">
              <Routes>
                <Route path="/" element={<Navigate to="/stocks" replace />} />
                <Route path="/stocks" element={<StockPage />} />
                <Route path="/heatmap" element={<HeatmapPage />} />
              </Routes>
            </Container>
          </Box>
          
          <Box 
            component="footer" 
            sx={{ 
              py: 2, 
              mt: 'auto',
              backgroundColor: 'background.paper',
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Container maxWidth="lg">
              <Typography 
                variant="body2" 
                color="text.secondary" 
                align="center"
              >
                Stock Analytics Dashboard © {new Date().getFullYear()}
              </Typography>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
