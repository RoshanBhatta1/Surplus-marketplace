import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin</h1>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>
          <Link href="/admin/reports" className="text-slate-600 hover:text-slate-900">
            Reports
          </Link>
          <Link href="/admin/disputes" className="text-slate-600 hover:text-slate-900">
            Disputes
          </Link>
          <Link href="/admin/listings" className="text-slate-600 hover:text-slate-900">
            Listings
          </Link>
          <Link href="/admin/users" className="text-slate-600 hover:text-slate-900">
            Users
          </Link>
          <Link href="/admin/config" className="text-slate-600 hover:text-slate-900">
            Config
          </Link>
        </nav>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
