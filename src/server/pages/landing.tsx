import type { FC } from "hono/jsx";

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'IBM Plex Sans', system-ui, sans-serif;
  --font-mono: 'IBM Plex Mono', 'JetBrains Mono', monospace;
  --bg: #000;
  --bg-card: #0d0d0d;
  --bg-elevated: #1a1a1a;
  --border: #1f1f1f;
  --text: #e5e5e5;
  --text-muted: #737373;
  --accent: #e5e5e5;
  --accent-hover: #fff;
  --radius: 8px;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-sans);
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.container { max-width: 1024px; margin: 0 auto; padding: 0 1.5rem; }

/* ── Nav ── */
nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--border);
}

.logo {
  font-family: var(--font-sans);
  font-size: 1.25rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
  text-decoration: none;
}

.logo span { color: var(--text-muted); }

.nav-links { display: flex; gap: 1.5rem; align-items: center; }

.nav-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.15s;
}

.nav-links a:hover { color: var(--text); }

/* ── Hero ── */
.hero {
  text-align: center;
  padding: 6rem 0 4rem;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 1.25rem;
}

.hero p {
  font-size: 1.125rem;
  color: var(--text-muted);
  max-width: 600px;
  margin: 0 auto 2rem;
  line-height: 1.7;
}

.hero-actions { display: flex; gap: 0.75rem; justify-content: center; }

.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s;
}

.btn-primary {
  background: var(--text);
  color: var(--bg);
  border: 1px solid var(--text);
}

.btn-primary:hover { background: var(--accent-hover); }

.btn-outline {
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-outline:hover {
  background: var(--bg-card);
  border-color: var(--text-muted);
}

/* ── Features grid ── */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin: 3rem 0;
}

.feature {
  background: var(--bg-card);
  padding: 2rem;
}

.feature h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.feature p {
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.7;
}

.feature code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--accent);
  background: var(--bg-elevated);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

/* ── Footer ── */
footer {
  text-align: center;
  padding: 3rem 0;
  color: var(--text-muted);
  font-size: 0.8125rem;
  border-top: 1px solid var(--border);
  margin-top: 4rem;
}
`;

export const LandingPage: FC = () => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>envoker — Environment Variable Validation</title>
      <style>{css}</style>
    </head>
    <body>
      <div class="container">
        <nav>
          <a href="/" class="logo">
            envoker<span>.</span>
          </a>
          <div class="nav-links">
            <a href="/docs">Docs</a>
            <a href="/admin">Dashboard</a>
            <a href="https://github.com/joinremba/envoker">GitHub</a>
          </div>
        </nav>

        <section class="hero">
          <h1>
            Validate your environment
            <br />
            before production breaks
          </h1>
          <p>
            Envoker validates environment variables, manages secrets, and controls feature flags
            with a type-safe API. Works standalone or with remote configuration management.
          </p>
          <div class="hero-actions">
            <a href="/docs" class="btn btn-primary">
              Get Started
            </a>
            <a href="https://github.com/joinremba/envoker" class="btn btn-outline">
              GitHub
            </a>
          </div>
        </section>

        <div class="features">
          <div class="feature">
            <h3>Type-Safe</h3>
            <p>
              Define your env schema with Zod and get fully typed config values. Catch missing vars
              at startup, not runtime.
            </p>
          </div>
          <div class="feature">
            <h3>Feature Gates</h3>
            <p>
              Toggle features with <code>isEnabled()</code> and kill switches with{" "}
              <code>isKilled()</code>. Control rollout without redeploys.
            </p>
          </div>
          <div class="feature">
            <h3>Remote Config</h3>
            <p>
              Optional server-side configuration management. Change environment variables across
              services from a dashboard.
            </p>
          </div>
        </div>
      </div>

      <footer>
        <div class="container">envoker — MIT License</div>
      </footer>
    </body>
  </html>
);
