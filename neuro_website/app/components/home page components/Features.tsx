const featureCategories = [
  {
    category: "Child Understanding",
    description:
      "Build a rich, evolving picture of your child so every decision starts from real understanding.",
    items: [
      {
        icon: "",
        title: "Child Profile & Insights",
        description:
          "A detailed, evolving profile covering strengths, challenges, communication style, and preferences to guide personalised care.",
      },
      {
        icon: "",
        title: "Sensory Profile",
        description:
          "Map sensitivities and preferences across sound, light, touch, and movement to anticipate and reduce overwhelm.",
      },
      {
        icon: "",
        title: "Daily Observation Journal",
        description:
          "Capture day to day moments, moods, and behaviours in one place to spot patterns over time.",
      },
    ],
  },
  {
    category: "Monitoring",
    description:
      "Keep track of growth, goals, and difficult moments with clarity and consistency.",
    items: [
      {
        icon: "",
        title: "Progress Tracking",
        description:
          "Visualise development over weeks and months with clear, easy to read progress indicators.",
      },
      {
        icon: "",
        title: "Goal Management",
        description:
          "Set, adjust, and monitor personalised goals for skills, behaviour, and daily living.",
      },
      {
        icon: "",
        title: "Meltdown Log",
        description:
          "Record meltdowns with context time, place, and intensity to better understand what precedes them.",
      },
      {
        icon: "",
        title: "Trigger & Strategy Tracker",
        description:
          "Link triggers to the strategies you tried and the outcomes, building a growing playbook that works for your child.",
      },
      {
        icon: "",
        title: "AI perodic summary",
        description:
          "Get AI-generated summaries that highlight trends, wins, and areas to watch without the manual work.",
      },
    ],
  },
  {
    category: "Intelligence",
    description:
      "Let smart, personalised insights guide everyday support and interaction.",
    items: [
      {
        icon: "",
        title: "Routine and Pattern Recognition",
        description:
          "Automatically surface recurring routines and behavioural patterns you might otherwise miss.",
      },
      {
        icon: "",
        title: "Personalized Activities",
        description:
          "Receive activity suggestions tailored to your child's interests, sensory needs, and current goals.",
      },
      {
        icon: "",
        title: "Context Aware Chatbot",
        description:
          "Ask questions and get guidance from an assistant that understands your child's unique profile and history.",
      },
    ],
  },
  {
    category: "Professional",
    description:
      "Bridge the gap between home and therapy with shared tools built for collaboration.",
    items: [
      {
        icon: "",
        title: "Therapist Portal",
        description:
          "A dedicated space for therapists to securely view relevant data and stay aligned with home progress.",
      },
      {
        icon: "",
        title: "Therapist Goals & Recommendations",
        description:
          "Therapists can set goals and recommendations that sync directly with the family's daily view.",
      },
      {
        icon: "",
        title: "AI-generated Parent/Therapist Reports",
        description:
          "Automatically generate clear, shareable reports for parents and professionals to review together.",
      },
    ],
  },
  {
    category: "Family",
    description:
      "Keep everyone involved in your child's care informed, aligned, and supported.",
    items: [
      {
        icon: "",
        title: "Caregiver Collaboration",
        description:
          "Share updates and coordinate care across parents, family members, and other caregivers in real time.",
      },
      {
        icon: "",
        title: "Parent Learning Booklet",
        description:
          "Access practical, easy-to-understand resources that help parents learn and apply supportive strategies.",
      },
    ],
  },
  {
    category: "Safety",
    description: "Be prepared for the moments that matter most.",
    items: [
      {
        icon: "",
        title: "Emergency & Safety Toolkit",
        description:
          "Quick access to emergency contacts, calming strategies, and essential information when it's needed most.",
      },
    ],
  },
  {
    category: "Privacy",
    description: "Stay in control of your family's information at all times.",
    items: [
      {
        icon: "",
        title: "Consent & Data Sharing",
        description:
          "Manage exactly what information is shared, with whom, and for how long with full transparency and control.",
      },
    ],
  },
];

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "50px" }}>
          <h2>Everything You Need, In One Platform</h2>
          <p style={{ maxWidth: "700px", margin: "15px auto 0" }}>
            From daily observations to professional collaboration, Neuro AI
            brings every tool a family needs into one connected, supportive
            space.
          </p>
        </div>

        {featureCategories.map((group) => (
          <div key={group.category} style={{ marginBottom: "50px" }}>
            <div style={{ marginBottom: "22px" }}>
              <h3
                style={{
                  color: "var(--primary)",
                  fontFamily: "'Inter', Arial, sans-serif",
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom: "6px",
                }}
              >
                {group.category}
              </h3>
              <p style={{ maxWidth: "650px" }}>{group.description}</p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                gap: "22px",
              }}
            >
              {group.items.map((item) => (
                <div className="card" key={item.title}>
                  <h3 style={{ fontSize: "1.25rem" }}>
                    <span style={{ marginRight: "8px" }}>{item.icon}</span>
                    {item.title}
                  </h3>
                  <p style={{ marginTop: "10px" }}>{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}