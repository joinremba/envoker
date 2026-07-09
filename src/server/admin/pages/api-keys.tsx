import type { FC } from "hono/jsx";
import { AdminLayout } from "../layout";

type ApiKeyEntry = {
  id: string;
  name: string | null;
  prefix: string | null;
  start: string | null;
  enabled: boolean;
  createdAt: number;
  expiresAt: number | null;
  lastUsedAt?: number | null;
};

type Props = {
  user: { name: string; email: string };
  keys: ApiKeyEntry[];
};

export const ApiKeysPage: FC<Props> = ({ user, keys }) => (
  <AdminLayout user={user} title="API Keys">
    <div class="admin-header">
      <h1>API Keys</h1>
      <button class="btn" hx-get="/admin/api/api-keys/new" hx-target="body" hx-swap="beforeend">
        + Create API Key
      </button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Key Prefix</th>
            <th>Status</th>
            <th>Expires</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {keys.map((k) => (
            <tr id={`apikey-${k.id}`}>
              <td>{k.name ?? "—"}</td>
              <td>
                <code>
                  {k.prefix ?? ""}...{k.start ?? ""}
                </code>
              </td>
              <td>
                <span class={`badge ${k.enabled ? "badge-ok" : "badge-err"}`}>
                  {k.enabled ? "Active" : "Revoked"}
                </span>
              </td>
              <td class="text-muted" style={{ fontSize: "0.8125rem" }}>
                {k.expiresAt ? new Date(k.expiresAt).toLocaleDateString() : "Never"}
              </td>
              <td class="text-muted" style={{ fontSize: "0.8125rem" }}>
                {new Date(k.createdAt).toLocaleDateString()}
              </td>
              <td>
                {k.enabled && (
                  <button
                    class="btn btn-sm btn-danger"
                    hx-delete={`/admin/api/api-keys/${k.id}`}
                    hx-confirm={`Revoke API key "${k.name ?? "unnamed"}"?`}
                    hx-target={`#apikey-${k.id}`}
                    hx-swap="delete"
                  >
                    Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
          {keys.length === 0 && (
            <tr>
              <td colSpan={6} class="empty-state">
                No API keys yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </AdminLayout>
);
