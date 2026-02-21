import { useState } from "react";
import { motion } from "framer-motion";
import Section from "@ui/section";
import SectionTitle from "@components/section-title";
import Button from "@ui/button";
import ScheduleCallModal from "@components/modals/schedule-call-modal";
import EnquiryModal from "@components/modals/enquiry-modal";
import { scrollUpVariants } from "@utils/variants";
import { ButtonType, SectionTitleType, TSection } from "@utils/types";

type TProps = TSection & {
    data: {
        section_title?: SectionTitleType;
        buttons?: ButtonType[];
    };
    showContactButtons?: boolean;
};

const CtaArea = ({
    data: { section_title, buttons },
    space,
    bg,
    titleSize,
    showContactButtons,
}: TProps) => {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showEnquiryModal, setShowEnquiryModal] = useState(false);

    return (
        <Section className="cta-area" space={space} bg={bg}>
            <motion.div
                className="tw-container tw-text-center"
                initial="offscreen"
                whileInView="onscreen"
                viewport={{ once: true, amount: 0.4 }}
                variants={scrollUpVariants}
            >
                {section_title && (
                    <SectionTitle
                        {...section_title}
                        color="B"
                        titleSize={titleSize}
                        subtitleClass="tw-mb-8"
                    />
                )}
                {showContactButtons ? (
                    <div className="tw-mt-7 tw-flex tw-flex-wrap tw-justify-center tw-gap-3">
                        <Button onClick={() => setShowScheduleModal(true)}>
                            Schedule a call
                        </Button>
                        <Button onClick={() => setShowEnquiryModal(true)}>
                            Enquire now
                        </Button>
                    </div>
                ) : (
                    buttons?.map(({ id, content, ...rest }) => (
                        <Button key={id} className="tw-mt-7" {...rest}>
                            {content}
                        </Button>
                    ))
                )}
            </motion.div>
            <ScheduleCallModal
                show={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
            />
            <EnquiryModal
                show={showEnquiryModal}
                onClose={() => setShowEnquiryModal(false)}
            />
        </Section>
    );
};

export default CtaArea;
