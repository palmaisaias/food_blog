import Link from "next/link";
import { redirect } from "next/navigation";
import { adminSession } from "@/lib/supabase";
import { hasSupabase } from "@/lib/config";
import LoginForm from "./form";

export default async function Login() {
  if (await adminSession()) redirect("/admin");
  return <section className="admin-login">
    <p className="eyebrow section-kicker"><span /> Administration</p>
    <h1>Sign in<span className="red">.</span></h1>
    {hasSupabase ? <LoginForm /> : <p className="admin-notice">This is the sample journal. Connect Supabase using the setup steps in the README to create and publish your own recipes.</p>}
    <Link className="text-link" href="/">Back to the journal</Link>
  </section>;
}
