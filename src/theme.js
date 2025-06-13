import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4A6CF7', // Vibrant blue
      light: '#7D9AFA',
      dark: '#3A5AE8',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#10B981', // Emerald green
      light: '#34D399',
      dark: '#059669',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#EF4444',
    },
    warning: {
      main: '#F59E0B',
    },
    info: {
      main: '#3B82F6',
    },
    success: {
      main: '#10B981',
    },
    background: {
      default: '#F9FAFB', // Very light gray
      paper: '#FFFFFF',
    },
    text: {
      primary: '#111827', // Dark gray
      secondary: '#6B7280',
      disabled: '#9CA3AF',
    },
    divider: '#E5E7EB',
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '3rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.875rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontWeight: 500,
      fontSize: '1rem',
      lineHeight: 1.5,
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
      fontSize: '0.9375rem',
      letterSpacing: '0.025em',
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1)',
    '0px 1px 4px rgba(0, 0, 0, 0.1)',
    '0px 2px 5px rgba(0, 0, 0, 0.1)',
    '0px 3px 6px rgba(0, 0, 0, 0.1)',
    '0px 4px 8px rgba(0, 0, 0, 0.1)',
    '0px 5px 10px rgba(0, 0, 0, 0.1)',
    '0px 6px 12px rgba(0, 0, 0, 0.1)',
    '0px 7px 14px rgba(0, 0, 0, 0.1)',
    '0px 8px 16px rgba(0, 0, 0, 0.1)',
    '0px 9px 18px rgba(0, 0, 0, 0.1)',
    '0px 10px 20px rgba(0, 0, 0, 0.1)',
    '0px 11px 22px rgba(0, 0, 0, 0.1)',
    '0px 12px 24px rgba(0, 0, 0, 0.1)',
    '0px 13px 26px rgba(0, 0, 0, 0.1)',
    '0px 14px 28px rgba(0, 0, 0, 0.1)',
    '0px 15px 30px rgba(0, 0, 0, 0.1)',
    '0px 16px 32px rgba(0, 0, 0, 0.1)',
    '0px 17px 34px rgba(0, 0, 0, 0.1)',
    '0px 18px 36px rgba(0, 0, 0, 0.1)',
    '0px 19px 38px rgba(0, 0, 0, 0.1)',
    '0px 20px 40px rgba(0, 0, 0, 0.1)',
    '0px 21px 42px rgba(0, 0, 0, 0.1)',
    '0px 22px 44px rgba(0, 0, 0, 0.1)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '10px 20px',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          transition: 'box-shadow 0.3s ease, transform 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        fullWidth: true,
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: '#10B981',
                opacity: 1,
                border: 0,
              },
              '&.Mui-disabled + .MuiSwitch-track': {
                opacity: 0.5,
              },
            },
            '&.Mui-focusVisible .MuiSwitch-thumb': {
              color: '#10B981',
              border: '6px solid #fff',
            },
            '&.Mui-disabled .MuiSwitch-thumb': {
              color: '#E5E7EB',
            },
            '&.Mui-disabled + .MuiSwitch-track': {
              opacity: 0.7,
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 22,
            height: 22,
          },
          '& .MuiSwitch-track': {
            borderRadius: 26 / 2,
            backgroundColor: '#E5E7EB',
            opacity: 1,
            transition: 'background-color 0.3s ease',
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: '12px 16px',
          alignItems: 'center',
        },
        icon: {
          marginRight: 12,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0, 0, 0, 0.08)',
        },
      },
    },
  },
});

export default theme;