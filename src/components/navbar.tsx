import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          Surplus Flooring Marketplace
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <Link href="/listings" className="text-slate-600 hover:text-slate-900">
            Browse
          </Link>
          <Link href="/sell/new" className="text-slate-600 hover:text-slate-900">
            Sell
          </Link>
          <Link href="/login" className="text-slate-600 hover:text-slate-900">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
          >
            Sign up
          </Link>
        </nav>
      </div>
    </header>
  );
}
