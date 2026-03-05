import { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Typewriter } from "react-simple-typewriter";
import Button from "@ui/button";
import BottomShape from "@components/ui/bottom-shape/shape-02";
import ScheduleCallModal from "@components/modals/schedule-call-modal";
import EnquiryModal from "@components/modals/enquiry-modal";
import {
    ButtonType,
    HeadingType,
    ImageType,
    TextType,
} from "@utils/types";
import { scrollUpVariants } from "@utils/variants";

type TProps = {
    data: {
        images?: ImageType[];
        headings?: HeadingType[];
        texts?: TextType[];
        buttons?: ButtonType[];
    };
};

const HeroArea = ({
    data: { images, headings, texts, buttons },
}: TProps) => {
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showEnquiryModal, setShowEnquiryModal] = useState(false);

    // Typewriter words (everything after the first heading)
    const words =
        headings?.slice(1, headings.length).map((heading) => heading.content) ||
        [];

    /**
     * Background VIDEO CAROUSEL
     * Put these files in: /public/videos/
     * and reference with leading "/" like below.
     */
    const videoSources = useMemo(
        () => [
            "/videos/simplemigrate-carousel.mp4",
            // "/videos/hero-2.mp4",
            // "/videos/hero-3.mp4",
        ],
        []
    );

    const [bgIndex, setBgIndex] = useState(0);

    useEffect(() => {
        if (!videoSources.length) return;

        const id = window.setInterval(() => {
            setBgIndex((i) => (i + 1) % videoSources.length);
        }, 8000); // change every 8 seconds

        return () => window.clearInterval(id);
    }, [videoSources]);

    return (
        <>
            <div className="hero-area tw-relative tw-pt-[100px] tw-pb-[130px] md:tw-py-[170px] xl:tw-pt-[270px] xl:tw-pb-[248px]">
                {/* Background: VIDEO carousel (fallback to image if no videos) */}
                <div className="tw-absolute tw-inset-0 -tw-z-10 tw-overflow-hidden">
                    {videoSources.length > 0 ? (
                        <>
                            <AnimatePresence mode="wait">
                                <motion.video
                                    key={videoSources[bgIndex]}
                                    autoPlay
                                    muted
                                    loop
                                    playsInline
                                    preload="auto"
                                    className="tw-w-full tw-h-full tw-object-cover"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <source
                                        src={videoSources[bgIndex]}
                                        type="video/mp4"
                                    />
                                    Your browser does not support the video tag.
                                </motion.video>
                            </AnimatePresence>

                            {/* Dark overlay so text stays readable */}
                            <div className="tw-absolute tw-inset-0 tw-bg-black/40" />
                        </>
                    ) : images?.[0]?.src ? (
                        <>
                            <img
                                src={images[0].src}
                                alt={images[0]?.alt || "bg"}
                                loading="eager"
                                className="tw-w-full tw-h-full tw-object-cover"
                            />
                            <div className="tw-absolute tw-inset-0 tw-bg-black/40" />
                        </>
                    ) : (
                        <div className="tw-w-full tw-h-full tw-bg-black" />
                    )}
                </div>

                <motion.div
                    className="tw-container tw-text-center"
                    initial="offscreen"
                    whileInView="onscreen"
                    viewport={{ once: true, amount: 0.1 }}
                    variants={scrollUpVariants}
                >
                    {headings?.[0]?.content && (
                        <h1 className="tw-text-[46px] lg:tw-text-[56px] tw-leading-tight tw-font-medium tw-text-white">
                            {headings[0].content}{" "}
                            <span className="tw-text-primary tw-inline-block">
                                <Typewriter words={words} loop cursor />
                            </span>
                        </h1>
                    )}

                    {texts?.map((text) => (
                        <p
                            key={text.id}
                            className="tw-text-lg tw-font-medium tw-leading-relaxed tw-text-white tw-mb-5 sm:tw-mb-8"
                        >
                            {text.content}
                        </p>
                    ))}

                    <div className="tw-flex tw-items-center tw-justify-center tw-flex-wrap">
                        {buttons?.[0] && (
                            <Button
                                {...buttons[0]}
                                path={undefined}
                                className="tw-m-2.5"
                                onClick={() => setShowScheduleModal(true)}
                            >
                                {buttons[0].content}
                            </Button>
                        )}

                        {buttons?.[1] && (
                            <Button
                                {...buttons[1]}
                                path={undefined}
                                className="tw-m-2.5"
                                onClick={() => setShowEnquiryModal(true)}
                            >
                                <i
                                    className={clsx(
                                        buttons[1]?.icon,
                                        "tw-mr-4"
                                    )}
                                />
                                {buttons[1].content}
                            </Button>
                        )}
                    </div>
                </motion.div>

                <BottomShape color="tw-fill-light-100" />
            </div>
            <ScheduleCallModal
                show={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
            />
            <EnquiryModal
                show={showEnquiryModal}
                onClose={() => setShowEnquiryModal(false)}
            />
        </>
    );
};

export default HeroArea;
