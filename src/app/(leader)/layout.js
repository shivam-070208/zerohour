import { authRequire } from "@/lib/auth-utils";

export default async function LeaderLayout({ children }) {
  await authRequire();

  return <>{children}</>;
}
