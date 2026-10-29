// Plain-language help shown in the "About this page" side panel and tooltips.
export type HelpEntry = { title: string; what: string; steps: string[]; tip?: string };

export const HELP: Record<string, HelpEntry> = {
  dashboard: {
    title: 'Dashboard',
    what: "A quick snapshot of how things are going today. Start here every day.",
    steps: ['Check the four numbers at the top for the week at a glance.', "Tick off today's routines in the Today card.", 'Tap “Log episode” whenever something happens – it takes under a minute.'],
    tip: 'Logging right after an episode gives the most accurate patterns later.',
  },
  clinic: {
    title: 'Caseload',
    what: 'All the children you support. Pick one to view their data across every page.',
    steps: ['Select a child from the list.', 'Switch pages from the menu to see their episodes, routines and notes.', 'Use the Care team page to leave notes for parents.'],
  },
  profile: {
    title: 'Profile',
    what: "Everything about your child in one place – likes, dislikes, sensory needs and what helps them calm.",
    steps: ['Fill in what you know; you can edit any time.', 'Therapists and teachers see this so they support your child the same way.'],
    tip: 'The more specific you are (“hates hand dryers”), the better the AI insights get.',
  },
  logger: {
    title: 'Episodes',
    what: 'A diary of difficult moments – what happened, what led up to it and what helped.',
    steps: ['Tap “Log episode” and answer the short steps.', 'Skip anything you are unsure about.', 'Open an entry to see details or notes.'],
    tip: 'No judgement – this is just information to help spot patterns.',
  },
  routines: {
    title: 'Routines',
    what: 'Daily step-by-step plans (morning, school, bedtime) your child can follow.',
    steps: ['Open a routine to see its steps.', 'Tick steps as they are done.', 'Edit or add routines from the same page.'],
    tip: 'Visual, predictable routines reduce stress for many children.',
  },
  insights: {
    title: 'Patterns',
    what: 'Charts showing common triggers, places and times of day.',
    steps: ['Look for the tallest bars – those are the biggest triggers.', 'Compare weeks to see whether things are improving.'],
    tip: 'You need at least a few logged episodes before patterns appear.',
  },
  ai: {
    title: 'AI insights',
    what: 'Friendly suggestions written from your own logs.',
    steps: ['Read the summary at the top.', 'Try one suggestion at a time.', 'Log what happens so the next insight is better.'],
    tip: 'AI suggestions support – they never replace your therapist or doctor.',
  },
  activities: {
    title: 'Activities',
    what: 'Calming and skill-building activities picked for your child.',
    steps: ['Choose an activity.', 'Mark it done and note how it went.'],
  },
  learn: {
    title: 'Learn',
    what: 'Short, easy lessons for parents about autism and sensory support.',
    steps: ['Pick a module.', 'Read a chapter, then try the quick questions.', 'Your progress is saved automatically.'],
  },
  teach: {
    title: 'Teach',
    what: 'Ready-to-use lessons you can do with your child at home.',
    steps: ['Choose a lesson.', 'Follow the simple steps.', 'Download the printable PDF if you like.'],
  },
  therapist: {
    title: 'Care team',
    what: 'Who can see your child’s information, plus shared notes between parents and therapists.',
    steps: ['Write a note and press Add.', 'Therapists can mark notes private.', 'Use the contacts to call or email the team.'],
  },
};

export const TOUR = [
  { emoji: '👋', title: 'Welcome to NeuroAI', body: 'A calm place to track your child’s day, spot patterns and get support from your care team.' },
  { emoji: '📝', title: 'Log in under a minute', body: 'Tap the green “Log episode” button whenever something happens. Every question can be skipped.' },
  { emoji: '🧭', title: 'Everything is on the left', body: 'The menu is grouped into Care, Grow and People. On a phone, use the bar at the bottom.' },
  { emoji: '💡', title: 'Help is always close', body: 'Look for the “?” button on every page for a quick guide. The sparkle button opens the assistant.' },
];
