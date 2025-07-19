import { InsightCards } from "./_components/insight-cards";
import { OperationalCards } from "./_components/operational-cards";
import { OverviewCards } from "./_components/overview-cards";
import { TableCards } from "./_components/table-cards";

export default function Page() {
  return (
    <div className="@container/main flex flex-col gap-4 md:gap-6">
      <OverviewCards />
      {/* <InsightCards /> */}
      {/* <OperationalCards /> */}
      <TableCards />
    </div>
  );
}
export const config = {
  api: {
    responseLimit: false,
  },
};