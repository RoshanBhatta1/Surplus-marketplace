import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [openReports, openDisputes, activeListings, totalUsers, suspendedUsers] = await Promise.all([
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.dispute.count({ where: { status: "OPEN" } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
  ]);

  const cards = [
    { label: "Open reports", value: openReports, href: "/admin/reports" },
    { label: "Open disputes", value: openDisputes, href: "/admin/disputes" },
    { label: "Active listings", value: activeListings, href: "/admin/listings" },
    { label: "Total users", value: totalUsers, href: "/admin/users" },
    { label: "Suspended users", value: suspendedUsers, href: "/admin/users" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {cards.map((c) => (
        <Link key={c.label} href={c.href} className="card">
          <p className="text-2xl font-semibold text-slate-900">{c.value}</p>
          <p className="text-sm text-slate-500">{c.label}</p>
        </Link>
      ))}
    </div>
  );
}
