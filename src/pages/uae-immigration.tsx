import type { GetStaticProps, NextPage } from "next";
import SEO from "@components/seo/page-seo";
import Layout from "@layout/layout-01";
import HeroArea from "@containers/hero/layout-07";
import TimelineArea from "@containers/timeline";
import CtaArea from "@containers/cta/layout-01";
import FaqArea from "@containers/faq/layout-02";

import { normalizedData } from "@utils/methods";
import { getPageData } from "../lib/page";

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
    Layout: typeof Layout;
};

const UaeImmigration: PageProps = ({ data }) => {
    const content = normalizedData<PageContent>(data.page?.content, "section");
    return (
        <>
            <SEO title="UAE Immigration" />
            <h1 className="tw-sr-only">UAE Immigration</h1>
            <HeroArea data={content?.["hero-area"]} textColor="black" />
            <TimelineArea data={content?.["timeline-area"]} />
            <CtaArea
                data={content?.["cta-area"]}
                space="bottom"
                showContactButtons
            />
            <FaqArea data={content?.["faq-area"]} />
        </>
    );
};

UaeImmigration.Layout = Layout;

export const getStaticProps: GetStaticProps = () => {
    const page = getPageData("inner", "uae-immigration");

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

export default UaeImmigration;
