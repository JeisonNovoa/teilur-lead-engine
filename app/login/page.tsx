import { LoginForm } from "../../src/dashboard/components/login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Teilur Lead Engine</h1>
          <p className="text-sm text-zinc-500 mt-1">Ingresa para revisar los leads</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
