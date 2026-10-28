const TONES = {
    neutral: "tw-bg-gray-200 tw-text-heading",
    primary: "tw-bg-primary/10 tw-text-primary",
    warning: "tw-bg-warning/15 tw-text-[#8a6500]",
    danger: "tw-bg-danger/10 tw-text-danger",
    success: "tw-bg-success/10 tw-text-[#2e7d32]",
    secondary: "tw-bg-secondary/10 tw-text-secondary",
} as const;

export type PillTone = keyof typeof TONES;

export default function StatusPill({ tone = "neutral", children }: { tone?: PillTone; children: React.ReactNode }) {
    return (
        <span className={`tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-0.5 tw-text-sm tw-font-medium tw-whitespace-nowrap ${TONES[tone]}`}>
            {children}
        </span>
    );
}
