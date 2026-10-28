/** Standing notice required on readiness, shortlist and pathway screens. */
export default function InfoNotice({ className = "" }: { className?: string }) {
    return (
        <p
            className={`tw-flex tw-items-start tw-gap-2 tw-bg-white tw-border tw-border-l-4 tw-border-gray-500 tw-border-l-secondary tw-rounded tw-px-4 tw-py-3 tw-text-md ${className}`}
        >
            <i className="fas fa-info-circle tw-text-secondary tw-mt-1" aria-hidden />
            <span>
                Information only — eligibility is decided by the program and confirmed by a licensed
                professional.
            </span>
        </p>
    );
}
