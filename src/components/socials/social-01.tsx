import clsx from "clsx";
import Social, { SocialLink } from "@ui/social";

const Social01 = ({ className }: { className?: string }) => (
    <Social color="dark" size="lg" className={clsx(className)}>
        <SocialLink
            href="https://x.com/SimpleMigrate"
            label="X"
            className="tw-px-2.5"
        >
            <i className="fa-brands fa-twitter" />
        </SocialLink>
        <SocialLink
            href="https://www.facebook.com/profile.php?id=100086938543826"
            label="facebook"
            className="tw-px-2.5"
        >
            <i className="fab fa-facebook-f" />
        </SocialLink>
        <SocialLink
            href="https://www.instagram.com/simplemigrate"
            label="instagram"
            className="tw-px-2.5"
        >
            <i className="fab fa-instagram" />
        </SocialLink> 
        <SocialLink
            href="https://www.linkedin.com/company/simple-migrate"
            label="linkedin"
            className="tw-px-2.5"
        >
            <i className="fab fa-linkedin" />
        </SocialLink>
    </Social>
);

export default Social01;
