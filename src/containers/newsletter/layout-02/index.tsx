import { motion } from "framer-motion";
import Section from "@ui/section";
import SectionTitle from "@components/section-title";
import { SectionTitleType, TSection } from "@utils/types";
import { scrollUpVariants } from "@utils/variants";

type TProps = TSection & {
    data: {
        section_title?: SectionTitleType;
    };
};

const NewsletterArea = ({
    data: { section_title },
    space,
    bg,
    titleSize,
}: TProps) => {
    return (
        <Section className="tw-relative" space={space} bg={bg}>
            <div className="tw-absolute tw-inset-0 -tw-z-1 child:tw-w-full child:tw-h-full child:tw-object-cover" style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            maxHeight: "350px"
        }}>
                <img src="/images/bg/subscribe-bg.jpg" alt="newsletter BG" />
            </div>
            <motion.div
                className="tw-container tw-relative"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.4 }}
                variants={scrollUpVariants}
            >
                {section_title && (
                    <SectionTitle
                        {...section_title}
                        color="C"
                        titleSize={titleSize}
                        descClass="tw-text-lg tw-font-medium"
                    />
                )}
             <iframe
                src="https://embeds.beehiiv.com/b580b9d5-5ce8-45d6-877f-d33996c74b4f?slim=true"
                data-test-id="beehiiv-embed"
                height="52"
                frameBorder="0"
                scrolling="no"
                style={{
                margin: "0 auto",
                borderRadius: "0px",
                backgroundColor: "transparent",
                width: "100%",
                maxWidth: "600px", // better than %
                display: "block",
                }}
            />
                {/* <NewsletterForm className="tw-mx-auto tw-mt-[50px]" /> */}
            </motion.div>
        </Section>
    );
};

export default NewsletterArea;
