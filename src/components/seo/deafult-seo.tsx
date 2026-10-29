import { DefaultSeo } from "next-seo";
import siteConfig from "@data/site-config";

const SEO = () => {
    return (
        <DefaultSeo
            title={siteConfig.name}
            titleTemplate={`%s - ${siteConfig.titleTemplate}`}
            defaultTitle={siteConfig.name}
            description={siteConfig.description}
            canonical={`${siteConfig.url}/`}
            openGraph={{
                type: "website",
                locale: "en_CA",
                url: `${siteConfig.url}/`,
                site_name: siteConfig.name,
                title: siteConfig.titleTemplate,
                description: siteConfig.description,
                // Link-preview apps (WhatsApp, LinkedIn, iMessage) need an
                // absolute URL with no redirect, and WhatsApp ignores images
                // over ~300 KB — keep this file small.
                images: [
                    {
                        url: `${siteConfig.url}/images/seo/simplemigrate-og.jpg`,
                        width: 1200,
                        height: 800,
                        alt: "Simple Migrate — Global Business Buy & Sell and Immigration Experts",
                        type: "image/jpeg",
                    },
                ],
            }}
            twitter={{
                cardType: "summary_large_image",
            }}
            additionalMetaTags={[
                {
                    name: "viewport",
                    content:
                        "width=device-width, initial-scale=1 maximum-scale=1",
                },
                {
                    name: "apple-mobile-web-app-capable",
                    content: "yes",
                },
                {
                    name: "theme-color",
                    content: "#ffffff",
                },
            ]}
            additionalLinkTags={[
                {
                    rel: "icon",
                    href: "/favicon.ico",
                    sizes: "any",
                },
                {
                    rel: "apple-touch-icon",
                    href: "/icons/apple-touch-icon.png",
                },
                {
                    rel: "manifest",
                    href: "/manifest.json",
                },
            ]}
        />
    );
};
export default SEO;
