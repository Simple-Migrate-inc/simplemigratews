import { forwardRef } from "react";
import clsx from "clsx";
import Anchor from "@ui/anchor";
import {
    type BusinessListing,
    type ListingIcon,
    INDUSTRIES,
    listingPath,
} from "@data/business-listings";

// Kept in .tsx so Tailwind/PurgeCSS see the icon class names.
export const LISTING_ICONS: Record<ListingIcon, string> = {
    children: "fas fa-child",
    staff: "fas fa-users",
    since: "fas fa-calendar-alt",
    rooms: "fas fa-bed",
    clients: "fas fa-user-friends",
    fuel: "fas fa-gas-pump",
    store: "fas fa-store",
    size: "fas fa-ruler-combined",
    seats: "fas fa-chair",
    truck: "fas fa-truck",
    code: "fas fa-laptop-code",
    machinery: "fas fa-cogs",
    coffee: "fas fa-mug-hot",
    dining: "fas fa-utensils",
    campsite: "fas fa-campground",
    security: "fas fa-shield-alt",
    network: "fas fa-network-wired",
    growth: "fas fa-chart-line",
    care: "fas fa-heart",
    fitness: "fas fa-dumbbell",
    handshake: "fas fa-handshake",
    invoice: "fas fa-file-invoice-dollar",
    warehouse: "fas fa-warehouse",
    home: "fas fa-home",
};

type TProps = { listing: BusinessListing; className?: string };

const BusinessListingCard = forwardRef<HTMLDivElement, TProps>(({ listing, className }, ref) => {
    const path = listingPath(listing.slug);
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
                    src={listing.image.src}
                    alt={listing.image.alt}
                    width={800}
                    height={600}
                    loading="lazy"
                />
                <span className="tw-absolute tw-top-4 tw-left-4 tw-right-4 tw-w-fit tw-bg-primary tw-text-white tw-text-sm tw-font-bold tw-uppercase tw-tracking-wider tw-rounded tw-px-3 tw-py-1">
                    {INDUSTRIES[listing.industry].label}
                </span>
                <span className="tw-absolute tw-bottom-4 tw-right-4 tw-bg-white/90 tw-text-secondary tw-text-sm tw-font-medium tw-rounded tw-px-2.5 tw-py-1">
                    Sample listing
                </span>
                <Anchor className="link-overlay" path={path}>
                    {listing.title}
                </Anchor>
            </figure>
            <div className="tw-flex tw-flex-col tw-flex-1 tw-p-[30px]">
                <p className="tw-text-md tw-mb-2 tw-text-secondary-light">
                    <i className="fas fa-map-marker-alt tw-mr-2 tw-text-primary" />
                    {listing.location}
                </p>
                <h3 className="tw-text-xl tw-leading-normal tw-mb-3">
                    <Anchor path={path}>{listing.title}</Anchor>
                </h3>
                <p className="tw-text-md tw-mb-6">{listing.summary}</p>
                <ul className="tw-text-md tw-mt-auto tw-pt-6 tw-border-t tw-border-gray-500 tw-space-y-2">
                    {listing.highlights.map((h) => (
                        <li key={h.label} className="tw-flex tw-items-center">
                            <i className={clsx(LISTING_ICONS[h.icon], "tw-w-5 tw-mr-2.5 tw-text-primary tw-text-center")} />
                            {h.label}
                        </li>
                    ))}
                </ul>
                <Anchor path={path} className="tw-mt-6 tw-font-bold tw-text-primary hover:tw-text-secondary">
                    View details <i className="fas fa-arrow-right tw-ml-2" />
                </Anchor>
            </div>
        </div>
    );
});

export default BusinessListingCard;
