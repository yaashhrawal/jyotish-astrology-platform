import { create } from 'zustand';
import { Appearance } from 'react-native';
import { palettes, Colors, ThemeName } from '../theme/theme';

interface ThemeState {
  name: ThemeName;
  setTheme: (n: ThemeName) => void;
  toggle: () => void;
}

const initial: ThemeName = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';

export const useThemeStore = create<ThemeState>((set, get) => ({
  name: initial,
  setTheme: (name) => set({ name }),
  toggle: () => set({ name: get().name === 'dark' ? 'light' : 'dark' }),
}));

/** Semantic color tokens for the active theme. Read colors ONLY through this. */
export function useColors(): Colors {
  return palettes[useThemeStore((s) => s.name)];
}
