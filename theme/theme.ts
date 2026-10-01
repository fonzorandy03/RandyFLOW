'use client'

import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#3e54d3', contrastText: '#ffffff' },
        success: { main: '#12976f' },
        warning: { main: '#c77f06' },
        error: { main: '#d14343' },
        text: { primary: '#111318', secondary: '#6a6f7d' },
        divider: '#e6e7ec',
        background: { default: '#f5f6fa', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#7d8cff', contrastText: '#0b0c0f' },
        success: { main: '#34c99a' },
        warning: { main: '#f0b44a' },
        error: { main: '#ef6b6b' },
        text: { primary: '#ecedf1', secondary: '#a0aabb' },
        divider: '#2b3344',
        background: { default: '#10141e', paper: '#181d29' },
      },
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'var(--font-geist), ui-sans-serif, system-ui, sans-serif',
    button: { textTransform: 'none', fontWeight: 500, letterSpacing: 0 },
  },
  components: {
    MuiButtonBase: { defaultProps: { disableRipple: true } },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          transition: 'background-color 150ms, border-color 150ms, color 150ms, transform 150ms',
        },
        sizeLarge: { padding: '10px 20px', fontSize: '0.9375rem' },
      },
    },
    MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
    MuiTooltip: {
      defaultProps: { arrow: false, enterDelay: 300 },
      styleOverrides: {
        tooltip: ({ theme }) => ({
          backgroundColor: '#111318',
          color: '#f1f2f5',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 10px',
          borderRadius: 6,
          ...theme.applyStyles('dark', { backgroundColor: '#ecedf1', color: '#111318' }),
        }),
      },
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiDialog: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 16,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: '0 24px 64px -16px rgba(17,19,24,0.25)',
        }),
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: { backgroundColor: 'rgba(11,12,15,0.35)', backdropFilter: 'blur(2px)' },
        invisible: { backgroundColor: 'transparent', backdropFilter: 'none' },
      },
    },
    MuiDrawer: {
      styleOverrides: { paper: ({ theme }) => ({ borderColor: theme.vars.palette.divider }) },
    },
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: '0 12px 32px -12px rgba(17,19,24,0.18)',
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRadius: 12,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: '0 12px 32px -12px rgba(17,19,24,0.18)',
        }),
        list: { padding: 4 },
      },
    },
    MuiMenuItem: {
      styleOverrides: { root: { borderRadius: 6, fontSize: '0.875rem', minHeight: 36, gap: 10 } },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: ({ theme }) => ({
          height: 6,
          borderRadius: 999,
          backgroundColor: theme.vars.palette.divider,
        }),
        bar: { borderRadius: 999, transition: 'transform 600ms cubic-bezier(0.22, 1, 0.36, 1)' },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: 'wave' },
      styleOverrides: { root: { borderRadius: 8 } },
    },
    MuiSwitch: {
      styleOverrides: {
        root: { padding: 8 },
        track: { borderRadius: 999 },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.8125rem',
          padding: '5px 12px',
          border: 'none',
          borderRadius: '7px !important',
        },
      },
    },
    MuiSnackbarContent: {
      styleOverrides: { root: { borderRadius: 10, fontSize: '0.875rem' } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: '0.9375rem' },
      },
    },
  },
})
