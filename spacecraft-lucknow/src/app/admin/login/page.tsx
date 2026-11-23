import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in" };

export default function AdminLoginPage() {
  return (
    <main className="blueprint flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm border border-line bg-white p-8">
        <p className="eyebrow">Space Craft</p>
        <h1 className="display mt-3 text-[2.4rem]">Admin login</h1>
        <LoginForm />
      </div>
    </main>
  );
}
