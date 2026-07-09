import { Hono } from "hono";
import { eq, desc, count } from "drizzle-orm";
import { getDb } from "../db";
import { configs, features, user as userTable, apikey } from "../db/schema";
import { auth } from "../auth";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { DashboardPage } from "./pages/dashboard";
import { ConfigsPage } from "./pages/configs";
import { FeaturesPage } from "./pages/features";
import { ApiKeysPage } from "./pages/api-keys";
import { UsersPage } from "./pages/users";
import { newId } from "../lib/id";

type AdminVariables = {
  user: { id: string; name: string; email: string };
  session: { id: string };
};

const app = new Hono<{ Variables: AdminVariables }>();

// ── Session middleware ────────────────────────────────────────────

app.use("*", async (c, next) => {
  const path = c.req.path;

  // Skip auth for login and signup pages
  if (path === "/admin/login" || path === "/admin/signup") {
    return next();
  }

  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    if (path.startsWith("/admin/api/")) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    return c.redirect("/admin/login");
  }

  c.set("user", session.user as AdminVariables["user"]);
  c.set("session", session.session as AdminVariables["session"]);
  await next();
});

// ── First-user redirect ──────────────────────────────────────────

/** Returns true if no users exist in the database. */
async function isFirstUser(): Promise<boolean> {
  const db = getDb();
  const [row] = await db.select({ count: count() }).from(userTable);
  return (row?.count ?? 0) === 0;
}

app.use("/login", async (c, next) => {
  // If no users exist, redirect to signup
  if (await isFirstUser()) return c.redirect("/admin/signup");
  // If already logged in, redirect to dashboard
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) return c.redirect("/admin");
  await next();
});

app.use("/signup", async (c, next) => {
  // If users already exist, redirect to login
  if (!(await isFirstUser())) return c.redirect("/admin/login");
  // If already logged in, redirect to dashboard
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (session) return c.redirect("/admin");
  await next();
});

// ── Auth pages ────────────────────────────────────────────────────

app.get("/login", async (c) => {
  return c.html(<LoginPage />);
});

app.get("/signup", async (c) => {
  return c.html(<SignupPage />);
});

// ── Sign-up handler ───────────────────────────────────────────────

app.post("/api/signup", async (c) => {
  // Only allow sign-up if no users exist
  if (!(await isFirstUser())) {
    return c.html(<SignupPage error="Users already exist. Please sign in instead." />);
  }

  const body = await c.req.parseBody();
  const name = String(body.name ?? "");
  const email = String(body.email ?? "");
  const password = String(body.password ?? "");

  if (!name || !email || !password) {
    return c.html(<SignupPage error="All fields are required." />);
  }
  if (password.length < 8) {
    return c.html(<SignupPage error="Password must be at least 8 characters." />);
  }

  try {
    await auth.api.signUpEmail({ body: { name, email, password } });
    return c.redirect("/admin");
  } catch (err: any) {
    return c.html(
      <SignupPage error={err?.message ?? err?.body?.message ?? "Sign-up failed. Try again."} />
    );
  }
});

// ── Dashboard ────────────────────────────────────────────────────

app.get("/", async (c) => {
  const user = c.get("user");
  const db = getDb();
  const configCount = await db.select({ count: count() }).from(configs);
  const featureCount = await db.select({ count: count() }).from(features);
  return c.html(
    <DashboardPage
      user={user}
      stats={{
        configs: configCount[0]?.count ?? 0,
        features: featureCount[0]?.count ?? 0,
      }}
    />
  );
});

// ── Configs ─────────────────────────────────────────────────────

app.get("/configs", async (c) => {
  const user = c.get("user");
  const db = getDb();
  const all = await db.select().from(configs).orderBy(desc(configs.updatedAt));
  return c.html(<ConfigsPage user={user} configs={all} />);
});

app.get("/api/configs/new", async (c) => {
  return c.html(
    <dialog open>
      <article>
        <header>Add Config</header>
        <form hx-post="/admin/api/configs" hx-target="body" hx-swap="beforeend">
          <label>
            Key
            <input type="text" name="key" required placeholder="e.g. DATABASE_URL" />
          </label>
          <label>
            Value
            <input type="text" name="value" required />
          </label>
          <label>
            Environment
            <select name="environment">
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="development">development</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="secret" value="1" />
            Secret (redact in logs)
          </label>
          <div class="btn-row">
            <button type="submit" class="btn">
              Create
            </button>
            <button type="button" class="btn btn-outline" onclick="this.closest('dialog').close()">
              Cancel
            </button>
          </div>
        </form>
      </article>
    </dialog>
  );
});

app.post("/api/configs", async (c) => {
  const body = await c.req.parseBody();
  const key = String(body.key ?? "");
  const value = String(body.value ?? "");
  const environment = String(body.environment ?? "production");
  const secret = body.secret === "1";
  const now = Date.now();

  if (!key || !value) {
    return c.html(
      <dialog open>
        <article>
          <header>Error</header>
          <p>Key and value are required.</p>
          <form method="get" action="/admin/configs">
            <button type="submit" class="btn">
              Back
            </button>
          </form>
        </article>
      </dialog>
    );
  }

  const db = getDb();
  await db.insert(configs).values({
    id: newId(),
    apiKeyId: "admin",
    key,
    value: JSON.stringify(value),
    environment,
    secret,
    createdAt: now,
    updatedAt: now,
  });

  return c.redirect("/admin/configs");
});

app.delete("/api/configs/:id", async (c) => {
  const id = c.req.param("id")!;
  const db = getDb();
  await db.delete(configs).where(eq(configs.id, id));
  return c.body(null, 200);
});

// ── Features ────────────────────────────────────────────────────

app.get("/features", async (c) => {
  const user = c.get("user");
  const db = getDb();
  const all = await db.select().from(features).orderBy(desc(features.updatedAt));
  return c.html(<FeaturesPage user={user} features={all} />);
});

app.get("/api/features/new", async (c) => {
  return c.html(
    <dialog open>
      <article>
        <header>Add Feature Flag</header>
        <form hx-post="/admin/api/features" hx-target="body" hx-swap="beforeend">
          <label>
            Flag Name
            <input type="text" name="flag" required placeholder="e.g. new-dashboard" />
          </label>
          <label>
            Environment
            <select name="environment">
              <option value="production">production</option>
              <option value="staging">staging</option>
              <option value="development">development</option>
            </select>
          </label>
          <label>
            <input type="checkbox" name="enabled" value="1" checked />
            Enabled by default
          </label>
          <div class="btn-row">
            <button type="submit" class="btn">
              Create
            </button>
            <button type="button" class="btn btn-outline" onclick="this.closest('dialog').close()">
              Cancel
            </button>
          </div>
        </form>
      </article>
    </dialog>
  );
});

app.post("/api/features", async (c) => {
  const body = await c.req.parseBody();
  const flag = String(body.flag ?? "");
  const environment = String(body.environment ?? "production");
  const enabled = body.enabled === "1";
  const now = Date.now();

  if (!flag) {
    return c.html(
      <dialog open>
        <article>
          <header>Error</header>
          <p>Flag name is required.</p>
          <form method="get" action="/admin/features">
            <button type="submit" class="btn">
              Back
            </button>
          </form>
        </article>
      </dialog>
    );
  }

  const db = getDb();
  await db.insert(features).values({
    id: newId(),
    apiKeyId: "admin",
    flag,
    enabled,
    environment,
    createdAt: now,
    updatedAt: now,
  });

  return c.redirect("/admin/features");
});

app.put("/api/features/:id/toggle", async (c) => {
  const id = c.req.param("id")!;
  const db = getDb();
  const [f] = await db.select().from(features).where(eq(features.id, id)).limit(1);
  if (!f) return c.body(null, 404);

  const now = Date.now();
  const enabled = !f.enabled;
  await db.update(features).set({ enabled, updatedAt: now }).where(eq(features.id, id));

  return c.html(
    <tr id={`feature-${f.id}`}>
      <td>
        <code>{f.flag}</code>
      </td>
      <td>
        <span class={`badge ${enabled ? "badge-ok" : "badge-err"}`}>{enabled ? "ON" : "OFF"}</span>
      </td>
      <td>
        <span class="badge badge-ok">{f.environment}</span>
      </td>
      <td class="text-muted" style={{ fontSize: "0.8125rem" }}>
        {new Date(now).toLocaleDateString()}
      </td>
      <td>
        <div class="flex-row">
          <button
            class={`btn btn-sm ${enabled ? "btn-danger" : "btn-outline"}`}
            hx-put={`/admin/api/features/${id}/toggle`}
            hx-target={`#feature-${f.id}`}
            hx-swap="outerHTML"
          >
            {enabled ? "Disable" : "Enable"}
          </button>
          <button
            class="btn btn-sm btn-danger"
            hx-delete={`/admin/api/features/${id}`}
            hx-confirm="Delete this feature flag?"
            hx-target={`#feature-${f.id}`}
            hx-swap="delete"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
});

app.delete("/api/features/:id", async (c) => {
  const id = c.req.param("id")!;
  const db = getDb();
  await db.delete(features).where(eq(features.id, id));
  return c.body(null, 200);
});

// ── API Keys ────────────────────────────────────────────────────

app.get("/api-keys", async (c) => {
  const user = c.get("user");
  const db = getDb();
  const all = await db.select().from(apikey).orderBy(desc(apikey.createdAt));
  return c.html(<ApiKeysPage user={user} keys={all} />);
});

app.get("/api/api-keys/new", async (c) => {
  return c.html(
    <dialog open>
      <article>
        <header>Create API Key</header>
        <form hx-post="/admin/api/api-keys" hx-target="body" hx-swap="beforeend">
          <label>
            Name
            <input type="text" name="name" required placeholder="e.g. CI server" />
          </label>
          <label>
            Expires in (optional)
            <select name="expiresIn">
              <option value="">Never</option>
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
            </select>
          </label>
          <div class="btn-row">
            <button type="submit" class="btn">
              Create
            </button>
            <button type="button" class="btn btn-outline" onclick="this.closest('dialog').close()">
              Cancel
            </button>
          </div>
        </form>
      </article>
    </dialog>
  );
});

app.post("/api/api-keys", async (c) => {
  const form = await c.req.parseBody();
  const name = String(form.name ?? "");
  const expiresIn = form.expiresIn ? parseInt(String(form.expiresIn), 10) : null;
  const user = c.get("user");

  if (!name) {
    return c.redirect("/admin/api-keys");
  }

  try {
    const result = await auth.api.createApiKey({
      body: {
        name,
        userId: user.id,
        ...(expiresIn ? { expiresIn } : {}),
      },
    });

    // Show the created key in a dialog (only chance to see the full key)
    return c.html(
      <dialog open>
        <article>
          <header>API Key Created</header>
          <p>Copy this key now — you won't be able to see it again.</p>
          <pre
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "1rem",
              fontSize: "0.8125rem",
              fontFamily: "var(--font-mono)",
              wordBreak: "break-all",
              marginBottom: "1rem",
            }}
          >
            {result.key}
          </pre>
          <div class="btn-row">
            <button
              type="button"
              class="btn"
              onclick="this.closest('dialog').close(); window.location.href='/admin/api-keys'"
            >
              Done
            </button>
          </div>
        </article>
      </dialog>
    );
  } catch (err: any) {
    return c.html(
      <dialog open>
        <article>
          <header>Error</header>
          <p>{err?.message ?? "Failed to create API key."}</p>
          <form method="get" action="/admin/api-keys">
            <button type="submit" class="btn">
              Back
            </button>
          </form>
        </article>
      </dialog>
    );
  }
});

app.delete("/api/api-keys/:id", async (c) => {
  const id = c.req.param("id")!;
  try {
    await auth.api.deleteApiKey({ body: { keyId: id } });
  } catch {
    // Fallback: direct DB deletion
    const db = getDb();
    await db.delete(apikey).where(eq(apikey.id, id));
  }
  return c.body(null, 200);
});

// ── Users ────────────────────────────────────────────────────────

app.get("/users", async (c) => {
  const user = c.get("user");
  const db = getDb();
  const all = await db.select().from(userTable).orderBy(desc(userTable.createdAt));
  return c.html(<UsersPage user={user} users={all} currentUserId={user.id} />);
});

export default app;
