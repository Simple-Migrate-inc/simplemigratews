import clsx from "clsx";
import { STAGES, stageIndex } from "@dashboard/cases";
import type { CaseStage } from "@dashboard/db/schema";

export default function StageTracker({ stage }: { stage: CaseStage }) {
    const current = stageIndex(stage);
    const steps = STAGES.filter((s) => s.key !== "closed");
    return (
        <ol className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-7 tw-gap-2" aria-label="Your progress">
            {steps.map((s, i) => {
                const state = i < current ? "done" : i === current ? "current" : "todo";
                return (
                    <li
                        key={s.key}
                        aria-current={state === "current" ? "step" : undefined}
                        className={clsx(
                            "tw-flex lg:tw-flex-col tw-items-center lg:tw-items-start tw-gap-2 tw-rounded tw-px-3 tw-py-2 tw-text-sm tw-border",
                            state === "done" && "tw-border-primary/30 tw-bg-primary/5 tw-text-primary",
                            state === "current" && "tw-border-primary tw-bg-primary tw-text-white",
                            state === "todo" && "tw-border-gray-500 tw-text-gray-300"
                        )}
                    >
                        <span className="tw-font-bold">
                            {state === "done" ? <i className="fas fa-check" aria-label="Done" /> : i + 1}
                        </span>
                        <span className="tw-font-medium">{s.label}</span>
                    </li>
                );
            })}
        </ol>
    );
}
