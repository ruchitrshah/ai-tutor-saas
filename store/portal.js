// Frontend-only state: routing, which tasks are done, and the running tally the
// "how you're doing" rail reads from. A real backend would replace this
// module's setters with calls; the screens would not change.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import { SEED_DONE, SEED_SKILLS, SEED_STATS, SKILL_OF, SUBJECTS } from '../data/courses';

const Ctx = createContext(null);
export const usePortal = () => useContext(Ctx);

export const USER = { name: 'Aarav Mehta', program: 'MBA Semester 1', email: 'aarav.mehta@s.amity.edu' };

// Progress survives a reload (the theme switch reloads the page). Web only.
const SAVE_KEY = 'amity-portal-v1';
function load() {
  if (Platform.OS !== 'web') return {};
  try {
    return JSON.parse(window.localStorage.getItem(SAVE_KEY)) || {};
  } catch (e) {
    return {};
  }
}

export function PortalProvider({ children }) {
  const saved = useMemo(load, []);
  const [route, setRoute] = useState(saved.signedIn ? saved.route || { name: 'homework' } : { name: 'login' });
  const [signedIn, setSignedIn] = useState(!!saved.signedIn);
  const [done, setDone] = useState(saved.done || SEED_DONE);
  const [stats, setStats] = useState(saved.stats || SEED_STATS);
  const [lang, setLang] = useState(saved.lang || 'en'); // 'en' | 'hi' (Hinglish)
  const [skills, setSkills] = useState(saved.skills || SEED_SKILLS);
  const [mascot, setMascot] = useState(saved.mascot || 'cactus');
  // Mistakes from finished exams, kept as extra groups for the Revisions page.
  const [examRevs, setExamRevs] = useState(saved.examRevs || []);
  // Every finished exam, by subject, so a card can say "attempt 2" and show the best score.
  const [examAttempts, setExamAttempts] = useState(saved.examAttempts || {});
  const addExamAttempt = useCallback((id, score, secondsUsed) => setExamAttempts((m) => ({ ...m, [id]: [...(m[id] || []), { score, secondsUsed, at: Date.now() }] })), []);
  const addExamRevisions = useCallback((group) => setExamRevs((g) => [group, ...g].slice(0, 12)), []);
  // Course details is a modal over whatever screen you are on, not a route.
  const [detailsId, setDetailsId] = useState(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const openAbout = useCallback(() => setAboutOpen(true), []);
  const closeAbout = useCallback(() => setAboutOpen(false), []);
  const openDetails = useCallback((id) => setDetailsId(id), []);
  const closeDetails = useCallback(() => setDetailsId(null), []);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify({ signedIn, route, done, stats, lang, skills, mascot, examRevs, examAttempts }));
    } catch (e) {
      /* private mode: progress just won't survive a reload */
    }
  }, [signedIn, route, done, stats, lang, skills, mascot, examRevs, examAttempts]);

  const go = useCallback((name, params = {}) => setRoute({ name, ...params }), []);

  const signIn = useCallback(() => {
    setSignedIn(true);
    setRoute({ name: 'homework' });
  }, []);
  const signOut = useCallback(() => {
    setSignedIn(false);
    setRoute({ name: 'login' });
  }, []);

  const completeTask = useCallback((id, kind) => {
    setDone((d) => ({ ...d, [id]: true }));
    const skill = SKILL_OF[kind];
    if (skill) setSkills((k) => ({ ...k, [skill]: Math.min(1, k[skill] + 0.15) }));
  }, []);

  const recordAnswer = useCallback((topic, { firstTry, usedHint }) => {
    setStats((s) => {
      const t = s.topics[topic] || { right: 0, miss: 0 };
      return {
        ...s,
        answered: s.answered + 1,
        breakthroughs: s.breakthroughs + (usedHint && !firstTry ? 1 : 0),
        topics: {
          ...s.topics,
          [topic]: { right: t.right + (firstTry ? 1 : 0), miss: t.miss + (firstTry ? 0 : 1) },
        },
      };
    });
  }, []);
  const recordHint = useCallback(() => setStats((s) => ({ ...s, hints: s.hints + 1 })), []);
  const recordAnswerRequest = useCallback(
    () => setStats((s) => ({ ...s, answerRequests: s.answerRequests + 1 })),
    []
  );

  const value = useMemo(
    () => ({
      route, go, signedIn, signIn, signOut, user: USER,
      done, completeTask, stats, recordAnswer, recordHint, recordAnswerRequest,
      lang, setLang, skills, mascot, setMascot, examRevs, addExamRevisions, examAttempts, addExamAttempt, detailsId, openDetails, closeDetails, aboutOpen, openAbout, closeAbout,
    }),
    [route, go, signedIn, signIn, signOut, done, completeTask, stats, recordAnswer, recordHint, recordAnswerRequest, lang, skills, mascot, examRevs, addExamRevisions, examAttempts, addExamAttempt, detailsId, openDetails, closeDetails, aboutOpen, openAbout, closeAbout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ── Derived views ────────────────────────────────────────────────────────────

export function subjectProgress(subject, done) {
  const total = subject.tasks.length;
  const count = subject.tasks.filter((t) => done[t.id]).length;
  const next = subject.tasks.find((t) => !done[t.id]) || null;
  return { total, count, next, complete: count === total };
}

// The tutor's read of the student. Strong = few misses, needs work = many.
export function tutorRead(stats) {
  const rows = Object.entries(stats.topics).map(([topic, v]) => ({
    topic,
    n: v.right + v.miss,
    missRate: v.right + v.miss ? v.miss / (v.right + v.miss) : 0,
  }));
  const strong = rows.filter((r) => r.n >= 2 && r.missRate <= 0.25).map((r) => r.topic);
  const weak = rows.filter((r) => r.n >= 2 && r.missRate >= 0.5).map((r) => r.topic);
  const hintsPer = stats.answered ? (stats.hints / stats.answered).toFixed(1) : '0';
  return { strong, weak, hintsPer, breakthroughs: stats.breakthroughs, answerRequests: stats.answerRequests };
}

export { SUBJECTS };
