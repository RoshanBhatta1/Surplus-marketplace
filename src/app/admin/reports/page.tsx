import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { resolveReport } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/admin-action-buttons";

export default async function AdminReportsPage() {
  const reports = await prisma.report.findMany({
    where: { status: "OPEN" },
    orderBy: { createdAt: "desc" },
    include: {
      listing: { select: { id: true, title: true } },
      reportedUser: { select: { id: true, name: true, email: true } },
      reportedBy: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Open reports</h2>
      {reports.map((report) => (
        <div key={report.id} className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-900">
                {report.targetType === "LISTING" ? "Listing: " : "User: "}
                {report.targetType === "LISTING" && report.listing ? (
                  <Link href={`/listings/${report.listing.id}`} className="underline">
                    {report.listing.title}
                  </Link>
                ) : (
                  report.reportedUser && `${report.reportedUser.name} (${report.reportedUser.email})`
                )}
              </p>
              <p className="mt-1 text-sm text-slate-700">{report.reason}</p>
              {report.details && <p className="mt-1 text-sm text-slate-500">{report.details}</p>}
              <p className="mt-1 text-xs text-slate-400">
                Reported by {report.reportedBy.name} ({report.reportedBy.email}) on {formatDate(report.createdAt)}
              </p>
            </div>
            <div className="flex gap-2">
              <AdminActionButton
                label="Resolve"
                onRun={resolveReport.bind(null, { reportId: report.id, action: "RESOLVED" })}
              />
              <AdminActionButton
                label="Dismiss"
                onRun={resolveReport.bind(null, { reportId: report.id, action: "DISMISSED" })}
              />
            </div>
          </div>
        </div>
      ))}
      {reports.length === 0 && <p className="text-sm text-slate-500">No open reports.</p>}
    </div>
  );
}
