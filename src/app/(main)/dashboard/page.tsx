import { OverviewCards } from "./crm/_components/overview-cards";
import { TableCards } from "./crm/_components/table-cards";


export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <OverviewCards />
      {/* <InsightCards /> */}
      {/* <OperationalCards /> */}
      <TableCards/>
    </div>
  );
}
