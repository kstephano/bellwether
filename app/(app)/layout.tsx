import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav email={session.user?.email ?? ""} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
        {children}
      </main>
      <footer className="border-t">
        <div className="mx-auto w-full max-w-5xl px-6 py-4">
          <p className="kicker">
            Bellwether — reports are private and never shared
          </p>
        </div>
      </footer>
    </div>
  );
}
