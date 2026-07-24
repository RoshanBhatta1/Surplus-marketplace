import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-20 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
        Surplus flooring, matched exactly.
      </h1>
      <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
        Manufacturer, product line, color number, and dye lot — buy and sell leftover flooring stock
        with the precision a repair job actually needs.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/listings" className="btn-primary">
          Browse listings
        </Link>
        <Link href="/sell/new" className="btn-secondary">
          Sell surplus material
        </Link>
      </div>
    </div>
  );
}
