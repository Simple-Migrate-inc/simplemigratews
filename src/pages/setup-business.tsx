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

const SetupBusiness: PageProps = ({ data }) => {
    const content = normalizedData<PageContent>(data.page?.content, "section");
    return (
        <>
            <SEO title="Setup Business" />
            <h1 className="tw-sr-only">Setup Business</h1>
            <HeroArea
                data={content?.["hero-area"]}
                textColor="black"
                textBackground="white"
            />
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

SetupBusiness.Layout = Layout;

export const getStaticProps: GetStaticProps = () => {
    const page = getPageData("inner", "setup-business");

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

export default SetupBusiness;
