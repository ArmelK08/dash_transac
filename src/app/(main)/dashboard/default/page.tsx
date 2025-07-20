import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { OverviewCards } from "../crm/_components/overview-cards";
import { TableCards } from "../crm/_components/table-cards";



export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  if (!token) {
    redirect("/auth/v2/login");
  }

  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <OverviewCards />
      <TableCards />
    </div>
  );
}
