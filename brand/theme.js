// The palette is chosen once, when the page loads. StyleSheet values are baked
// at import time, so switching theme saves the choice and reloads; the portal
// store persists progress, so nothing is lost on the way.
import { Platform } from 'react-native';

const KEY = 'amity-theme';

export const THEME = (() => {
  if (Platform.OS !== 'web') return 'light';
  try {
    // Light is the default; only an explicit choice of dark overrides it.
    return window.localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch (e) {
    return 'light';
  }
})();

export function setTheme(next) {
  if (Platform.OS !== 'web' || next === THEME) return;
  try {
    window.localStorage.setItem(KEY, next);
  } catch (e) {
    /* theme just won't persist */
  }
  // A short fade so the swap reads as a change of mood, not a flash.
  document.body.style.transition = 'opacity 140ms cubic-bezier(0.23, 1, 0.32, 1)';
  document.body.style.opacity = '0';
  setTimeout(() => window.location.reload(), 160);
}
