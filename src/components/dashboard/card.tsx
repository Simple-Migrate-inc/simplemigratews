export default function Card({
    title,
    children,
    className = "",
    actions,
}: {
    title?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    actions?: React.ReactNode;
}) {
    return (
        <section className={`tw-bg-white tw-rounded-lg tw-border tw-border-gray-500 tw-p-5 md:tw-p-7.5 ${className}`}>
            {(title || actions) && (
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-mb-4">
                    {title && <h2 className="tw-text-h5 tw-mb-0">{title}</h2>}
                    {actions}
                </div>
            )}
            {children}
        </section>
    );
}
