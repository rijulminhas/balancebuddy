import { NetWorthView } from "@/components/personal-finance/net-worth/net-worth-view";

export default async function NetWorthPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Net Worth</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your complete financial position — assets minus liabilities.
        </p>
      </div>
      <NetWorthView />
    </div>
  );
}
