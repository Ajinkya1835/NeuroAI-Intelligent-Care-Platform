export default function AboutUs() {
  return (
    <main>

      <section
        style={{
          background: "var(--primary-light)",
          padding: "70px 20px",
          textAlign: "center",
        }}
      >
        <div className="container">
          <h1>About Us</h1>

          <p
            style={{
              maxWidth: "700px",
              margin: "15px auto 0",
            }}
          >
            Supporting parents with meaningful insights, practical
            guidance, and tools to better understand their child's
            unique journey.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">

          <h2>What We Do</h2>

          <p style={{ maxWidth: "850px", marginTop: "15px" }}>
            Parenting a child with autism can come with unique
            challenges. Understanding behaviours, emotions,
            communication, and daily routines can sometimes feel
            overwhelming.
          </p>

          <p style={{ maxWidth: "850px", marginTop: "15px" }}>
            Our platform helps parents track their child's progress,
            recognise recurring behavioural patterns, and learn
            practical ways to respond to different situations.
          </p>

        </div>
      </section>

      <section
        className="section"
        style={{ background: "#f8fbfc" }}
      >
        <div className="container">

          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h2>How We Help</h2>

            <p style={{ maxWidth: "700px", margin: "15px auto" }}>
              Simple tools and useful insights designed to support
              parents throughout their child's journey.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "25px",
            }}
          >
            <div className="card">
              <h3>📊 Track Progress</h3>
              <p style={{ marginTop: "10px" }}>
                Monitor important changes and milestones over time.
              </p>
            </div>

            <div className="card">
              <h3>🔍 Recognise Patterns</h3>
              <p style={{ marginTop: "10px" }}>
                Identify recurring behaviours, triggers, and routines.
              </p>
            </div>

            <div className="card">
              <h3>💡 Learn & Understand</h3>
              <p style={{ marginTop: "10px" }}>
                Learn practical ways to better understand and respond
                to different situations.
              </p>
            </div>

            <div className="card">
              <h3>🤝 Support Parents</h3>
              <p style={{ marginTop: "10px" }}>
                Help parents approach everyday challenges with greater
                confidence and understanding.
              </p>
            </div>
          </div>

        </div>
      </section>

    </main>
  );
}