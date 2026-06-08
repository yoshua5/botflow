"use client";

import { SessionProvider } from "next-auth/react";

export default function SessionClientWrapper({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
