import Shell from "@dashboard-ui/shell";
import { NAV } from "@dashboard-ui/nav-config";
import { ROLE_LABEL } from "@dashboard/auth/roles";
import { requireUser } from "@dashboard/auth/session";

export const dynamic = "force-dynamic";

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
    // Pages also call requireUser themselves: layouts don't re-run on every
    // client navigation, so they are not a security boundary on their own.
    const user = await requireUser();
    return (
        <Shell nav={NAV[user.role]} userName={user.name} roleLabel={ROLE_LABEL[user.role]}>
            {children}
        </Shell>
    );
}
