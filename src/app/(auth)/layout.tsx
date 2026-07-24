export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">{children}</div>
    </div>
  );
}
