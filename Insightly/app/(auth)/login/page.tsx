import { db } from "@/lib/db";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const [agencyCount, reportCount] = await Promise.all([
    db.agency.count(),
    db.report.count({ where: { status: { in: ["READY", "SENT"] } } }),
  ]);

  return <LoginForm agencyCount={agencyCount} reportCount={reportCount} />;
}
