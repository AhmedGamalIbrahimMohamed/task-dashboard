import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const AppTheme = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#1e88e5',
      500: '#1976d2',
      600: '#1565c0',
      700: '#0d47a1',
      800: '#0b3c87',
      900: '#08306b',
      950: '#05204a',
    },
  },
});
