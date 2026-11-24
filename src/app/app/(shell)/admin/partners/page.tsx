import { redirect } from "next/navigation";
import { requireUser } from "@dashboard/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminPartnersRoot() {
    await requireUser({ area: "admin" });
    redirect("/app/admin/partners/applications");
}
