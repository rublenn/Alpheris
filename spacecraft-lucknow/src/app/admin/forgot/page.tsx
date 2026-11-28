import Link from "next/link";
import { ForgotForm } from "./ForgotForm";

export const metadata = { title: "Forgot password" };

export default function ForgotPage() {
  return (
    <main className="blueprint flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <p className="eyebrow">Space Craft admin</p>
        <h1 className="display mt-3 text-[2.4rem]">Forgot password</h1>
        <ForgotForm />
        <Link href="/admin/login" className="mt-6 block text-[12px] text-muted hover:text-ink">← Back to login</Link>
      </div>
    </main>
  );
}
