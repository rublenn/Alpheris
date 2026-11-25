import { SetPasswordForm } from "./SetPasswordForm";

export const metadata = { title: "Set password" };

export default function SetPasswordPage() {
  return (
    <main className="blueprint flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <p className="eyebrow">Space Craft admin</p>
        <h1 className="display mt-3 text-[2.4rem]">Set your password</h1>
        <SetPasswordForm />
      </div>
    </main>
  );
}
