import { Suspense } from 'react';
import { Logo } from '@/components/logo';
import { AuthForm } from '@/components/auth-form';
export default function LoginPage() {
  return (
    <div className="grid min-h-screen place-items-center bg-muted/50 p-4">
      <div className="w-full max-w-sm rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <h1 className="mb-5 text-center text-xl font-semibold">Welcome back</h1>
        <Suspense><AuthForm mode="login" /></Suspense>
      </div>
    </div>
  );
}
