import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}