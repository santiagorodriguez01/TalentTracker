import { extendTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = extendTheme({
  cssVarPrefix: 'm3',
  colorSchemeSelector: 'data',
  colorSchemes: {
    light: {
      palette: {
        // Marca y acciones (Light) - Verde protagonista
        primary:   { main: '#2FA64A', contrastText: '#FFFFFF' }, // Texto blanco sobre verde
        secondary: { main: '#2FA64A', contrastText: '#FFFFFF' },
        success:   { main: '#2FA64A' },
        warning:   { main: '#F6D94E', contrastText: '#0C0C0C' },

        // Fondos, texto y divisores
        background: { default: '#F7F7F7', paper: '#FFFFFF' },
        text: { primary: '#0C0C0C', secondary: '#4D4D4D' },
        divider: '#E0E0E0'
      }
    },
    dark:  {
      palette: {
        // Marca y acciones (Dark) - Naranja protagonista
        primary:   { main: '#FFA37E', contrastText: '#FFFFFF' }, // Texto blanco sobre naranja
        secondary: { main: '#7BD28F', contrastText: '#FFFFFF' },
        success:   { main: '#2FA64A' },
        warning:   { main: '#F6D94E', contrastText: '#0C0C0C' },

        // Fondos, texto y divisores
        background: { default: '#0C0C0C', paper: '#1A1A1A' },
        text: { primary: '#F7F7F7', secondary: '#BDBDBD' },
        divider: '#3A3A3A'
      }
    }
  },
  shape: { borderRadius: 12 },
  typography: { button: { textTransform: 'none', fontWeight: 600 } },
  components: {
    MuiButton: {
      defaultProps: { size: 'small', variant: 'contained' },
      styleOverrides: { root: { borderRadius: 10, fontWeight: 600 } }
    },
    MuiTextField: {
      defaultProps: { size: 'small' }
    },
    MuiIconButton: {
      defaultProps: { color: 'primary', size: 'small' }
    },
    MuiAppBar: {
      defaultProps: { color: 'default' },
      styleOverrides: { root: { borderRadius: 0 } }
    },
    MuiPaper:  { styleOverrides: { root: { borderRadius: 16 } } },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: 'var(--m3-palette-background-default)',
          color: 'var(--m3-palette-text-primary)'
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars ? theme.vars.palette.background.paper : theme.palette.background.paper,
          color: theme.vars ? theme.vars.palette.text.primary : theme.palette.text.primary,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.vars ? theme.vars.palette.divider : theme.palette.divider
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.vars ? theme.vars.palette.text.secondary : theme.palette.text.secondary
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: theme.vars ? theme.vars.palette.primary.main : theme.palette.primary.main,
            borderWidth: 2
          },
          '& input::placeholder': {
            color: theme.vars ? theme.vars.palette.text.secondary : theme.palette.text.secondary
          }
        })
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: ({ theme }) => ({
          color: theme.vars ? theme.vars.palette.text.secondary : theme.palette.text.secondary,
          '&.Mui-focused': {
            color: theme.vars ? theme.vars.palette.primary.main : theme.palette.primary.main
          }
        })
      }
    }
  }
});
theme = responsiveFontSizes(theme);
export default theme;
