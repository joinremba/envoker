import type { FC } from "hono/jsx";
import { AdminLayout } from "../layout";

type FeatureEntry = {
  id: string;
  flag: string;
  enabled: boolean;
  environment: string;
  updatedAt: number;
};

type Props = {
  user: { name: string; email: string };
  features: FeatureEntry[];
};

export const FeaturesPage: FC<Props> = ({ user, features }) => (
  <AdminLayout user={user} title="Features">
    <div class="admin-header">
      <h1>Feature Flags</h1>
      <button class="btn" hx-get="/admin/api/features/new" hx-target="body" hx-swap="beforeend">
        + Add Feature
      </button>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Flag</th>
            <th>Status</th>
            <th>Environment</th>
            <th>Updated</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {features.map((f) => (
            <tr id={`feature-${f.id}`}>
              <td>
                <code>{f.flag}</code>
              </td>
              <td>
                <span class={`badge ${f.enabled ? "badge-ok" : "badge-err"}`}>
                  {f.enabled ? "ON" : "OFF"}
                </span>
              </td>
              <td>
                <span class="badge badge-ok">{f.environment}</span>
              </td>
              <td class="text-muted" style={{ fontSize: "0.8125rem" }}>
                {new Date(f.updatedAt).toLocaleDateString()}
              </td>
              <td>
                <div class="flex-row">
                  <button
                    class={`btn btn-sm ${f.enabled ? "btn-danger" : "btn-outline"}`}
                    hx-put={`/admin/api/features/${f.id}/toggle`}
                    hx-target={`#feature-${f.id}`}
                    hx-swap="outerHTML"
                  >
                    {f.enabled ? "Disable" : "Enable"}
                  </button>
                  <button
                    class="btn btn-sm btn-danger"
                    hx-delete={`/admin/api/features/${f.id}`}
                    hx-confirm="Delete this feature flag?"
                    hx-target={`#feature-${f.id}`}
                    hx-swap="delete"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {features.length === 0 && (
            <tr>
              <td colSpan={5} class="empty-state">
                No feature flags yet
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </AdminLayout>
);
