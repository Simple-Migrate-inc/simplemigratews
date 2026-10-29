import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import clsx from "clsx";
import SEO from "@components/seo/page-seo";
import Layout01 from "@layout/layout-01";
import Breadcrumb from "@components/breadcrumb";
import Button from "@ui/button";
import BusinessListingCard, { LISTING_ICONS } from "@components/business-listing-card";
import {
    type BusinessListing,
    INDUSTRIES,
    businessListings,
    getListingBySlug,
    listingsForIndustry,
} from "@data/business-listings";

type TProps = {
    listing: BusinessListing;
    related: BusinessListing[];
};

type PageProps = NextPage<TProps> & {
    Layout: typeof Layout01;
};

const BusinessListingPage: PageProps = ({ listing, related }) => {
    const industry = INDUSTRIES[listing.industry];
    return (
        <>
            <SEO title={listing.title} description={listing.summary} image={listing.image.src} />
            <Breadcrumb
                pages={[
                    { path: "/", label: "home" },
                    { path: industry.path, label: industry.label },
                ]}
                currentPage={listing.title}
                showTitle={false}
            />
            <article className="tw-container tw-pb-15 md:tw-pb-20">
                <div className="tw-grid lg:tw-grid-cols-[minmax(0,1fr)_370px] tw-gap-10 lg:tw-gap-15">
                    <div>
                        <figure className="tw-relative tw-mb-7.5">
                            <img
                                className="tw-w-full tw-rounded tw-aspect-[4/3] md:tw-aspect-[16/9] tw-object-cover"
                                src={listing.image.src}
                                alt={listing.image.alt}
                                width={800}
                                height={600}
                            />
                            <span className="tw-absolute tw-top-4 tw-left-4 tw-bg-primary tw-text-white tw-text-sm tw-font-bold tw-uppercase tw-tracking-wider tw-rounded tw-px-3 tw-py-1">
                                {industry.label}
                            </span>
                        </figure>
                        <p className="tw-text-md tw-mb-2 tw-text-secondary-light">
                            <i className="fas fa-map-marker-alt tw-mr-2 tw-text-primary" />
                            {listing.location}
                        </p>
                        <h1 className="tw-text-h2 md:tw-text-[40px] tw-leading-tight tw-mb-5">{listing.title}</h1>
                        <p className="tw-text-lg tw-text-heading tw-mb-7.5">{listing.summary}</p>

                        <ul className="tw-grid sm:tw-grid-cols-3 tw-gap-4 tw-mb-10">
                            {listing.highlights.map((h) => (
                                <li
                                    key={h.label}
                                    className="tw-bg-light-50 tw-border tw-border-gray-500 tw-rounded tw-p-4 tw-flex tw-items-start tw-gap-3"
                                >
                                    <i className={clsx(LISTING_ICONS[h.icon], "tw-text-primary tw-text-xl tw-mt-0.5")} />
                                    <span className="tw-text-md tw-font-medium tw-text-heading">{h.label}</span>
                                </li>
                            ))}
                        </ul>

                        <h2 className="tw-text-h4 tw-mb-4">Overview</h2>
                        {listing.overview.map((p) => (
                            <p key={p.slice(0, 32)}>{p}</p>
                        ))}

                        <h2 className="tw-text-h4 tw-mt-10 tw-mb-4">Business details</h2>
                        <dl className="tw-border-t tw-border-gray-500">
                            {listing.details.map((d) => (
                                <div
                                    key={d.label}
                                    className="tw-grid sm:tw-grid-cols-[220px_1fr] tw-gap-1 sm:tw-gap-6 tw-py-3.8 tw-border-b tw-border-gray-500"
                                >
                                    <dt className="tw-font-medium tw-text-heading">{d.label}</dt>
                                    <dd>{d.value}</dd>
                                </div>
                            ))}
                        </dl>

                        <h2 className="tw-text-h4 tw-mt-10 tw-mb-4">Ideal buyer</h2>
                        <p>{listing.idealBuyer}</p>
                    </div>

                    <aside>
                        <div className="tw-bg-white tw-border tw-border-gray-500 tw-rounded tw-p-7.5 lg:tw-sticky lg:tw-top-28">
                            <span className="tw-inline-block tw-bg-secondary/10 tw-text-secondary tw-text-sm tw-font-medium tw-rounded tw-px-2.5 tw-py-1 tw-mb-4">
                                Sample listing
                            </span>
                            <h2 className="tw-text-h5 tw-mb-3">Interested in a business like this?</h2>
                            <p className="tw-text-md">
                                Pricing, financial statements and the business name are shared with qualified buyers
                                after signing a confidentiality agreement.
                            </p>
                            <Button path="/contact-us" fullwidth className="tw-mt-2 tw-mb-3">
                                Request details
                            </Button>
                            <Button path="/start-here" variant="outlined" fullwidth>
                                Book a strategy call
                            </Button>
                            <p className="tw-text-sm tw-mt-5 tw-mb-0">
                                Information only — immigration eligibility is decided by the program and confirmed by a
                                licensed professional.
                            </p>
                        </div>
                    </aside>
                </div>

                {related.length > 0 && (
                    <section className="tw-mt-15 md:tw-mt-20">
                        <h2 className="tw-text-h3 tw-mb-7.5">More listings in {industry.label}</h2>
                        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-[30px]">
                            {related.map((r) => (
                                <BusinessListingCard key={r.slug} listing={r} />
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
};

BusinessListingPage.Layout = Layout01;

export const getStaticPaths: GetStaticPaths = () => ({
    paths: businessListings.map((l) => ({ params: { slug: l.slug } })),
    fallback: false,
});

export const getStaticProps: GetStaticProps<TProps, { slug: string }> = ({ params }) => {
    const listing = params ? getListingBySlug(params.slug) : undefined;
    if (!listing) return { notFound: true };
    return {
        props: {
            listing,
            related: listingsForIndustry(listing.industry).filter((l) => l.slug !== listing.slug),
            layout: { headerShadow: true, headerFluid: false, footerMode: "light" },
        },
    };
};

export default BusinessListingPage;
