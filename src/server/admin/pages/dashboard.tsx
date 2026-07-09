import type { FC } from "hono/jsx";
import { AdminLayout } from "../layout";

type Props = {
  user: { name: string; email: string };
  stats: { configs: number; features: number };
};

export const DashboardPage: FC<Props> = ({ user, stats }) => (
  <AdminLayout user={user} title="Dashboard">
    <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "1.5rem" }}>Dashboard</h1>
    <div class="card-grid">
      <div class="card">
        <header>Configs</header>
        <div class="stat">{stats.configs}</div>
        <footer>
          <a href="/admin/configs">Manage →</a>
        </footer>
      </div>
      <div class="card">
        <header>Feature Flags</header>
        <div class="stat">{stats.features}</div>
        <footer>
          <a href="/admin/features">Manage →</a>
        </footer>
      </div>
    </div>
  </AdminLayout>
);
