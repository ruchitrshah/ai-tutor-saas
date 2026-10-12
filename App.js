import React from 'react';
import { Platform, View } from 'react-native';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Colors, FontAssets } from './brand';
import { PortalProvider, usePortal } from './store/portal';
import { DetailsModal } from './screens/Details';
import Homework from './screens/Homework';
import Login from './screens/Login';
import Subject from './screens/Subject';
import Task from './screens/Task';
import { AboutModal } from './screens/About';
import Revisions from './screens/Revisions';
import Practice from './screens/Practice';
import Material from './screens/Material';
import Challenge from './screens/Challenge';
import ExamIntro from './screens/ExamIntro';
import Exam from './screens/Exam';
import { Profile, Report } from './screens/Simple';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.title = 'AI Tutor';
  // Geist Mono for the code lab (falls back to the system monospace if it cannot load).
  const mono = document.createElement('link');
  mono.rel = 'stylesheet';
  mono.href = 'https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&display=swap';
  document.head.appendChild(mono);
  const style = document.createElement('style');
  style.textContent = `
    html, body, #root { background: ${Colors.surface.page}; height: 100%; }
    body { -webkit-font-smoothing: antialiased; }
    /* Scrolling works; the bars themselves stay out of the way. */
    * { scrollbar-width: none; -ms-overflow-style: none; }
    *::-webkit-scrollbar { display: none; width: 0; height: 0; }
    /* Hover and focus on every control fade in the same way: colour only, one curve.
       (Transforms are left out: presses are driven by Animated and must not lag.) */
    button, [role="button"], [role="tab"], [role="radio"], [role="option"], [role="checkbox"] {
      transition: background-color 160ms cubic-bezier(0.23, 1, 0.32, 1), border-color 160ms cubic-bezier(0.23, 1, 0.32, 1), color 160ms cubic-bezier(0.23, 1, 0.32, 1), opacity 160ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    /* Things you can drag show a grab hand, and a closed hand while held. */
    [draggable="true"], [draggable="true"] * { cursor: grab !important; }
    [draggable="true"]:active, [draggable="true"]:active * { cursor: grabbing !important; }
    :focus-visible { outline: 3px solid ${Colors.brand.primary}; outline-offset: 2px; }
    textarea:focus-visible, input:focus-visible { outline: none; }
  `;
  document.head.appendChild(style);
}

const SCREENS = {
  login: Login,
  homework: Homework,
  subject: Subject,
  task: Task,
  practice: Practice,
  uploads: Material,
  revisions: Revisions,
  challenge: Challenge,
  examIntro: ExamIntro,
  exam: Exam,
  profile: Profile,
  report: Report,
};

// The browser-tab icon: a blue disc with a white spark, set once from an inline SVG.
function Favicon() {
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='32' r='32' fill='#1CB0F6'/><path d='M32 14l4.6 13.4L50 32l-13.4 4.6L32 50l-4.6-13.4L14 32l13.4-4.6z' fill='#fff'/></svg>";
    let link = document.querySelector('link[rel="icon"]');
    if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
    link.type = 'image/svg+xml';
    link.href = 'data:image/svg+xml,' + encodeURIComponent(svg);
  }, []);
  return null;
}

function Router() {
  const { route, signedIn } = usePortal();
  const Screen = signedIn ? SCREENS[route.name] || Homework : Login;
  return (
    <>
      <Screen />
      <Favicon />
      <DetailsModal />
      <AboutModal />
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts(FontAssets);
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: Colors.surface.page }} />;
  return (
    <SafeAreaProvider style={{ backgroundColor: Colors.surface.page }}>
      <StatusBar style={Colors.mode === 'dark' ? 'light' : 'dark'} />
      <PortalProvider>
        <Router />
      </PortalProvider>
    </SafeAreaProvider>
  );
}
