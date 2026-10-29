import { DefaultSeo } from "next-seo";
import siteConfig from "@data/site-config";

const SEO = () => {
    return (
        <DefaultSeo
            title={siteConfig.name}
            titleTemplate={`%s - ${siteConfig.titleTemplate}`}
            defaultTitle={siteConfig.name}
            description={siteConfig.description}
            canonical="https://simplemigrate.com/"
            openGraph={{
                type: "website",
                locale: "en_IE",
                site_name: siteConfig.name,
                images: [
                    {
                        url: "https://simplemigrate.com/images/seo/simplemigrate.png",
                        width: 800,
                        height: 600,
                        alt: "Simple Migrate",
                    },
                    {
                        url: "https://simplemigrate.com/images/seo/simplemigrate.png",
                        width: 900,
                        height: 800,
                        alt: "Simple Migrate",
                    },
                ],
            }}
            twitter={{
                handle: "@handle",
                site: "@site",
                cardType: "summary_large_image",
            }}
            facebook={{
                appId: "1234567890",
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
