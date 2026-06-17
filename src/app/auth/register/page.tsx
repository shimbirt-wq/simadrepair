import { RegisterForm } from "@/app/auth/register/register-form";
import { getAuthRuntimeIssue } from "@/lib/config/runtime";

export default function RegisterPage() {
  const runtimeIssue = getAuthRuntimeIssue();

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-14">
      <div className="grid gap-6">
        {runtimeIssue ? (
          <section className="rounded-3xl border border-[#e9b5b5] bg-[#fff3f1] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9f2c2c]">Configuration required</p>
            <p className="mt-3 text-sm leading-7 text-[#7b2323]">{runtimeIssue}</p>
          </section>
        ) : null}
        <RegisterForm />
      </div>
    </main>
  );
}
