import type { FC } from "hono/jsx";

type Props = {
  error?: string;
};

export const SignupPage: FC<Props> = ({ error }) => (
  <div class="login-card">
    <h1>envoker</h1>
    <p>Create the first admin account</p>
    {error && <p class="login-error">{error}</p>}
    <form action="/admin/api/signup" method="post">
      <label>
        Name
        <input type="text" name="name" required autocomplete="name" />
      </label>
      <label>
        Email
        <input type="email" name="email" required autocomplete="email" />
      </label>
      <label>
        Password
        <input type="password" name="password" required minlength={8} autocomplete="new-password" />
      </label>
      <button type="submit" class="btn" style={{ width: "100%", justifyContent: "center" }}>
        Create Account
      </button>
    </form>
  </div>
);
