import { getPlatformConfig } from "@/lib/config";
import { ConfigForm } from "@/components/admin/config-form";

export default async function AdminConfigPage() {
  const config = await getPlatformConfig();

  return (
    <div>
      <h2 className="text-lg font-medium">Platform config</h2>
      <div className="mt-4">
        <ConfigForm
          commissionPercent={Number(config.commissionPercent)}
          fundReleaseWindowDays={config.fundReleaseWindowDays}
        />
      </div>
    </div>
  );
}
