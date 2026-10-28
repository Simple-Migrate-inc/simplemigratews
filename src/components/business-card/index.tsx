import { forwardRef } from "react";
import clsx from "clsx";
import Anchor from "@ui/anchor";
import type { HighlightIcon, SignatureBusiness } from "@data/signature-businesses";

const ICONS: Record<HighlightIcon, string> = {
    children: "fas fa-child",
    staff: "fas fa-users",
    since: "fas fa-calendar-alt",
    rooms: "fas fa-bed",
    clients: "fas fa-home",
    treatments: "fas fa-spa",
};

type TProps = Omit<SignatureBusiness, "id"> & {
    className?: string;
};

const BusinessCard = forwardRef<HTMLDivElement, TProps>(
    ({ className, category, title, location, summary, highlights, image, path }, ref) => {
        return (
            <div
                className={clsx(
                    "tw-h-full tw-flex tw-flex-col tw-rounded tw-bg-white tw-relative",
                    "before:tw-absolute before:tw-content-[''] before:-tw-z-1 before:tw-inset-0 before:tw-shadow-4md before:tw-shadow-black/[0.12] before:tw-rounded-b before:tw-transition-opacity before:tw-opacity-0",
                    "hover:before:tw-opacity-100",
                    className
                )}
                ref={ref}
            >
                <figure className="tw-relative tw-overflow-hidden tw-rounded-t">
                    <img
                        className="tw-w-full tw-aspect-[4/3] tw-object-cover"
                        src={image.src}
                        alt={image.alt}
                        width={800}
                        height={600}
                        loading="lazy"
                    />
                    <span className="tw-absolute tw-top-4 tw-left-4 tw-bg-primary tw-text-white tw-text-sm tw-font-bold tw-uppercase tw-tracking-wider tw-rounded tw-px-3 tw-py-1">
                        {category}
                    </span>
                    <Anchor className="link-overlay" path={path}>
                        {title}
                    </Anchor>
                </figure>
                <div className="tw-flex tw-flex-col tw-flex-1 tw-p-[30px]">
                    <p className="tw-text-md tw-mb-2 tw-text-secondary-light">
                        <i className="fas fa-map-marker-alt tw-mr-2 tw-text-primary" />
                        {location}
                    </p>
                    <h3 className="tw-text-xl tw-leading-normal tw-mb-3">
                        <Anchor path={path}>{title}</Anchor>
                    </h3>
                    <p className="tw-text-md tw-mb-6">{summary}</p>
                    <ul className="tw-text-md tw-mt-auto tw-pt-6 tw-border-t tw-border-gray-500 tw-space-y-2">
                        {highlights.map((h) => (
                            <li key={h.label} className="tw-flex tw-items-center">
                                <i className={clsx(ICONS[h.icon], "tw-w-5 tw-mr-2.5 tw-text-primary tw-text-center")} />
                                {h.label}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    }
);

export default BusinessCard;
