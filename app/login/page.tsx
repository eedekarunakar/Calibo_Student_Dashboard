import { LoginForm } from "@/components/login-form";

export default function LoginPage({
  searchParams
}: {
  searchParams: { next?: string };
}) {
  const nextPath = searchParams.next?.startsWith("/") ? searchParams.next : "/";

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <LoginForm nextPath={nextPath} />
    </main>
  );
}