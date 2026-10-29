import styles from "./dashboard.module.css";

type Child = {
  name: string;
  age: number;
};

type EventItem = {
  id: number;
  title: string;
  ts: string;
  details: string;
};

type Routine = {
  id: number;
  title: string;
  completed: boolean;
};

type Activity = {
  id: number;
  name: string;
};

type AppLayoutProps = {
  child: Child;
  events: EventItem[];
  routines: Routine[];
  activities: Activity[];
};

function AppLayout({ child, events, routines, activities }: AppLayoutProps) {
  return (
    <div className={styles.appLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>NeuroAI</div>
        <nav className={styles.navigation} aria-label="Dashboard navigation">
          <a className={styles.activeLink} href="#dashboard">Dashboard</a>
          <a href="#timeline">Timeline</a>
          <a href="#patterns">Patterns</a>
          <a href="#goals">Goals &amp; Routines</a>
          <a href="#team">Care Team</a>
        </nav>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.header}>
          <div className={styles.childHeading}>
            <span>{child.name}</span>
            <span className={styles.muted}>({child.age} yrs)</span>
          </div>
          <button className={styles.quickLog} type="button">+ Quick Log</button>
        </header>

        <div className={styles.contentBody}>
          <section className={styles.feedSection} aria-labelledby="activity-feed-title">
            <h1 id="activity-feed-title">Activity Feed</h1>
            <div className={styles.feedList}>
              {events.map((event) => (
                <article className={styles.event} key={event.id}>
                  <div className={styles.eventHeader}>
                    <span className={styles.eventTitle}>{event.title}</span>
                    <time className={styles.timestamp}>{event.ts}</time>
                  </div>
                  <p>{event.details}</p>
                </article>
              ))}
            </div>
          </section>

          <aside className={styles.widgets}>
            <section className={styles.widget} aria-labelledby="routines-title">
              <h2 id="routines-title">Today&apos;s Routines</h2>
              <ul>
                {routines.map((routine) => (
                  <li key={routine.id}>
                    <input id={`routine-${routine.id}`} type="checkbox" defaultChecked={routine.completed} />
                    <label htmlFor={`routine-${routine.id}`}>{routine.title}</label>
                  </li>
                ))}
              </ul>
            </section>

            <section className={styles.widget} aria-labelledby="activities-title">
              <h2 id="activities-title">Suggested Activities</h2>
              <ul className={styles.activityList}>
                {activities.map((activity) => (
                  <li key={activity.id}>
                    <a href={`#activity-${activity.id}`}>{activity.name}</a>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

const dashboardData: AppLayoutProps = {
  child: { name: "Maya", age: 7 },
  events: [
    { id: 1, title: "Morning routine completed", ts: "Today, 8:15 AM", details: "Breakfast and getting ready went smoothly." },
    { id: 2, title: "Sensory break logged", ts: "Yesterday, 3:40 PM", details: "Maya used the quiet corner for ten minutes after school." },
    { id: 3, title: "New progress note", ts: "Yesterday, 11:20 AM", details: "Used a visual cue to transition between activities." },
  ],
  routines: [
    { id: 1, title: "Morning routine", completed: true },
    { id: 2, title: "Movement break", completed: false },
    { id: 3, title: "Bedtime wind-down", completed: false },
  ],
  activities: [
    { id: 1, name: "Sort by color" },
    { id: 2, name: "Breathing with bubbles" },
    { id: 3, name: "Build a quiet reading nook" },
  ],
};

export default function DashboardPage() {
  return <AppLayout {...dashboardData} />;
}
