import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import Card from "@dashboard-ui/card";
import InfoNotice from "@dashboard-ui/info-notice";
import PageHeader from "@dashboard-ui/page-header";
import StageTracker from "@dashboard-ui/stage-tracker";
import { ROLE_HOME } from "@dashboard/auth/roles";
import { requireUser } from "@dashboard/auth/session";
import { openCase } from "@dashboard/auth/case-access";
import { STAGES } from "@dashboard/cases";
import { db, schema } from "@dashboard/db";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function CandidateHome() {
    const user = await requireUser();
    if (user.role !== "candidate") redirect(ROLE_HOME[user.role]);

    const [row] = await db()
        .select({ id: schema.dashCase.id })
        .from(schema.dashCase)
        .where(eq(schema.dashCase.candidateId, user.id))
        .limit(1);
    const opened = row ? await openCase(user, row.id) : null;

    const consultant = opened?.case.consultantId
        ? (
              await db()
                  .select({ name: schema.user.name })
                  .from(schema.user)
                  .where(eq(schema.user.id, opened.case.consultantId))
                  .limit(1)
          )[0]
        : undefined;

    const stage = opened ? STAGES.find((s) => s.key === opened.case.stage) : undefined;

    return (
        <>
            <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="Your readiness file, in one place." />
            {!opened ? (
                <Card>
                    <p>We couldn't find your file yet. Your Simple Migrate contact will set it up shortly.</p>
                </Card>
            ) : (
                <div className="tw-grid tw-gap-6">
                    <Card title="Where you are">
                        <StageTracker stage={opened.case.stage} />
                        {stage && <p className="tw-mt-4 tw-text-md">{stage.candidateHint}</p>}
                    </Card>
                    <div className="tw-grid md:tw-grid-cols-2 tw-gap-6">
                        <Card title="Your consultant">
                            {consultant ? (
                                <p className="tw-mb-0">
                                    <strong className="tw-text-heading">{consultant.name}</strong>
                                    <span className="tw-block tw-text-md">Licensed consultant</span>
                                </p>
                            ) : (
                                <p className="tw-mb-0 tw-text-md">A licensed consultant will be assigned to your file soon.</p>
                            )}
                        </Card>
                        <Card title="Next steps">
                            <p className="tw-mb-0 tw-text-md">
                                Your intake questionnaire and document checklist will appear here once your consultant
                                opens them.
                            </p>
                        </Card>
                    </div>
                    <InfoNotice />
                </div>
            )}
        </>
    );
}
