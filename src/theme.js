import { createTheme } from '@mui/material/styles';

export const SIDEBAR_WIDTH = 264;

export const sidebarTokens = {
  background: '#0F172A',
  border: '#1E293B',
  text: '#CBD5E1',
  textMuted: '#94A3B8',
  textActive: '#F8FAFC',
  activeBg: '#1E293B',
  accent: '#38BDF8',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    secondary: { main: '#0EA5E9' },
    success: { main: '#16A34A' },
    background: { default: '#F1F5F9', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#475569' },
    divider: '#E2E8F0',
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          border: '1px solid #E2E8F0',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
        },
      },
    },
  },
});

export default theme;
