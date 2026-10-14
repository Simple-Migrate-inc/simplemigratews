import type { CaseStage } from "./db/schema";

export const STAGES: { key: CaseStage; label: string; candidateHint: string }[] = [
    { key: "invited", label: "Invited", candidateHint: "Your account is set up. Your consultant will open your intake shortly." },
    { key: "intake_in_progress", label: "Intake", candidateHint: "Tell us about your goals, experience and funds." },
    { key: "intake_review", label: "Intake review", candidateHint: "Your consultant is reviewing your intake." },
    { key: "documents_in_progress", label: "Documents", candidateHint: "Upload the documents on your checklist." },
    { key: "readiness_released", label: "Readiness summary", candidateHint: "Your licensed consultant has released your readiness summary." },
    { key: "shortlist_active", label: "Business shortlist", candidateHint: "Review the businesses your consultant shortlisted." },
    { key: "referred", label: "Referred", candidateHint: "You've been introduced to partners you approved." },
    { key: "closed", label: "Closed", candidateHint: "This file is closed." },
];

export function stageIndex(stage: CaseStage): number {
    return STAGES.findIndex((s) => s.key === stage);
}

export function stageLabel(stage: CaseStage): string {
    return STAGES.find((s) => s.key === stage)?.label ?? stage;
}
