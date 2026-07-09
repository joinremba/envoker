import type { FC } from "hono/jsx";
import { AdminLayout } from "../layout";

type UserEntry = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: number;
};

type Props = {
  user: { name: string; email: string };
  users: UserEntry[];
  currentUserId: string;
};

export const UsersPage: FC<Props> = ({ user, users, currentUserId }) => (
  <AdminLayout user={user} title="Users">
    <div class="admin-header">
      <h1>Users</h1>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Verified</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr>
              <td>
                {u.name}
                {u.id === currentUserId && (
                  <span class="badge badge-ok" style={{ marginLeft: "0.5rem" }}>
                    You
                  </span>
                )}
              </td>
              <td>
                <code>{u.email}</code>
              </td>
              <td>
                <span class={`badge ${u.emailVerified ? "badge-ok" : "badge-err"}`}>
                  {u.emailVerified ? "Yes" : "No"}
                </span>
              </td>
              <td class="text-muted" style={{ fontSize: "0.8125rem" }}>
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {users.length === 0 && (
            <tr>
              <td colSpan={4} class="empty-state">
                No users found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </AdminLayout>
);
