import type { GetStaticProps, NextPage } from "next";
import SEO from "@components/seo/page-seo";
import Layout01 from "@layout/layout-01";
import Breadcrumb from "@components/breadcrumb";
import HeroArea from "@containers/hero/layout-08";
import AboutArea from "@containers/about/layout-02";
import BusinessListingsArea from "@containers/business-listings";
import { normalizedData } from "@utils/methods";

import { getPageData } from "../lib/page";
import { INDUSTRIES, listingsForIndustry } from "@data/business-listings";

interface PageContent {
    section: string;
}

type TProps = {
    data: {
        page: {
            content: PageContent[];
        };
    };
};

type PageProps = NextPage<TProps> & {
    Layout: typeof Layout01;
};

const GasStationsConvenienceStores: PageProps = ({ data }) => {
    const content = normalizedData<PageContent>(data.page?.content, "section");
    const heroData = {
        images: [
            {
                src: "/images/business-buy/gas-station.png",
                alt: "Gas Stations & Convenience Stores",
            },
        ],
        headings: [
            {
                id: "gas-stations-convenience-stores",
                content: "Gas Stations & Convenience Stores",
            },
        ],
    };

    return (
        <>
            <SEO title="Gas Stations & Convenience Stores" />
            <HeroArea
                data={heroData}
                headingClassName="tw-max-w-[700px] lg:tw-max-w-[770px] tw-mx-auto tw-text-center tw-text-h3 tw-leading-normal md:tw-text-[32px] lg:tw-text-[34px] lg:tw-leading-[1.4] tw-text-black tw-mb-0 tw-inline-block tw-bg-white/50 tw-backdrop-blur-sm tw-px-6 tw-py-3 tw-rounded-lg"
            />
            <AboutArea
                data={content?.["about-area"]}
                bg="tw-bg-white"
                space="top-bottom-3"
                titleSize="large"
                showContactButtons
            />
            <Breadcrumb
                pages={[{ path: "/", label: "home" }]}
                currentPage="Gas Stations & Convenience Stores"
            />
            <BusinessListingsArea
                listings={listingsForIndustry("gas-stations-convenience-stores")}
                industryLabel={INDUSTRIES["gas-stations-convenience-stores"].label}
            />
        </>
    );
};

GasStationsConvenienceStores.Layout = Layout01;

export const getStaticProps: GetStaticProps = () => {
    const page = getPageData("inner", "gas-stations-convenience-stores");
    return {
        props: {
            data: {
                page,
            },
            layout: {
                headerShadow: true,
                headerFluid: false,
                footerMode: "light",
            },
        },
    };
};

export default GasStationsConvenienceStores;
