"use client";

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session: any;
}) {
  console.log(session);
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
