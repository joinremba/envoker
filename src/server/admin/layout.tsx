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
  --text-dim: #525252;
  --accent: #e5e5e5;
  --success: #22c55e;
  --error: #ef4444;
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

/* ── Admin nav ── */
.admin-nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid var(--border);
}

.admin-nav-left { display: flex; align-items: center; gap: 2rem; }

.logo {
  font-family: var(--font-sans);
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--text);
  text-decoration: none;
}

.logo span { color: var(--text-muted); }

.nav-items { display: flex; gap: 0.25rem; }

.nav-item {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.8125rem;
  font-weight: 500;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  transition: all 0.15s;
}

.nav-item:hover { color: var(--text); background: var(--bg-elevated); }

.admin-nav-right { display: flex; align-items: center; gap: 1rem; }

.admin-email { font-size: 0.8125rem; color: var(--text-dim); }

.sign-out {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-decoration: none;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  border: 1px solid var(--border);
  transition: all 0.15s;
}

.sign-out:hover { color: var(--error); border-color: var(--error); }

/* ── Admin content ── */
.admin-content { padding: 2rem 0; }

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.admin-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

/* ── Cards ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 1.5rem;
}

.card header {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-dim);
  margin-bottom: 0.5rem;
}

.card .stat {
  font-size: 2.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin-bottom: 0.75rem;
}

.card footer a {
  font-size: 0.8125rem;
  color: var(--text-muted);
  text-decoration: none;
}

.card footer a:hover { color: var(--text); }

/* ── Table ── */
.table-wrap {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }

th {
  text-align: left;
  font-weight: 600;
  color: var(--text-dim);
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  background: var(--bg-elevated);
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border);
  color: var(--text);
}

tr:last-child td { border-bottom: none; }

td code {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--accent);
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--text-dim);
  font-size: 0.875rem;
}

/* ── Badges ── */
.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 999px;
  font-size: 0.6875rem;
  font-weight: 600;
}

.badge-ok { background: #052e16; color: var(--success); }
.badge-err { background: #450a0a; color: var(--error); }

/* ── Buttons ── */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover { background: var(--bg-elevated); }

.btn-outline { border-color: var(--border); color: var(--text-muted); }
.btn-outline:hover { color: var(--text); border-color: var(--text-muted); }

.btn-danger { color: var(--error); }
.btn-danger:hover { border-color: var(--error); background: #450a0a; }

.btn-sm { padding: 0.25rem 0.625rem; font-size: 0.75rem; }

/* ── Dialogs ── */
dialog {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 0;
  max-width: 480px;
  width: 90vw;
}

dialog::backdrop { background: rgba(0, 0, 0, 0.8); }

dialog article { padding: 1.5rem; }

dialog header {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1.25rem;
}

dialog label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--text-muted);
  margin-bottom: 0.375rem;
}

dialog input, dialog select, dialog textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 0.875rem;
  margin-bottom: 1rem;
  outline: none;
  transition: border-color 0.15s;
}

dialog input:focus, dialog select:focus, dialog textarea:focus {
  border-color: var(--text-muted);
}

dialog .btn-row { display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem; }

/* ── Login page ── */
.login-card {
  max-width: 380px;
  margin: 6rem auto;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 2rem;
}

.login-card h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.login-card p {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: 1.5rem;
}

.login-error {
  font-size: 0.8125rem;
  color: var(--error);
  margin-bottom: 1rem;
}

/* ── Misc ── */
.flex-row { display: flex; align-items: center; gap: 0.5rem; }

.text-muted { color: var(--text-muted); }
`;

type LayoutProps = {
  user?: { name: string; email: string };
  title?: string;
  children: any;
};

export const AdminLayout: FC<LayoutProps> = ({ user, title, children }) => (
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>{title ? `${title} — envoker` : "envoker"}</title>
      <style>{css}</style>
      <script src="https://unpkg.com/htmx.org@2" />
    </head>
    <body>
      <div class="container">
        <nav class="admin-nav">
          <div class="admin-nav-left">
            <a href="/admin" class="logo">
              envoker<span>.</span>
            </a>
            <div class="nav-items">
              <a href="/admin/configs" class="nav-item">
                Configs
              </a>
              <a href="/admin/features" class="nav-item">
                Features
              </a>
              <a href="/admin/api-keys" class="nav-item">
                API Keys
              </a>
              <a href="/admin/users" class="nav-item">
                Users
              </a>
            </div>
          </div>
          {user && (
            <div class="admin-nav-right">
              <span class="admin-email">{user.email}</span>
              <a href="/api/auth/signout" class="sign-out">
                Sign out
              </a>
            </div>
          )}
        </nav>
        <main class="admin-content">{children}</main>
      </div>
    </body>
  </html>
);
