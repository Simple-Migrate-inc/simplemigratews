import { motion } from "framer-motion";
import Section from "@ui/section";
import SectionTitle from "@components/section-title";
import BusinessCard from "@components/business-card";
import Button from "@ui/button";
import { scrollUpVariants } from "@utils/variants";
import { SectionTitleType, TSection } from "@utils/types";
import type { SignatureBusiness } from "@data/signature-businesses";

const AnimatedSectionTitle = motion(SectionTitle);
const AnimatedBusinessCard = motion(BusinessCard);

type TProps = TSection & {
    data: {
        section_title?: SectionTitleType;
        businesses: SignatureBusiness[];
    };
};

const SignatureBusinessArea = ({ data: { section_title, businesses }, space, bg, titleSize }: TProps) => {
    return (
        <Section className="signature-business-area" space={space} bg={bg}>
            <div className="tw-container">
                {section_title && (
                    <AnimatedSectionTitle
                        {...section_title}
                        titleSize={titleSize}
                        className="tw-mb-7.5 md:tw-mb-15"
                        initial="offscreen"
                        whileInView="onscreen"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={scrollUpVariants}
                    />
                )}
                <div className="tw-grid md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-7.5">
                    {businesses.map(({ id, ...business }) => (
                        <AnimatedBusinessCard
                            key={id}
                            {...business}
                            initial="offscreen"
                            whileInView="onscreen"
                            viewport={{ once: true, amount: 0.2 }}
                            variants={scrollUpVariants}
                        />
                    ))}
                </div>
                <motion.div
                    className="tw-text-center"
                    initial="offscreen"
                    whileInView="onscreen"
                    viewport={{ once: true, amount: 0.4 }}
                    variants={scrollUpVariants}
                >
                    <Button path="/contact-us" className="tw-mt-[50px]">
                        Ask about these businesses <i className="fas fa-arrow-right tw-ml-3" />
                    </Button>
                    <p className="tw-text-sm tw-mt-4 tw-mb-0">
                        Examples shown for illustration. Contact us for current opportunities.
                    </p>
                </motion.div>
            </div>
        </Section>
    );
};

export default SignatureBusinessArea;
