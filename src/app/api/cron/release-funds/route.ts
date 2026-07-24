import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseTransactionFunds } from "@/lib/transactions";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.transaction.findMany({
    where: { status: "FUNDS_HELD", fundsReleaseDueAt: { lte: new Date() } },
    select: { id: true },
  });

  const results = await Promise.all(
    due.map(async (t) => ({ id: t.id, result: await releaseTransactionFunds(t.id, { confirmedByBuyer: false }) }))
  );

  const released = results.filter((r) => r.result.ok).length;
  const failed = results.filter((r) => !r.result.ok);

  return NextResponse.json({ checked: due.length, released, failed });
}
