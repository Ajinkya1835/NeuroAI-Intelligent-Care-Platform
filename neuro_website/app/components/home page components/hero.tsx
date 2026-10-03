const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-overlay"></div>

      <div className="hero-content">
        <h1>Neuro AI</h1>

        <p>
         A supportive platform for parents of children with autism, helping them track progress, recognise behavioural patterns, and learn practical ways to respond to everyday situations with greater confidence and understanding.

        </p>

        <div className="hero-actions">
          <a href={`${APP_URL}/login`} className="btn-primary">
            Open Care App
          </a>
          <a href="/about" className="btn-secondary">
            Explore NeuroAI
          </a>
        </div>
      </div>
    </section>
  );
}