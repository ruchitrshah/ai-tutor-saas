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
import Mascot from './ui/Mascot';
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

// The browser-tab icon is the tutor the student picked. A hidden copy of the mascot is
// drawn, its SVG is read back, and it becomes the favicon, so it follows their choice.
function Favicon() {
  const { mascot } = usePortal();
  const holder = React.useRef(null);
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    const t = setTimeout(() => {
      const svg = holder.current && holder.current.querySelector && holder.current.querySelector('svg');
      if (!svg) return;
      const clone = svg.cloneNode(true);
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clone.setAttribute('viewBox', '8 -6 104 104'); // square, character rising from the bottom
      clone.setAttribute('width', '64');
      clone.setAttribute('height', '64');
      const href = 'data:image/svg+xml,' + encodeURIComponent(new XMLSerializer().serializeToString(clone));
      let link = document.querySelector('link[rel="icon"]');
      if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
      link.type = 'image/svg+xml';
      link.href = href;
    }, 60);
    return () => clearTimeout(t);
  }, [mascot]);
  if (Platform.OS !== 'web') return null;
  return (
    <View ref={holder} pointerEvents="none" style={{ position: 'absolute', left: -9999, top: 0, width: 64, height: 64, opacity: 0 }}>
      <Mascot head size={64} kind={mascot} />
    </View>
  );
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
