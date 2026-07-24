import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-helpers";
import { SignOutButton } from "@/components/sign-out-button";

export async function Navbar() {
  const user = await getCurrentUser();

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
          {user && (
            <Link href="/sell/new" className="text-slate-600 hover:text-slate-900">
              Sell
            </Link>
          )}
          {user ? (
            <>
              <Link href="/account/orders" className="text-slate-600 hover:text-slate-900">
                Orders
              </Link>
              <Link href="/account/listings" className="text-slate-600 hover:text-slate-900">
                My listings
              </Link>
              {user.adminRole === "ADMIN" && (
                <Link href="/admin" className="text-slate-600 hover:text-slate-900">
                  Admin
                </Link>
              )}
              <Link href="/account" className="text-slate-600 hover:text-slate-900">
                {user.name}
              </Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
