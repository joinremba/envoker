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

/* ── Docs layout ── */
.docs-wrapper {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 3rem;
  padding: 2.5rem 0;
}

.sidebar { position: sticky; top: 2rem; align-self: start; }

.sidebar h4 {
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.sidebar ul { list-style: none; display: flex; flex-direction: column; gap: 0.375rem; }

.sidebar a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  transition: color 0.15s;
}

.sidebar a:hover { color: var(--text); }

.content h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 2.5rem 0 1rem;
  letter-spacing: -0.02em;
}

.content h2:first-child { margin-top: 0; }

.content h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 2rem 0 0.75rem;
}

.content p {
  font-size: 0.9375rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
  line-height: 1.7;
}

.content ul {
  margin: 0.75rem 0 1rem 1.25rem;
  color: var(--text-muted);
  font-size: 0.9375rem;
  line-height: 1.7;
}

.content li { margin-bottom: 0.25rem; }

.content code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--accent);
  background: var(--bg-elevated);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.content pre {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  overflow-x: auto;
  margin: 1rem 0 1.5rem;
}

.content pre code {
  background: none;
  padding: 0;
  font-size: 0.8125rem;
  line-height: 1.6;
  color: var(--text);
}

.content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0 1.5rem;
  font-size: 0.875rem;
}

.content th {
  text-align: left;
  font-weight: 600;
  color: var(--text-muted);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--border);
}

.content td {
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--border);
  color: var(--text-muted);
}

.content td:first-child code {
  color: var(--accent);
}

@media (max-width: 768px) {
  .docs-wrapper { grid-template-columns: 1fr; }
  .sidebar { position: static; }
}
`;

export const DocsPage: FC = () => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>envoker — Documentation</title>
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

        <div class="docs-wrapper">
          <aside class="sidebar">
            <h4>Contents</h4>
            <ul>
              <li>
                <a href="#installation">Installation</a>
              </li>
              <li>
                <a href="#quick-start">Quick Start</a>
              </li>
              <li>
                <a href="#schema">Schema</a>
              </li>
              <li>
                <a href="#feature-gates">Feature Gates</a>
              </li>
              <li>
                <a href="#remote-config">Remote Config</a>
              </li>
              <li>
                <a href="#cli">CLI</a>
              </li>
              <li>
                <a href="#api">Server API</a>
              </li>
            </ul>
          </aside>

          <article class="content">
            <h2 id="installation">Installation</h2>
            <pre>
              <code>bun add envoker</code>
            </pre>

            <h2 id="quick-start">Quick Start</h2>
            <pre>
              <code>{`import { createEnvoker } from "envoker";

const env = createEnvoker({
  PORT: { type: "port", default: 3000 },
  DATABASE_URL: { type: "string", secret: true },
  LOG_LEVEL: {
    type: "enum",
    values: ["debug", "info", "warn", "error"],
    default: "info",
  },
});

env.ensure();

console.log(env.get("PORT")); // 3000 (typed as number)
console.log(env.isEnabled("new-dashboard")); // false`}</code>
            </pre>

            <h2 id="schema">Schema</h2>
            <p>Envoker supports these field types:</p>
            <ul>
              <li>
                <code>string</code> — text values
              </li>
              <li>
                <code>number</code> — numeric values (coerced)
              </li>
              <li>
                <code>boolean</code> — true/false (coerced from "1"/"true"/"0"/"false")
              </li>
              <li>
                <code>port</code> — port number (1–65535)
              </li>
              <li>
                <code>enum</code> — specific allowed values
              </li>
              <li>
                <code>url</code> — URL validation
              </li>
            </ul>
            <p>
              Fields can be marked as <code>secret: true</code> to redact values in error messages
              and CLI output.
            </p>

            <h2 id="feature-gates">Feature Gates</h2>
            <pre>
              <code>{`// Check if a feature is enabled
if (env.isEnabled("new-dashboard")) {
  // ...
}

// Kill a feature (overrides enabled)
if (env.isKilled("problematic-feature")) {
  // Feature is force-disabled
}`}</code>
            </pre>

            <h2 id="remote-config">Remote Config</h2>
            <p>
              Envoker can optionally connect to the Envoker server for remote configuration
              management. Pass a <code>client</code> option to <code>createEnvoker()</code>:
            </p>
            <pre>
              <code>{`import { createEnvoker } from "envoker";

const env = createEnvoker(schema, {
  client: {
    verifyKey: async () => ({ valid: true, projectId: "proj_xxx", scopes: ["*"] }),
    getConfig: async () => [
      { key: "FEATURE_NEW_DASHBOARD", value: "true", secret: false },
    ],
    getFeatures: async () => [
      { name: "new-dashboard", enabled: true },
    ],
  },
});`}</code>
            </pre>

            <h2 id="cli">CLI</h2>
            <pre>
              <code>{`# Validate current environment
bunx envoker check

# Generate .env.example from schema
bunx envoker example

# Encrypt/decrypt .env files
bunx envoker encrypt
bunx envoker decrypt`}</code>
            </pre>

            <h2 id="api">Server API</h2>
            <p>The Envoker server provides remote config and feature flag management:</p>
            <table>
              <thead>
                <tr>
                  <th>Endpoint</th>
                  <th>Method</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <code>/v1/config</code>
                  </td>
                  <td>GET</td>
                  <td>Fetch remote config entries</td>
                </tr>
                <tr>
                  <td>
                    <code>/v1/config</code>
                  </td>
                  <td>POST</td>
                  <td>Submit local config for drift detection</td>
                </tr>
                <tr>
                  <td>
                    <code>/v1/features</code>
                  </td>
                  <td>GET</td>
                  <td>Fetch remote feature flags</td>
                </tr>
              </tbody>
            </table>
            <p>
              All API endpoints require authentication via{" "}
              <code>Authorization: Bearer &lt;api-key&gt;</code>.
            </p>
          </article>
        </div>
      </div>
    </body>
  </html>
);
