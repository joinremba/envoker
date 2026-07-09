import type { FC } from "hono/jsx";

type Props = {
  error?: string;
};

export const LoginPage: FC<Props> = ({ error }) => (
  <div class="login-card">
    <h1>envoker</h1>
    <p>Sign in to manage your configuration</p>
    {error && <p class="login-error">{error}</p>}
    <form action="/api/auth/sign-in/email" method="post">
      <label>
        Email
        <input type="email" name="email" required autocomplete="email" />
      </label>
      <label>
        Password
        <input type="password" name="password" required autocomplete="current-password" />
      </label>
      <button type="submit" class="btn" style={{ width: "100%", justifyContent: "center" }}>
        Sign In
      </button>
    </form>
  </div>
);
