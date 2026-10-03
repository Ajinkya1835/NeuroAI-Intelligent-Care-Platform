export type Question = { id: string; q: string; options: string[] };
export type Source = { label: string; url: string };
export type Lesson = {
  id: string; title: string; minutes: number; body: string; takeaway?: string;
  image?: string; sources?: Source[]; questions: Question[];
};
export type Chapter = { id: string; title: string; summary?: string; subchapters: Lesson[]; quiz: Question[] };
export type Module = {
  slug: string; title: string; level?: string; summary?: string;
  outcomes?: string[]; keyTakeaways?: string[]; chapters: Chapter[];
};
export type NextUp = { kind: 'lesson' | 'quiz'; chapterId: string; id: string; title: string };
export type ModuleProgress = {
  percent: number; minutesLeft: number; nextUp: NextUp | null;
  lessonsDone: number; lessonsTotal: number; quizzesDone: number; quizzesTotal: number;
  completedLessons: string[];
  lessonResults: Record<string, { correct: number; total: number }>;
  quizResults: Record<string, { best: number; last: number; total: number; attempts: number }>;
};
export type OverviewModule = {
  slug: string; title: string; level?: string; summary?: string; percent: number;
  minutesLeft: number; status: 'not_started' | 'in_progress' | 'completed'; nextUp: NextUp | null;
};
export type Overview = {
  modules: OverviewModule[];
  continue: (NextUp & { moduleSlug: string; moduleTitle: string }) | null;
  stats: {
    percent: number; lessonsDone: number; lessonsTotal: number; quizzesDone: number; quizzesTotal: number;
    minutesLeft: number; accuracy: number | null; streak: number;
  };
};
export type QResult = { id: string; choice: number; correct: boolean; correctIndex: number; explanation: string };
export type SubmitResult = { results: QResult[]; correct: number; total: number; mastered: boolean; progress: ModuleProgress };