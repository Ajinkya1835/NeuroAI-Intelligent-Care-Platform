const styles = {
  nav: {
    width: "100%",
    background: "#ffffff",
    borderBottom: "1px solid #dce7ea",
    position: "sticky" as const,
    top: 0,
    zIndex: 1000,
  },

  container: {
    width: "min(92%, 1200px)",
    minHeight: "70px",
    margin: "0 auto",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "30px",
  },

  logo: {
    color: "#18323b",
    textDecoration: "none",
    fontFamily: "'DM Serif Display', Georgia, 'Times New Roman', serif",
    fontSize: "1.8rem",
    fontWeight: 400,
  },

  logoAccent: {
    color: "#1f6678",
  },

  links: {
    display: "flex",
    alignItems: "center",
    gap: "30px",
  },

  link: {
    color: "#18323b",
    textDecoration: "none",
    fontFamily: "'Inter', Arial, sans-serif",
    fontSize: "0.95rem",
    fontWeight: 600,
  },

  button: {
    padding: "10px 20px",
    background: "#1f6678",
    color: "#ffffff",
    borderRadius: "6px",
    textDecoration: "none",
    fontFamily: "'Inter', Arial, sans-serif",
    fontSize: "0.9rem",
    fontWeight: 600,
  },
};

export default function Navbar() {
  return (
    <nav style={styles.nav}>
      <div style={styles.container}>

        {/* Logo */}
        <a href="/" style={styles.logo}>
          NEURO<span style={styles.logoAccent}>AI</span>
        </a>

        {/* Navigation Links */}
        <div style={styles.links}>
          <a href="/" style={styles.link}>
            Home
          </a>

          <a href="/progress" style={styles.link}>
            Progress
          </a>

          <a href="/resources" style={styles.link}>
            Resources
          </a>

          <a href="/patterns" style={styles.link}>
            Patterns
          </a>

          <a href="/about" style={styles.link}>
            About Us
          </a>

          {/* Action Button */}
          <a href="/login" style={styles.button}>
            Get Started
          </a>
        </div>

      </div>
    </nav>
  );
}