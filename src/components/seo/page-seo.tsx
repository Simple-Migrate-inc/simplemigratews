import { useRouter } from "next/router";
import { NextSeo, NextSeoProps, ArticleJsonLd, CourseJsonLd } from "next-seo";
import siteConfig from "@data/site-config";

interface SeoProps extends NextSeoProps {
    template?: string;
    jsonLdType?: "article" | "course";
    article?: {
        publishedTime: string;
        modifiedTime: string;
        authors: string[];
        tags: string[];
    };
    image?: string;
    instructor?: {
        name: string;
        path: string;
    };
}

const PageSeo = ({
    title,
    description,
    template,
    openGraph,
    jsonLdType,
    article,
    image,
    instructor,
}: SeoProps) => {
    // Server-rendered so crawlers see each page's own URL (not the home page).
    const { asPath } = useRouter();
    const path = asPath.split(/[?#]/)[0];
    const href = `${siteConfig.url}${path === "/" ? "/" : path}`;

    // Preview crawlers need absolute image URLs.
    const imageUrl = image?.startsWith("/") ? `${siteConfig.url}${image}` : image;

    const articleMeta = jsonLdType === "article" && {
        type: "article",
        ...article,
        images: [
            {
                url: imageUrl as string,
                width: 800,
                height: 600,
                alt: title,
            },
            {
                url: imageUrl as string,
                width: 900,
                height: 800,
                alt: title,
            },
        ],
    };

    return (
        <>
            <NextSeo
                title={title}
                titleTemplate={
                    template
                        ? `${title as string} - ${template}`
                        : siteConfig.titleTemplate
                }
                description={description}
                canonical={href}
                openGraph={{
                    url: href,
                    title,
                    description,
                    ...openGraph,
                    ...articleMeta,
                }}
            />
            {jsonLdType === "article" && article && (
                <ArticleJsonLd
                    type="Blog"
                    url={href}
                    title={title as string}
                    images={[imageUrl as string]}
                    datePublished={article.publishedTime}
                    dateModified={article.modifiedTime}
                    authorName={article.authors[0]}
                    description={description as string}
                />
            )}
            {jsonLdType === "course" && instructor && (
                <CourseJsonLd
                    courseName={title as string}
                    description="Introductory CS course laying out the basics."
                    provider={{
                        name: instructor.name,
                        url: href,
                    }}
                />
            )}
        </>
    );
};

PageSeo.defaultProps = {
    template: siteConfig.name,
};

export default PageSeo;
