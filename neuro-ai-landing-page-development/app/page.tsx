"use client";

import { useState } from "react";
import {
  Activity,
  ArrowDown,
  ArrowRight,
  Brain,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock3,
  Eye,
  HeartHandshake,
  HelpCircle,
  Lightbulb,
  LockKeyhole,
  Menu,
  MessageCircle,
  Moon,
  PhoneCall,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const logoImage =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/neuroAI_logo-h3ICxnPXrHp68C1dPUgsRCjgNSMXlS.png";

const images = {
  hero: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hero-bg-PLFhh5y4c7DXk6IyUU6Ky218HQcGra.jpg",
  sensory:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sensory-activity-E20a8XysMJJzn2dozgCs7NdZuHT4fC.png",
  spectrum:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/autism-spectrum-axMNMp2Ms35FPRZSJQ7fPQ9cg2W12I.jpg",
  therapist:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/therapist-parent-tablet-6frc3i3RslwkwCJPfEJVdyelv5lkOq.png",
  calm: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/calm-corner-75XTk9pKWBsgJMqaUYN4PlDWVGtFDN.png",
  dashboard:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/dashboard-kMyAcu15gWr2Yl9xrGybGhbfF12Beh.jpeg",
  caseload:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/therapist-caseload-pwsaucswAtGX6bJ53GrYZnOyfTXdrp.jpeg",
  patterns:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/patterns-p134H4S6hurCIYTgfD8sBvyKwMw24f.jpeg",
  profile:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/child%20profile-4Q2ritpVfaM4jPlGcAQQMtCNwRaVyZ.jpeg",
  insights:
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/AI%20insights-j0pgCs4UtO2hKjkOnaYAs8OuDtTBM5.jpeg",
};

const nav = [
  ["What it is", "what"],
  ["Understanding Autism", "understanding-autism"],
  ["How it works", "day"],
  ["Product tour", "product-tour"],
  ["Features", "features"],
  ["Safety", "safety"],
  ["Evidence", "evidence"],
  ["FAQ", "faq"],
];
const features = [
  [
    "Dashboard",
    "One calm home base",
    "A live snapshot of episodes, routines, learning, progress and what needs attention.",
    "dashboard",
    Activity,
  ],
  [
    "Episode logger",
    "Capture the whole picture",
    "A guided Before → During → After flow makes a difficult moment easier to record while it is fresh.",
    "logger",
    ClipboardList,
  ],
  [
    "Routines",
    "Make the day more predictable",
    "Build visual routines, tick them off and see adherence before small slips become patterns.",
    "routines",
    CheckCircle2,
  ],
  [
    "Patterns",
    "See what the data is saying",
    "Connect time, place, sleep, hunger, triggers and strategies across 7 to 365 days.",
    "patterns",
    Eye,
  ],
  [
    "AI insights",
    "Kind, specific guidance",
    "A rule-based engine finds signals, then AI turns your own logs into a plain-language report.",
    "insights",
    Sparkles,
  ],
  [
    "Activities",
    "Practise skills together",
    "Find short calming and developmental activities with a fit score for Peter.",
    "activities",
    Play,
  ],
  [
    "Child profile",
    "One shared snapshot",
    "Episodes, routines, goals, notes, worksheet results and milestones in one living profile.",
    "profile",
    Users,
  ],
  [
    "Learn + Teach",
    "Build understanding at home",
    "Gentle parent lessons and printable, scored worksheets for ages 3–6.",
    "learn",
    Brain,
  ],
  [
    "Therapist caseload",
    "Coordinate the care team",
    "Caseload cards, shared notes, private clinical notes, goals and progress in one view.",
    "caseload",
    HeartHandshake,
  ],
  [
    "SOS toolkit",
    "A calmer next step",
    "A persistent calm panel with de-escalation reminders and an emergency call shortcut.",
    "sos",
    PhoneCall,
  ],
];

function Logo() {
  return (
    <a href="#top" className="logo" aria-label="NeuroAI home">
      <img
        src={logoImage}
        alt="NeuroAI — Smarter Support for Brighter Tomorrows"
      />
    </a>
  );
}
function SectionTitle({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="section-title">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
function Pill({
  children,
  tone = "",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  return <span className={`pill ${tone}`}>{children}</span>;
}
function Stat({
  label,
  value,
  note,
  tone = "",
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong className={tone}>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
function Window({
  title,
  children,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className={`app-window ${wide ? "wide" : ""}`}>
      <div className="window-bar">
        <span className="window-dots">
          <i />
          <i />
          <i />
        </span>
        <span className="window-title">{title}</span>
        <span className="window-user">PM</span>
      </div>
      {children}
    </div>
  );
}
function MiniNav() {
  return (
    <div className="mini-nav">
      <img src={logoImage} alt="NeuroAI" />
      <span>Dashboard</span>
      <span>Episodes</span>
      <span>Routines</span>
      <span>Learn</span>
      <span>Profile</span>
    </div>
  );
}
function DashboardMockup() {
  return (
    <Window title="Parent dashboard">
      <MiniNav />
      <div className="mock-body">
        <div className="mock-head">
          <div>
            <small>Tuesday, 17 June</small>
            <h4>Good morning, May</h4>
          </div>
          <Pill tone="green">Peter is doing well</Pill>
        </div>
        <div className="stats">
          <Stat
            label="Episodes this week"
            value="3"
            note="↓ 2 from last week"
            tone="good"
          />
          <Stat
            label="Average intensity"
            value="2.8 / 5"
            note="↓ 0.6 this period"
          />
          <Stat
            label="Top trigger"
            value="Loud noise"
            note="4 logged episodes"
          />
          <Stat
            label="Routines today"
            value="80%"
            note="4 of 5 complete"
            tone="good"
          />
        </div>
        <div className="mock-grid">
          <div className="mock-card">
            <b>Today&apos;s routines</b>
            <label>
              <CheckCircle2 /> Morning visual schedule <em>Done</em>
            </label>
            <label>
              <CheckCircle2 /> Headphones at recess <em>Done</em>
            </label>
            <label className="pending">
              <Clock3 /> Quiet time before dinner <em>Next</em>
            </label>
          </div>
          <div className="mock-card insight">
            <span className="spark">
              <Sparkles />
            </span>
            <b>Pattern insight</b>
            <p>
              Episodes are shorter on days Peter sleeps 7+ hours. Try the quiet
              room before lunch.
            </p>
            <a href="#insights">
              View report <ArrowRight />
            </a>
          </div>
        </div>
      </div>
    </Window>
  );
}
function LoopDiagram() {
  return (
    <div className="loop">
      <div className="loop-line" />
      <div>
        <span>01</span>
        <b>Observe</b>
        <small>Log episodes, routines, notes</small>
      </div>
      <ArrowRight />
      <div>
        <span>02</span>
        <b>Understand</b>
        <small>Find patterns + insights</small>
      </div>
      <ArrowRight />
      <div>
        <span>03</span>
        <b>Act</b>
        <small>Try strategies + goals</small>
      </div>
      <ArrowRight />
      <div>
        <span>04</span>
        <b>Track</b>
        <small>See progress over time</small>
      </div>
    </div>
  );
}
function LoggerMockup() {
  return (
    <Window title="Log an episode">
      <div className="mock-body">
        <div className="stepper">
          <b>1 Before</b>
          <span>2 During</span>
          <span>3 After</span>
        </div>
        <h4>What was happening before?</h4>
        <div className="field-grid">
          <div>
            <small>Location</small>
            <b>Lunchroom</b>
          </div>
          <div>
            <small>Activity</small>
            <b>Mealtime</b>
          </div>
          <div>
            <small>Trigger</small>
            <b>Loud noise</b>
          </div>
          <div>
            <small>Sleep</small>
            <b>6.5 hours</b>
          </div>
        </div>
        <div className="choice-row">
          <small>Sensory environment</small>
          <Pill>Bright lights</Pill>
          <Pill>Loud</Pill>
          <Pill>Busy</Pill>
        </div>
        <button className="mock-button">
          Continue to During <ArrowRight />
        </button>
        <p className="tiny">
          Usually takes less than a minute • You can edit or delete later
        </p>
      </div>
    </Window>
  );
}
function HeatmapMockup() {
  return (
    <Window title="Patterns · Last 30 days" wide>
      <div className="mock-body">
        <div className="mock-head">
          <div>
            <small>Episodes by weekday and time</small>
            <h4>Calmer days are lining up with routines</h4>
          </div>
          <Pill tone="green">7 calm days</Pill>
        </div>
        <div className="heat-grid">
          <span />
          <span>Morning</span>
          <span>Midday</span>
          <span>Afternoon</span>
          <span>Evening</span>
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
            <div className="heat-row" key={day}>
              <b>{day}</b>
              {[0, 1, 2, 3, 4].map((n) => (
                <i key={n} style={{ opacity: (((i + n) % 5) + 1) / 6 }} />
              ))}
            </div>
          ))}
        </div>
        <div className="rankings">
          <div>
            <small>Top trigger</small>
            <b>
              Loud noise <span>→ Quiet room worked best</span>
            </b>
          </div>
          <div>
            <small>Best recovery strategy</small>
            <b>
              Noise-cancelling headphones <span>18 min average</span>
            </b>
          </div>
          <div>
            <small>Routine adherence</small>
            <b>
              78% this week <span>+12% vs last period</span>
            </b>
          </div>
        </div>
      </div>
    </Window>
  );
}
function InsightsMockup() {
  return (
    <Window title="AI insights · Peter">
      <div className="mock-body report">
        <div className="report-banner">
          <Sparkles />
          <div>
            <b>Good data quality</b>
            <small>18 episodes • 23 routine check-ins • 30 days</small>
          </div>
        </div>
        <h4>This week vs last week</h4>
        <p>
          Peter had 3 episodes, down from 5. They were shorter and milder
          overall. Loud noise remains the clearest trigger.
        </p>
        <div className="report-columns">
          <div className="report-box green">
            <b>What&apos;s working</b>
            <label>
              <Check /> Headphones reduce intensity
            </label>
            <label>
              <Check /> 78% routine adherence
            </label>
          </div>
          <div className="report-box amber">
            <b>What to watch</b>
            <label>
              <Zap /> Sleep under 7 hours
            </label>
            <label>
              <Zap /> Mealtime changes
            </label>
          </div>
        </div>
        <div className="action-line">
          <b>This week</b>
          <span>☐ Offer headphones before lunch</span>
          <span>☐ Keep quiet room ready</span>
        </div>
        <small className="disclaimer">
          General guidance based on logged data. Not medical advice.
        </small>
      </div>
    </Window>
  );
}
function ChatMockup() {
  return (
    <Window title="Ask NeuroAI">
      <div className="chat">
        <div className="assistant">
          <Sparkles />
          <p>
            Hi May — I&apos;m here to help you make sense of Peter&apos;s logged
            data.
          </p>
        </div>
        <div className="question-row">
          <button>Top triggers?</button>
          <button>Pending routines?</button>
          <button>Latest episode?</button>
        </div>
        <div className="chat-input">
          Ask about Peter&apos;s patterns… <ArrowRight />
        </div>
      </div>
    </Window>
  );
}
function ProfileMockup() {
  return (
    <Window title="Peter's profile" wide>
      <div className="profile-head">
        <div className="avatar">P</div>
        <div>
          <h4>Peter · Age 7</h4>
          <p>Interests: trains, numbers • Therapist: Dr. Ajinkya</p>
        </div>
        <Pill tone="green">Improving</Pill>
      </div>
      <div className="tabs">
        <b>Overview</b>
        <span>Episodes</span>
        <span>Routines</span>
        <span>Goals & progress</span>
        <span>Notes & team</span>
      </div>
      <div className="profile-grid">
        <Stat label="Episodes / 30 days" value="18" note="↓ 22%" tone="good" />
        <Stat label="Routine adherence" value="78%" note="↑ 12%" />
        <Stat label="Goals reached" value="2 / 4" note="1 in progress" />
        <div className="mini-chart">
          <small>Average intensity</small>
          <div className="bars">
            {[45, 55, 38, 48, 31, 25, 28, 20].map((h, i) => (
              <i key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </Window>
  );
}

function FeatureMock({ type }: { type: string }) {
  if (type === "dashboard") return <DashboardMockup />;
  if (type === "logger") return <LoggerMockup />;
  if (type === "patterns") return <HeatmapMockup />;
  if (type === "insights") return <InsightsMockup />;
  if (type === "profile") return <ProfileMockup />;
  if (type === "activities")
    return (
      <Window title="Activities library">
        <div className="activity-list">
          <div>
            <span className="activity-icon">◌</span>
            <b>
              Bubble Breathing<small>Regulation · 5 min</small>
            </b>
            <Pill tone="green">92% fit</Pill>
          </div>
          <div>
            <span className="activity-icon">▦</span>
            <b>
              Train Track Counting<small>Early Math · 8 min</small>
            </b>
            <Pill>84% fit</Pill>
          </div>
          <div>
            <span className="activity-icon">◒</span>
            <b>
              Quiet Reading Nook<small>Focus · 10 min</small>
            </b>
            <Pill>78% fit</Pill>
          </div>
          <div>
            <span className="activity-icon">♡</span>
            <b>
              Feelings Cards<small>Emotions · 6 min</small>
            </b>
            <Pill>74% fit</Pill>
          </div>
        </div>
      </Window>
    );
  if (type === "sos")
    return (
      <Window title="Calm support">
        <div className="sos-panel">
          <div className="sos-icon">
            <HeartHandshake />
          </div>
          <h4>Start with less</h4>
          <p>Reduce stimulation. Dim lights and cut background noise.</p>
          <p>Use few, calm words. Offer deep pressure only if welcome.</p>
          <p>Stay close, then give Peter time to recover at his own pace.</p>
          <button className="call-button">
            <PhoneCall /> Call emergency services
          </button>
        </div>
      </Window>
    );
  if (type === "learn")
    return (
      <Window title="Learn · Understanding autism">
        <div className="learn-card">
          <img
            src={images.spectrum}
            alt="Illustrated explanation that autism is a spectrum and can affect communication, routines and sensory experiences differently"
          />
          <div>
            <Pill>Chapter 1 of 5</Pill>
            <h4>Every child is different</h4>
            <p>
              Autism is a spectrum. There is no single autistic experience —
              support should fit the child in front of you.
            </p>
            <button className="mock-button">
              Answer 2 questions <ArrowRight />
            </button>
          </div>
        </div>
      </Window>
    );
  if (type === "caseload")
    return (
      <Window title="Therapist caseload">
        <div className="caseload">
          <div className="case-row attention">
            <div className="avatar small">P</div>
            <b>
              Peter, 7<small>May · 3 episodes · 78% routines</small>
            </b>
            <Pill tone="amber">Intensity rising</Pill>
            <ArrowRight />
          </div>
          <div className="case-row">
            <div className="avatar small">A</div>
            <b>
              Amara, 5<small>Leila · 1 episode · 92% routines</small>
            </b>
            <Pill tone="green">Improving</Pill>
            <ArrowRight />
          </div>
          <div className="case-row">
            <div className="avatar small">L</div>
            <b>
              Leo, 6<small>Sam · 2 episodes · 81% routines</small>
            </b>
            <Pill>Steady</Pill>
            <ArrowRight />
          </div>
        </div>
      </Window>
    );
  return (
    <Window title="Routines · This week">
      <div className="mock-body">
        <div className="routine-line">
          <b>Morning Visual Schedule</b>
          <Pill tone="green">5 / 7 days</Pill>
        </div>
        <div className="week-dots">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i} className={i < 5 ? "done" : ""}>
              {i < 5 ? <Check /> : d}
            </span>
          ))}
        </div>
        <div className="routine-line">
          <b>Bedtime story & weighted blanket</b>
          <Pill tone="amber">Needs attention</Pill>
        </div>
        <div className="adherence">
          <strong>78%</strong>
          <span>weekly adherence</span>
          <div>
            <i />
          </div>
        </div>
      </div>
    </Window>
  );
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sosOpen, setSosOpen] = useState(false);
  return (
    <main id="top">
      <header className="site-header">
        <div className="container nav-inner">
          <Logo />
          <nav className={menuOpen ? "open" : ""}>
            {nav.map(([label, id]) => (
              <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <a href={`${APP_URL}/login`} className="nav-signin">
              Sign in
            </a>
          </nav>
          <a href="#day" className="nav-cta">
            See how it works <ArrowRight />
          </a>
          <button
            className="menu-button"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <Pill>
              <span className="status-dot" /> A calmer way to understand
              patterns
            </Pill>
            <h1>
              Understand your child. <em>Support them with confidence.</em>
            </h1>
            <p className="hero-lede">
              NeuroAI brings parents and therapists together to make sense of
              difficult moments, build supportive routines and celebrate
              progress — in one private, thoughtful place.
            </p>
            <div className="hero-actions">
              <a className="button primary" href={`${APP_URL}/login`}>
                Sign in <ArrowRight />
              </a>
              <a className="button secondary" href="#features">
                Explore features
              </a>
            </div>
            <div className="trust-strip">
              <span>
                <Users /> For parents
              </span>
              <span>
                <HeartHandshake /> For therapists
              </span>
              <span>
                <LockKeyhole /> Private & role-based
              </span>
              <span>
                <ShieldCheck /> Not a medical device
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              src={images.hero}
              alt="Parent lifting a laughing toddler outdoors in warm daylight"
            />
            <div className="floating-window">
              <div className="floating-top">
                <span>
                  <span className="status-dot" /> Live snapshot
                </span>
                <b>Peter · age 7</b>
              </div>
              <div className="floating-score">
                <strong>2.8</strong>
                <span>
                  avg intensity
                  <br />
                  <small>↓ 0.6 this period</small>
                </span>
              </div>
              <div className="sparkline">
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
                <i />
              </div>
              <p>
                <Sparkles /> Loud noise is Peter&apos;s top trigger. Headphones
                helped most this week.
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="definition section" id="what">
        <div className="container">
          <SectionTitle
            eyebrow="A clearer picture"
            title="From scattered moments to a shared understanding"
          >
            Parenting an autistic child can mean making sense of behaviour,
            emotion, communication and routines with information scattered
            across memory, notebooks, messages and therapy sessions.
          </SectionTitle>
          <div className="definition-grid">
            <div className="definition-copy">
              <div className="quote-mark">“</div>
              <h3>NeuroAI is a supportive platform that connects the dots.</h3>
              <p>
                You log what happened. NeuroAI helps you understand the
                patterns. Together, you choose a next step you can try and
                track.
              </p>
              <div className="definition-chips">
                <Pill>Parent-owned</Pill>
                <Pill>Therapist-connected</Pill>
                <Pill>Data-informed</Pill>
              </div>
            </div>
            <LoopDiagram />
          </div>
        </div>
      </section>
      <section className="roles section">
        <div className="container">
          <SectionTitle
            eyebrow="Two roles, one team"
            title="Built around the people who know the child best"
          >
            Each person gets their own sign-in and the right view of the same
            shared story.
          </SectionTitle>
          <div className="role-grid">
            <div className="role-card parent">
              <div className="role-icon">
                <HeartHandshake />
              </div>
              <Pill>Parent view</Pill>
              <h3>You know the everyday context.</h3>
              <p>
                Own Peter&apos;s profile, log episodes, follow routines, explore
                insights, learn about autism and practise skills together.
              </p>
              <ul>
                <li>
                  <Check /> Grant therapists access
                </li>
                <li>
                  <Check /> See every shared note
                </li>
                <li>
                  <Check /> Keep the whole picture in one place
                </li>
              </ul>
              <a href="#features">
                Explore the parent tools <ArrowRight />
              </a>
            </div>
            <div className="role-card therapist">
              <div className="role-icon">
                <Users />
              </div>
              <Pill>Therapist view</Pill>
              <h3>You bring clinical context.</h3>
              <p>
                Review your caseload, spot trends, set goals, record progress
                and share helpful notes — with private clinical notes kept
                private.
              </p>
              <ul>
                <li>
                  <Check /> See only granted children
                </li>
                <li>
                  <Check /> Add goals and milestones
                </li>
                <li>
                  <Check /> Keep private notes separate
                </li>
              </ul>
              <a href="#caseload">
                Explore the care team tools <ArrowRight />
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="understanding section" id="understanding-autism">
        <div className="container">
          <SectionTitle
            eyebrow="A plain-language guide"
            title="Understanding Autism"
          >
            Autism, also called autism spectrum disorder (ASD), is a
            developmental condition related to differences in brain development.
            It affects how a person communicates, interacts with others, and
            experiences the world. It is lifelong, and it looks different in
            every child.
          </SectionTitle>
          <div className="understanding-grid">
            <div className="understanding-card spectrum-card">
              <Pill>Why “spectrum”?</Pill>
              <h3>There is no single autistic experience.</h3>
              <p>
                Autistic people vary widely in strengths, abilities and support
                needs. These can change over time and across settings.
              </p>
              <div className="spectrum-band">
                <span>Communication</span>
                <span>Sensory experience</span>
                <span>Interests</span>
                <span>Support needs</span>
              </div>
            </div>
            <div className="understanding-card">
              <Pill>Common areas</Pill>
              <div className="area-grid">
                <div>
                  <Users />
                  <b>Social communication</b>
                  <span>Interaction and connection</span>
                </div>
                <div>
                  <Activity />
                  <b>Focused interests</b>
                  <span>Repetition and deep focus</span>
                </div>
                <div>
                  <Eye />
                  <b>Sensory differences</b>
                  <span>Sound, light, touch and movement</span>
                </div>
                <div>
                  <ArrowRight />
                  <b>Change and transitions</b>
                  <span>Predictability can help</span>
                </div>
                <div>
                  <HeartHandshake />
                  <b>Emotional regulation</b>
                  <span>Big feelings need support</span>
                </div>
              </div>
            </div>
          </div>
          <div className="support-levels">
            <h3>Three support levels</h3>
            <p className="support-intro">
              DSM-5 levels describe the support a person needs, not their worth
              or potential. They can change with age and environment, and are
              decided by a qualified professional, not by an app.
            </p>
            <div className="level-grid">
              <div>
                <span>Level 1</span>
                <b>Requiring support</b>
                <p>
                  Can speak in full sentences, but may struggle with
                  back-and-forth conversation, flexibility and organisation.
                </p>
              </div>
              <div>
                <span>Level 2</span>
                <b>Requiring substantial support</b>
                <p>
                  Clearer difficulties with verbal and non-verbal communication,
                  and distress with change.
                </p>
              </div>
              <div>
                <span>Level 3</span>
                <b>Requiring very substantial support</b>
                <p>
                  Very limited communication, great difficulty with change, and
                  significant daily support needs.
                </p>
              </div>
            </div>
          </div>
          <div className="understanding-columns">
            <div>
              <Pill>What causes autism?</Pill>
              <p>
                Research points to a mix of genetic and environmental factors.
                Vaccines do not cause autism. Parenting does not cause autism.
              </p>
            </div>
            <div>
              <Pill>How is it identified?</Pill>
              <p>
                Developmental screening is followed by a formal evaluation from
                a paediatrician, child psychologist or developmental specialist.
                Early attention helps children get support sooner.
              </p>
              <div className="identify-flow">
                <b>Notice</b>
                <ArrowRight />
                <b>Screen</b>
                <ArrowRight />
                <b>Evaluate</b>
              </div>
            </div>
          </div>
          <div className="home-support">
            <div>
              <Pill>At home</Pill>
              <h3>Support that makes room for the child in front of you.</h3>
              <p>
                Keep routines predictable with “first, next, last” visuals.
                Reduce sensory overload with quiet spaces, headphones and dimmed
                lights. Give calm warnings before transitions, use short
                sentences, allow extra response time, and try pictures or
                gestures. Follow interests, celebrate small wins, and during
                meltdowns reduce stimulation, use few words, stay close and
                offer deep pressure only if welcome. Look after yourself and
                lean on your care team.
              </p>
            </div>
            <img
              src={images.calm}
              alt="A calm sensory corner with soft cushions, a weighted blanket and headphones"
            />
          </div>
          <div className="neuroai-fit">
            <Pill>Where NeuroAI fits in</Pill>
            <p>
              NeuroAI helps turn observations into supportive next steps:{" "}
              <a href="#logger">episode logging and patterns</a> to understand
              triggers, <a href="#routines">routines</a> for predictability,{" "}
              <a href="#activities">activities and Teach worksheets</a> for
              skill-building, <a href="#learn">Learn modules</a> for parent
              education, and the <a href="#caseload">therapist portal</a> for
              shared care.
            </p>
          </div>
          <p className="understanding-disclaimer">
            This information is educational and not a diagnosis or medical
            advice. Please speak to a qualified professional about your child.
          </p>
        </div>
      </section>
      <section className="day section" id="day">
        <div className="container">
          <SectionTitle
            eyebrow="A day with NeuroAI"
            title="Small moments become useful context"
          >
            No extra homework. Just a few simple touchpoints that make the next
            conversation more specific.
          </SectionTitle>
          <div className="timeline">
            <div className="timeline-item">
              <span className="timeline-number">01</span>
              <div>
                <small>7:30 AM · Morning</small>
                <h3>Peter follows his visual schedule</h3>
                <p>
                  May ticks off breakfast, getting dressed and shoes. NeuroAI
                  records one routine check-in.
                </p>
              </div>
              <FeatureMock type="routines" />
            </div>
            <div className="timeline-item">
              <span className="timeline-number">02</span>
              <div>
                <small>12:15 PM · Lunchroom</small>
                <h3>A loud episode takes one minute to log</h3>
                <p>
                  Before, during and after are captured while the details are
                  still clear.
                </p>
              </div>
              <LoggerMockup />
            </div>
            <div className="timeline-item">
              <span className="timeline-number">03</span>
              <div>
                <small>3:30 PM · After school</small>
                <h3>A calming strategy becomes something you can repeat</h3>
                <p>
                  May notes that the quiet room and headphones helped Peter
                  recover in 18 minutes.
                </p>
              </div>
              <FeatureMock type="activities" />
            </div>
            <div className="timeline-item">
              <span className="timeline-number">04</span>
              <div>
                <small>8:00 PM · Evening</small>
                <h3>An insight appears when the day is done</h3>
                <p>
                  NeuroAI connects shorter episodes with 7+ hours of sleep and
                  suggests preparing headphones before lunch.
                </p>
              </div>
              <InsightsMockup />
            </div>
          </div>
        </div>
      </section>
      <section className="features section" id="features">
        <div className="container">
          <SectionTitle
            eyebrow="Everything in one place"
            title="Tools that explain themselves"
          >
            Each feature is designed to answer one practical question: what
            happened, what might help, and what should we try next?
          </SectionTitle>
          <div className="feature-index">
            <a href="#understanding-autism">
              <Brain />
              <span>Understanding Autism</span>
            </a>
            {features.map(([label, , , id, Icon]) => (
              <a href={`#${id}`} key={id as string}>
                <Icon />
                <span>{label}</span>
              </a>
            ))}
          </div>
          <div className="feature-list">
            {features.map(([label, title, desc, id, Icon], i) => (
              <article
                className={`feature-row ${i % 2 ? "reverse" : ""}`}
                id={id as string}
                key={id as string}
              >
                <div className="feature-copy">
                  <Pill>
                    <Icon /> {label}
                  </Pill>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  <ul>
                    <li>
                      <Check /> Clear sample data for Peter&apos;s family
                    </li>
                    <li>
                      <Check /> Designed for a quick, low-stress next step
                    </li>
                    <li>
                      <Check /> Visible to the right people, by role
                    </li>
                  </ul>
                  {id === "insights" && (
                    <p className="feature-note">
                      <Lightbulb /> AI writes from family data only, with a
                      rule-based fallback if it is offline.
                    </p>
                  )}
                  {id === "learn" && (
                    <p className="feature-note">
                      <ShieldCheck /> 80% mastery is gentle guidance, not a
                      grade.
                    </p>
                  )}
                </div>
                <div className="feature-visual">
                  <FeatureMock type={id as string} />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="product-tour section" id="product-tour">
        <div className="container">
          <SectionTitle
            eyebrow="Inside the working website"
            title="A complete picture, from the first check-in to shared care"
          >
            These are the core screens families and therapists use to move from
            everyday observations to clearer decisions, practical routines and
            better conversations.
          </SectionTitle>
          <div className="product-gallery">
            <figure>
              <img
                src={images.dashboard}
                alt="NeuroAI parent dashboard showing quick actions, episode metrics and today's routines"
              />
              <figcaption>
                <Pill>Parent dashboard</Pill>
                <h3>Start with one calm home base.</h3>
                <p>
                  See the latest episodes, average intensity, top triggers,
                  routines and the next helpful action at a glance.
                </p>
              </figcaption>
            </figure>
            <figure>
              <img
                src={images.patterns}
                alt="NeuroAI patterns page showing episode trends, calm days and an assistant panel"
              />
              <figcaption>
                <Pill>Patterns + assistant</Pill>
                <h3>Turn logs into useful context.</h3>
                <p>
                  Compare time, place, triggers and strategies, then ask the
                  assistant plain-language questions about what stands out.
                </p>
              </figcaption>
            </figure>
            <figure>
              <img
                src={images.profile}
                alt="NeuroAI child profile showing episodes, routine adherence, goals and progress"
              />
              <figcaption>
                <Pill>Child profile</Pill>
                <h3>Keep the whole story together.</h3>
                <p>
                  Bring episodes, routines, goals, progress, interests and
                  care-team notes into one shared profile.
                </p>
              </figcaption>
            </figure>
            <figure>
              <img
                src={images.insights}
                alt="NeuroAI AI insights page showing what is working and what to watch"
              />
              <figcaption>
                <Pill>AI insights</Pill>
                <h3>Know what is working and what to watch.</h3>
                <p>
                  Get a gentle summary grounded in the family&apos;s own data,
                  with transparent signals and practical next steps.
                </p>
              </figcaption>
            </figure>
            <figure>
              <img
                src={images.caseload}
                alt="NeuroAI therapist caseload page showing children, episode counts, routines and goals"
              />
              <figcaption>
                <Pill>Therapist caseload</Pill>
                <h3>Coordinate care without losing the human context.</h3>
                <p>
                  Therapists can review the children they support, spot
                  attention areas, and open the right profile for deeper work.
                </p>
              </figcaption>
            </figure>
          </div>
          <div className="tour-note">
            <ShieldCheck />
            <span>
              Parents own the shared story. Therapists see only the children and
              notes they are invited to see.
            </span>
            <a href="#features" className="text-link">
              Explore the feature details <ArrowRight />
            </a>
          </div>
        </div>
      </section>
      <section className="photo-band">
        <div className="container photo-grid">
          <img
            src={images.sensory}
            alt="Parent and child exploring a quiet sensory activity at a table"
          />
          <div>
            <Pill>Made for real life</Pill>
            <h2>Support can be practical, warm and specific.</h2>
            <p>
              NeuroAI does not ask families to become data scientists. It turns
              the observations you already make into a shared language for home
              and therapy.
            </p>
            <a href="#start" className="text-link">
              See how to get started <ArrowRight />
            </a>
          </div>
        </div>
      </section>
      <section className="safety section" id="safety">
        <div className="container">
          <div className="safety-grid">
            <div>
              <SectionTitle
                eyebrow="Privacy, safety & trust"
                title="Supportive by design, honest about limits"
              >
                NeuroAI is a prototype that supports — never replaces —
                professional care.
              </SectionTitle>
              <div className="safety-list">
                <div>
                  <LockKeyhole />
                  <b>Secure sign-in</b>
                  <span>
                    Secure tokens, sign-in attempt limits and a secure API.
                  </span>
                </div>
                <div>
                  <Users />
                  <b>Role-based access</b>
                  <span>
                    Parents control which therapists can see a child&apos;s
                    shared data.
                  </span>
                </div>
                <div>
                  <ShieldCheck />
                  <b>Private notes stay private</b>
                  <span>
                    Therapist-only clinical notes are never shown in the parent
                    view.
                  </span>
                </div>
              </div>
            </div>
            <img
              src={images.therapist}
              alt="Therapist and parent reviewing a child's progress on a tablet together"
            />
          </div>
          <div className="honesty">
            <b>What NeuroAI is not</b>
            <span>A diagnostic tool</span>
            <span>A medical device</span>
            <span>A replacement for therapy</span>
            <span>Medical advice</span>
          </div>
        </div>
      </section>
      <section className="evidence section" id="evidence">
        <div className="container">
          <SectionTitle
            eyebrow="The evidence behind the approach"
            title="A thoughtful starting point, not a clinical claim"
          >
            NeuroAI brings related findings into one practical workflow — while
            being clear about what the research does and does not prove.
          </SectionTitle>
          <div className="evidence-table">
            <div className="table-head">
              <span>Research</span>
              <span>What it says</span>
              <span>How NeuroAI responds</span>
            </div>
            {[
              [
                "Sandgreen et al. (2021)",
                "Digital interventions for ASD show high heterogeneity.",
                "Keep guidance general and user-controlled.",
              ],
              [
                "Pi et al. (2022)",
                "16 RCTs / 748 participants; effects were inconsistent.",
                "Track what works for this child, not a population average.",
              ],
              [
                "Kohli et al. (2022)",
                "ML recommendation with 29 participants; cold-start problem.",
                "Use transparent rules and family context before AI.",
              ],
              [
                "Liu et al. (2023)",
                "43 publications found fragmented autism apps.",
                "Bring parent, child, therapist and data together.",
              ],
              [
                "Shu et al. (2026)",
                "3,319 children and adolescents; further validation needed.",
                "Treat personalisation as a hypothesis to discuss.",
              ],
            ].map((row) => (
              <div className="table-row" key={row[0]}>
                <b>{row[0]}</b>
                <span>{row[1]}</span>
                <span>{row[2]}</span>
              </div>
            ))}
          </div>
          <p className="evidence-close">
            NeuroAI is an integrated parent + child + therapist + AI platform;
            it has not yet been clinically validated.
          </p>
        </div>
      </section>
      <section className="start section" id="start">
        <div className="container">
          <SectionTitle
            eyebrow="How to get started"
            title="Three small steps to a clearer week"
          />
          <div className="start-grid">
            {[
              ["01", "Choose your role", "Sign in as a parent or therapist."],
              [
                "02",
                "Add a child profile",
                "Start with age, interests, known triggers and calming strategies.",
              ],
              [
                "03",
                "Log + build one routine",
                "Patterns start appearing after a few entries.",
              ],
            ].map(([num, title, desc]) => (
              <div className="start-card" key={num}>
                <span>{num}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
                <ArrowDown />
              </div>
            ))}
          </div>
          <div className="demo-note">
            <Sparkles /> <b>Exploring the prototype?</b> A demo family with
            Peter&apos;s fictional data is ready to explore.
          </div>
        </div>
      </section>
      <section className="faq section" id="faq">
        <div className="container faq-grid">
          <SectionTitle
            eyebrow="Questions, answered"
            title="A calm place to start"
          >
            If you are evaluating NeuroAI for a family, practice or school, here
            are the essentials.
          </SectionTitle>
          <div className="accordion">
            {[
              [
                "Is NeuroAI a medical tool?",
                "No. It is a prototype for general guidance and reflection, not a diagnostic tool or medical device.",
              ],
              [
                "Who can see my child’s data?",
                "The child’s parent and only the therapists the parent has granted access to. Therapist-only notes remain private.",
              ],
              [
                "Do therapists have to use it?",
                "No. A parent can use the family tools alone, then choose whether to invite a therapist.",
              ],
              [
                "How does the AI work?",
                "A rule-based engine looks for patterns in the family’s own logs. An AI model writes a short summary from those signals and the same logged data.",
              ],
              [
                "What if the AI is offline?",
                "A rule-based summary is shown automatically, so the core insights do not disappear.",
              ],
              [
                "How old should my child be for Teach?",
                "The parent-and-child worksheets are designed for ages 3–6. The other tools can support a wider range.",
              ],
              [
                "Can several caregivers use it?",
                "The prototype is designed around a parent-owned profile and role-based access; caregiver sharing can be added by the parent.",
              ],
              [
                "Is it free? Does it replace therapy?",
                "Prototype, pricing not announced. NeuroAI supports professional care; it does not replace therapy.",
              ],
            ].map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section className="final-cta">
        <div className="container">
          <div>
            <Pill>Start with one observation</Pill>
            <h2>Start understanding your child&apos;s patterns today.</h2>
            <p>
              Turn the next difficult moment into context for the next helpful
              step.
            </p>
          </div>
          <a className="button light" href={`${APP_URL}/login`}>
            Sign in <ArrowRight />
          </a>
        </div>
      </section>
      <footer>
        <div className="container footer-inner">
          <Logo />
          <div className="footer-links">
            <a href="#what">About</a>
            <a href="#features">Features</a>
            <a href="#evidence">Evidence</a>
            <a href="#faq">FAQ</a>
            <a href={`${APP_URL}/login`}>Sign in</a>
          </div>
          <p>NeuroAI provides general guidance and is not medical advice.</p>
        </div>
      </footer>
      <button
        className="sos-button"
        aria-label="Open SOS emergency toolkit"
        onClick={() => setSosOpen(true)}
      >
        <PhoneCall /> <span>SOS</span>
      </button>
      {sosOpen && (
        <div
          className="sos-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sos-title"
        >
          <div className="sos-dialog">
            <button
              className="close-dialog"
              aria-label="Close SOS toolkit"
              onClick={() => setSosOpen(false)}
            >
              <X />
            </button>
            <div className="sos-icon">
              <HeartHandshake />
            </div>
            <h2 id="sos-title">A calmer next step</h2>
            <p>
              These reminders are for the moment when everything feels like too
              much.
            </p>
            <div className="sos-steps">
              <b>1. Reduce stimulation</b>
              <span>Dim lights and cut background noise.</span>
              <b>2. Offer, don&apos;t insist</b>
              <span>Deep pressure only if it is welcome.</span>
              <b>3. Use few calm words</b>
              <span>Stay close and let recovery happen at its own pace.</span>
            </div>
            <a className="button emergency" href="tel:911">
              <PhoneCall /> Call emergency services
            </a>
          </div>
        </div>
      )}
    </main>
  );
}
