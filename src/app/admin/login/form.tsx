"use client";

import { useActionState } from "react";
import { signIn } from "../actions";

export default function LoginForm() {
  const [error, action, pending] = useActionState(signIn, "");
  return <form action={action} className="admin-login-form">
    <label>Email<input name="email" autoComplete="username" type="email" required /></label>
    <label>Password<input name="password" autoComplete="current-password" type="password" required /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button type="submit" disabled={pending} className="button button-red">{pending ? "Signing in…" : "Sign in"}</button>
  </form>;
}
