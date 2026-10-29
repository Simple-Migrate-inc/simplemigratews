import { motion } from "framer-motion";
import Section from "@ui/section";
import BusinessListingCard from "@components/business-listing-card";
import Button from "@ui/button";
import { scrollUpVariants } from "@utils/variants";
import type { BusinessListing } from "@data/business-listings";

const AnimatedCard = motion(BusinessListingCard);

type TProps = { listings: BusinessListing[]; industryLabel: string };

const BusinessListingsArea = ({ listings, industryLabel }: TProps) => (
    <Section className="business-listings-area" space="bottom">
        <h2 className="tw-sr-only">{industryLabel} listings</h2>
        <div className="tw-container">
            <p className="tw-mb-5">
                Showing {listings.length} sample listings in {industryLabel}. Pricing and financials are
                shared with qualified buyers under a confidentiality agreement.
            </p>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-[30px]">
                {listings.map((listing) => (
                    <AnimatedCard
                        key={listing.slug}
                        listing={listing}
                        initial="offscreen"
                        whileInView="onscreen"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={scrollUpVariants}
                    />
                ))}
            </div>
            <div className="tw-text-center tw-mt-[50px]">
                <Button path="/contact-us">
                    Ask about current opportunities{" "}
                    <i className="fas fa-arrow-right tw-ml-3" />
                </Button>
                <p className="tw-text-sm tw-mt-4 tw-mb-0">
                    Listings shown are illustrative examples. Contact us for current opportunities.
                </p>
            </div>
        </div>
    </Section>
);

export default BusinessListingsArea;
