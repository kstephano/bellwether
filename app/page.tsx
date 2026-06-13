import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-3xl font-semibold tracking-tight">Bellwether</h1>
      <p className="mt-4 text-muted-foreground">
        Signed in as {session.user?.email}
      </p>
    </main>
  );
}
