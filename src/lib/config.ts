import { prisma } from "@/lib/prisma";

export const DEFAULT_COMMISSION_PERCENT = Number(
  process.env.PLATFORM_COMMISSION_PERCENT ?? "8"
);
export const DEFAULT_FUND_RELEASE_WINDOW_DAYS = Number(
  process.env.FUND_RELEASE_WINDOW_DAYS ?? "5"
);

/**
 * Platform config is a singleton DB row so admins can change commission %
 * and the release window at runtime without a redeploy. Falls back to env
 * defaults (and lazily creates the row) the first time it's read.
 */
export async function getPlatformConfig() {
  const existing = await prisma.platformConfig.findUnique({ where: { id: 1 } });
  if (existing) return existing;

  return prisma.platformConfig.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      commissionPercent: DEFAULT_COMMISSION_PERCENT,
      fundReleaseWindowDays: DEFAULT_FUND_RELEASE_WINDOW_DAYS,
    },
    update: {},
  });
}
