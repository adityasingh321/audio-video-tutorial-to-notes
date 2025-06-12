import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3f51b5', // Deeper blue (like header background)
      light: '#757de8',
      dark: '#002984',
      contrastText: '#ffffff', // White text on primary background
    },
    secondary: {
      main: '#4CAF50', // Changed to vibrant green (Success color)
      light: '#80e27e', // Adjusted light green
      dark: '#00701a', // Adjusted dark green
      contrastText: '#ffffff',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
    success: {
      main: '#4caf50',
    },
    background: {
      default: '#ffffff', // Main content background
      paper: '#ffffff', // Paper/Card background
      dark: '#1a237e', // Custom dark background for sections (like hero)
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)', // Dark text on light backgrounds
      secondary: 'rgba(0, 0, 0, 0.54)',
      dark: '#ffffff', // White text on dark backgrounds
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      fontSize: '2.5rem', // Larger for prominent headings
      marginBottom: '1rem',
      color: '#ffffff', // Default for hero/dark sections
    },
    h5: {
      fontWeight: 600,
      fontSize: '2rem', // Larger for main section titles
      marginBottom: '0.75rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1.25rem',
      marginBottom: '0.5rem',
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 8, // Consistent rounding
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
          '&:hover': {
            boxShadow: '0px 8px 20px rgba(0, 0, 0, 0.2)', // More pronounced hover shadow
          },
        },
        containedPrimary: {
          backgroundColor: '#3f51b5',
          '&:hover': {
            backgroundColor: '#303f9f',
          },
        },
        containedSecondary: (({ theme }) => ({
          backgroundColor: theme.palette.secondary.main,
          color: theme.palette.secondary.contrastText,
          '&:hover': {
            backgroundColor: theme.palette.secondary.dark,
          },
          // Adding a subtle glow effect for secondary buttons
          transition: 'background-color 0.3s ease-in-out, box-shadow 0.3s ease-in-out, transform 0.2s ease-out',
          '&:active': {
            transform: 'scale(0.98)',
          },
          '&.Mui-disabled': {
            backgroundColor: '#a5d6a7', // Desaturated green for disabled state (Light Green 200)
            color: '#ffffff !important', // Keep text white even when disabled
            boxShadow: 'none', // Remove shadow when disabled
          },
        })),
        containedError: {
          backgroundColor: '#f44336',
          '&:hover': {
            backgroundColor: '#d32f2f',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12, // Slightly more pronounced rounding
          boxShadow: '0px 8px 25px rgba(0, 0, 0, 0.08)',
          padding: '24px',
          transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0px 12px 35px rgba(0, 0, 0, 0.12)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
      styleOverrides: {
        root: (({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: 12, // Slightly more rounded
            backgroundColor: '#ffffff', // Clean white background
            '& fieldset': {
              border: '1px solid rgba(0, 0, 0, 0.12) !important', // Subtle, light grey border
            },
            '&:hover fieldset': {
              border: '1px solid rgba(0, 0, 0, 0.23) !important', // Slightly darker on hover
            },
            '&.Mui-focused fieldset': {
              border: `1px solid ${theme.palette.primary.main} !important`, // Primary main color on focus
              outline: `none`, // Remove default outline if border is present
            },
            boxShadow: '0px 2px 5px rgba(0, 0, 0, 0.05)', // Subtle shadow
          },
          '& .MuiInputLabel-root': {
            color: theme.palette.text.secondary,
          },
          '& .MuiInputBase-input': {
            padding: '16px 18px', // Increased padding for more spacious feel
          },
          '& .MuiInputBase-input::placeholder': {
            color: 'rgba(0, 0, 0, 0.6)', // Placeholder text color
            opacity: 1,
          },
          '& .MuiInputAdornment-root .MuiSvgIcon-root': {
            color: 'rgba(0, 0, 0, 0.7)', // Email icon color
          },
        })),
      },
    },
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          color: '#bdbdbd',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)',
          },
          '&.Mui-checked': {
            color: '#4caf50',
          },
          '&.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#4caf50',
          },
        },
        track: {
          borderRadius: 10,
          backgroundColor: '#e0e0e0',
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          color: '#3f51b5',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
      },
    },
  },
});

export default theme;