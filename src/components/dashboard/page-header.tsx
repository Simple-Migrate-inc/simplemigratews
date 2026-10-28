export default function PageHeader({
    title,
    description,
    actions,
}: {
    title: string;
    description?: React.ReactNode;
    actions?: React.ReactNode;
}) {
    return (
        <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-4 tw-mb-7.5">
            <div>
                <h1 className="tw-text-h3 md:tw-text-h2 tw-mb-1">{title}</h1>
                {description && <p className="tw-text-md">{description}</p>}
            </div>
            {actions && <div className="tw-flex tw-gap-3">{actions}</div>}
        </div>
    );
}
