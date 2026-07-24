import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { suspendUser, reinstateUser } from "@/app/actions/admin";
import { AdminActionButton } from "@/components/admin/admin-action-buttons";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-medium">Users</h2>
      {users.map((user) => (
        <div key={user.id} className="card flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {user.name} <span className="text-slate-400">({user.email})</span>
            </p>
            <p className="text-xs text-slate-500">
              {user.accountType} · {user.status} · joined {formatDate(user.createdAt)}
              {user.adminRole === "ADMIN" && " · admin"}
            </p>
          </div>
          {user.status === "SUSPENDED" ? (
            <AdminActionButton label="Reinstate" onRun={reinstateUser.bind(null, user.id)} />
          ) : (
            <AdminActionButton
              label="Suspend"
              variant="danger"
              confirmText={`Suspend ${user.email}? They won't be able to log in.`}
              onRun={suspendUser.bind(null, user.id)}
            />
          )}
        </div>
      ))}
    </div>
  );
}
