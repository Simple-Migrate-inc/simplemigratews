import Link from "next/link";

/** Centered card used by sign-in, invitation and MFA screens. */
export default function AuthCard({
    title,
    subtitle,
    children,
}: {
    title: string;
    subtitle?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <main className="tw-min-h-screen tw-flex tw-flex-col tw-items-center tw-justify-center tw-px-4 tw-py-10">
            <Link href="/" className="tw-mb-8" aria-label="Simple Migrate home">
                <img src="/images/logo/sm-logo.png" alt="Simple Migrate" width={170} height={40} />
            </Link>
            <div className="tw-w-full tw-max-w-[440px] tw-bg-white tw-rounded-lg tw-shadow-xs tw-shadow-heading/10 tw-border tw-border-gray-500 tw-p-6 sm:tw-p-10">
                <h1 className="tw-text-h3 tw-mb-2">{title}</h1>
                {subtitle && <div className="tw-text-md tw-mb-6">{subtitle}</div>}
                {children}
            </div>
            <p className="tw-text-sm tw-mt-6 tw-text-gray-300 tw-text-center tw-max-w-[440px]">
                Information only — eligibility is decided by the program and confirmed by a
                licensed professional.
            </p>
        </main>
    );
}
