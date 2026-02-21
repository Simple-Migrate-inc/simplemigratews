import type { GetStaticProps, NextPage } from "next";
import SEO from "@components/seo/page-seo";
import Layout01 from "@layout/layout-01";
import Breadcrumb from "@components/breadcrumb";
import HeroArea from "@containers/hero/layout-08";
import AboutArea from "@containers/about/layout-02";
import CourseArea from "@containers/course-full/layout-01";
import { ICourse } from "@utils/types";
import { normalizedData } from "@utils/methods";

import { getPageData } from "../lib/page";
import { getFilteredCourses } from "../lib/course";

interface PageContent {
    section: string;
}

type TProps = {
    data: {
        page: {
            content: PageContent[];
        };
        courses: ICourse[];
    };
};

type PageProps = NextPage<TProps> & {
    Layout: typeof Layout01;
};

const FoodBeverageRestaurantFranchisesPage: PageProps = ({ data }) => {
    const content = normalizedData<PageContent>(data.page?.content, "section");
    const courses = data?.courses ?? [];
    const heroData = {
        images: [
            {
                src: "/images/business-buy/daycare.png",
                alt: "Food & Beverage / Restaurant",
            },
        ],
        headings: [
            {
                id: "food-beverage-restaurant-franchises",
                content: "Food & Beverage / Restaurant",
            },
        ],
    };

    return (
        <>
            <SEO title="Food & Beverage / Restaurant" />
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
                currentPage="Food & Beverage / Restaurant"
            />
            <CourseArea data={{ courses }} />
        </>
    );
};

FoodBeverageRestaurantFranchisesPage.Layout = Layout01;

export const getStaticProps: GetStaticProps = () => {
    const page = getPageData("inner", "food-beverage-restaurant-franchises");
    const courses = getFilteredCourses(
        [
            "slug",
            "title",
            "thumbnail",
            "price",
            "currency",
            "total_lectures",
            "total_students",
            "published_at",
            "category",
        ],
        "category",
        "Food & Beverage / Restaurant"
    ).slice(0, 3);
    return {
        props: {
            data: {
                page,
                courses,
            },
            layout: {
                headerShadow: true,
                headerFluid: false,
                footerMode: "light",
            },
        },
    };
};

export default FoodBeverageRestaurantFranchisesPage;
