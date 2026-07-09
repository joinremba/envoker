import type { FC } from "hono/jsx";
import { AdminLayout } from "../layout";

type ConfigEntry = {
  id: string;
  key: string;
  value: string;
  environment: string;
  secret: boolean;
  updatedAt: number;
};

type Props = {
  user: { name: string; email: string };
  configs: ConfigEntry[];
};

export const ConfigsPage: FC<Props> = ({ user, configs }) => (
  <AdminLayout user={user} title="Configs">
    <div class="admin-header">
      <h1>Configs</h1>
      <button class="btn" hx-get="/admin/api/configs/new" hx-target="body" hx-swap="beforeend">
        + Add Config
      </button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Key</th>
            <th>Value</th>
            <th>Environment</th>
            <th>Secret</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {configs.map((c) => (
            <tr id={`config-${c.id}`}>
              <td>
                <code>{c.key}</code>
              </td>
              <td>
                <code
                  style={{
                    maxWidth: "200px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "inline-block",
                  }}
                >
                  {c.secret ? "[REDACTED]" : c.value}
                </code>
              </td>
              <td>
                <span class="badge badge-ok">{c.environment}</span>
              </td>
              <td class="text-muted">{c.secret ? "Yes" : "—"}</td>
              <td class="text-muted" style={{ fontSize: "0.8125rem" }}>
                {new Date(c.updatedAt).toLocaleDateString()}
              </td>
              <td>
                <button
                  class="btn btn-sm btn-danger"
                  hx-delete={`/admin/api/configs/${c.id}`}
                  hx-confirm="Delete this config?"
                  hx-target={`#config-${c.id}`}
                  hx-swap="delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {configs.length === 0 && (
            <tr>
              <td colSpan={6} class="empty-state">
                No configs yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </AdminLayout>
);
