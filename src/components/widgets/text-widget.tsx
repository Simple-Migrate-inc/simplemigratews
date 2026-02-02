import clsx from "clsx";
import Social, { SocialLink } from "@components/ui/social";
import WidgetTitle from "./widget-title";

type TProps = {
    className?: string;
    mode?: "light" | "dark";
};

const TextWidget = ({ className, mode }: TProps) => {
    return (
        <div className={clsx(className)}>
            <WidgetTitle mode={mode}>Address</WidgetTitle>
            <div
                className={clsx(
                    "content ",
                    mode === "dark" && "tw-text-gray-400"
                )}
            >
                <p className="tw-mb-[11px]">
                    382 NE 191st St # 87394 Miami, FL 33179-3899
                </p>
                <p className="tw-mb-[11px]">
                    +1 (305) 547-9909 (9am - 5pm EST, Monday - Friday){" "}
                </p>
                <p className="tw-mb-[11px]">
                    <a
                        href="#!"
                        className={clsx(
                            "hover:tw-text-primary",
                            mode === "dark" && "tw-text-gray-400"
                        )}
                    >
                        info@example.com{" "}
                    </a>
                </p>
            </div>
            <Social
                color={mode === "dark" ? "white" : "light"}
                className="tw-gap-6.1 tw-mt-6.1"
            >   
                <SocialLink href="https://www.facebook.com/profile.php?id=100086938543826" label="Facebook lnik">
                    <i className="fab fa-facebook-square" />
                </SocialLink>
                <SocialLink href="http://x.com/SimpleMigrate" label="X link">
                    <i className="fa-brands fa-x-twitter" />
                </SocialLink>
                <SocialLink href="https://www.instagram.com/simplemigrate" label="instagram lnik">
                    <i className="fab fa-instagram" />
                </SocialLink>
                <SocialLink href="https://www.linkedin.com/company/simplemigrate" label="linkedin lnik">
                    <i className="fab fa-linkedin" />
                </SocialLink>
                <SocialLink
                    href="https://www.tiktok.com/@simplemigrate"
                    label="TikTok link"
                >
                    <i className="fa-brands fa-tiktok" />
                </SocialLink>
            </Social>
        </div>
    );
};

export default TextWidget;
