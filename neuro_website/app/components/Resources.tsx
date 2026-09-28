import type { CSSProperties } from "react";

const researchPapers = [
  {
    no: 1,
    paper: "Sandgreen et al. (2021)",
    focus: "Digital interventions for ASD",
    study: "Meta-analysis; 19 studies",
    limitation:
      "High heterogeneity; varied interventions/outcomes; limited generalizability",
    addresses: "Integrated longitudinal parent-centered platform",
    neuroLimitation: "Small initial dataset; no clinical validation",
  },
  {
    no: 2,
    paper: "Pi et al. (2022)",
    focus: "Technology-assisted parent-mediated interventions",
    study: "Meta-analysis; 16 RCTs / 748 participants",
    limitation:
      "Effects on social communication, functioning and language were inconsistent",
    addresses: "Observation → personalization → activity → progress loop",
    neuroLimitation: "Cannot prove NeuroAI causes developmental improvement",
  },
  {
    no: 3,
    paper: "Kohli et al. (2022)",
    focus: "ML-based ABA treatment recommendation",
    study: "Exploratory ML study; 29 participants",
    limitation: "Small sample; limited diversity; cold-start problem",
    addresses:
      "Personalized activities using profile, goals, history and outcomes",
    neuroLimitation: "Cold-start and limited training data remain",
  },
  {
    no: 4,
    paper: "Liu et al. (2023)",
    focus: "Survey of autism mobile apps",
    study: "Systematic survey; 43 publications",
    limitation:
      "Fragmented apps; limited data-driven validation; need for multidisciplinary/user-centered design",
    addresses: "Integrated parent + child + therapist + AI platform",
    neuroLimitation: "Prototype lacks clinical validation",
  },
  {
    no: 5,
    paper: "Shu et al. (2026)",
    focus: "Personalized rehabilitation recommendation using ML",
    study: "ML study; 3,319 children/adolescents",
    limitation:
      "Data-driven recommendations require further empirical validation",
    addresses: "ML + parent observations + therapist review",
    neuroLimitation:
      "Small project dataset; recommendations are not clinical prescriptions",
  },
];

const problemPoints = [
  {
    icon: "",
    title: "Fragmented Care",
    description:
      "Parents juggle separate apps, notebooks, and therapist notes with no single place that connects daily life to long-term progress.",
  },
  {
    icon: "",
    title: "Missed Patterns",
    description:
      "Triggers, routines, and sensory needs are hard to track by memory alone, so recurring patterns often go unnoticed until they become crises.",
  },
  {
    icon: "",
    title: "Disconnected Professionals",
    description:
      "Therapists rarely see real day to day context, and parents rarely get therapy goals translated into simple daily actions.",
  },
  {
    icon: "",
    title: "Generic Guidance",
    description:
      "Most resources offer one size fits all advice instead of recommendations shaped by a specific child's profile and history.",
  },
];

const solutionPoints = [
  {
    icon: "",
    title: "One Connected Loop",
    description:
      "Observation → personalization → activity → progress, all in a single platform, so nothing has to be re-explained or re-entered.",
  },
  {
    icon: "",
    title: "Pattern Recognition, Not Guesswork",
    description:
      "AI surfaces recurring routines, triggers, and sensory patterns from real daily logs instead of relying on memory or intuition.",
  },
  {
    icon: "",
    title: "Shared Ground With Therapists",
    description:
      "A therapist portal keeps goals, recommendations, and reports flowing both ways between home and clinical care.",
  },
  {
    icon: "",
    title: "Personalized, Not Generic",
    description:
      "Activities and strategies are shaped by each child's own profile, goals, and outcome history not a fixed playbook.",
  },
];

export default function Resources() {
  return (
    <main>
      {/* Header */}
      <section
        style={{
          background: "var(--primary-light)",
          padding: "70px 20px",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h1>Resources</h1>
          <p style={{ maxWidth: "700px", margin: "15px auto 0" }}>
            Understanding autism care, what Neuro AI is trying to solve, and
            the research that shaped our approach.
          </p>
        </div>
      </section>

      {/* Understanding Autism Care */}
      <section className="section">
        <div className="container">
          <h2>Understanding Autism Care</h2>
          <p style={{ maxWidth: "850px", marginTop: "15px" }}>
            Autism spectrum condition (ASD) affects communication, sensory
            processing, behaviour, and social interaction differently in
            every child. Effective care is rarely a single fix it is a
            combination of consistent daily routines, sensory awareness,
            behavioural strategies, and close collaboration between parents
            and professionals such as therapists, psychologists, and
            educators.
          </p>
          <p style={{ maxWidth: "850px", marginTop: "15px" }}>
            Research consistently shows that parent-mediated interventions
            where parents apply guided strategies at home, not just in
            clinical sessions can meaningfully support a child's
            development. But this only works when parents can observe
            clearly, recognise patterns, and get feedback that adapts to
            their child, rather than following generic advice.
          </p>
          <p style={{ maxWidth: "850px", marginTop: "15px" }}>
            At the same time, technology assisted and app based approaches
            for autism care have grown quickly, but studies and surveys
            repeatedly point to the same gaps: fragmented tools, inconsistent
            evidence, small study samples, and a lack of platforms that
            bring parents, children, and professionals into one connected
            system.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="section" style={{ background: "#f8fbfc" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2>What We're Trying to Solve</h2>
            <p style={{ maxWidth: "700px", margin: "15px auto" }}>
              The real-world gaps in autism care that Neuro AI was built
              around.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "22px",
            }}
          >
            {problemPoints.map((point) => (
              <div className="card" key={point.title}>
                <h3 style={{ fontSize: "1.25rem" }}>
                  <span style={{ marginRight: "8px" }}>{point.icon}</span>
                  {point.title}
                </h3>
                <p style={{ marginTop: "10px" }}>{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2>How Neuro AI Addresses It</h2>
            <p style={{ maxWidth: "700px", margin: "15px auto" }}>
              Our approach, built directly around the gaps above.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "22px",
            }}
          >
            {solutionPoints.map((point) => (
              <div className="card" key={point.title}>
                <h3 style={{ fontSize: "1.25rem" }}>
                  <span style={{ marginRight: "8px" }}>{point.icon}</span>
                  {point.title}
                </h3>
                <p style={{ marginTop: "10px" }}>{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Research Papers */}
      <section className="section" style={{ background: "#f8fbfc" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <h2>Research Behind Our Approach</h2>
            <p style={{ maxWidth: "750px", margin: "15px auto" }}>
              Five of the most relevant studies that informed Neuro AI's
              design alongside their limitations.
            </p>
          </div>

          {/* Table */}
          <div
            style={{
              overflowX: "auto",
              marginTop: "30px",
              display: "block",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#ffffff",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid var(--border)",
                minWidth: "900px",
              }}
            >
              <thead>
                <tr style={{ background: "var(--primary)" }}>
                  {[
                    "No.",
                    "Paper / Authors",
                    "Focus",
                    "Study / Sample",
                    "Key Limitation",
                    "What Neuro AI Addresses",
                    "Neuro AI Limitation",
                  ].map((head) => (
                    <th
                      key={head}
                      style={{
                        color: "#ffffff",
                        fontFamily: "'Inter', Arial, sans-serif",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                        textAlign: "left",
                        padding: "14px 16px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {researchPapers.map((row, idx) => (
                  <tr
                    key={row.no}
                    style={{
                      background: idx % 2 === 0 ? "#ffffff" : "#f8fbfc",
                      borderTop: "1px solid var(--border)",
                    }}
                  >
                    <td style={cellStyle}>{row.no}</td>
                    <td style={{ ...cellStyle, fontWeight: 600 }}>
                      {row.paper}
                    </td>
                    <td style={cellStyle}>{row.focus}</td>
                    <td style={cellStyle}>{row.study}</td>
                    <td style={cellStyle}>{row.limitation}</td>
                    <td style={cellStyle}>{row.addresses}</td>
                    <td style={cellStyle}>{row.neuroLimitation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p
            style={{
              marginTop: "18px",
              fontSize: "0.85rem",
              maxWidth: "800px",
            }}
          >
            Scroll horizontally on smaller screens to view the full table.
            Full citations are simplified for readability; please refer to
            original publications for complete bibliographic detail.
          </p>
        </div>
      </section>
    </main>
  );
}

const cellStyle: CSSProperties = {
  padding: "14px 16px",
  fontSize: "0.88rem",
  color: "var(--text-light)",
  verticalAlign: "top",
  lineHeight: 1.5,
};