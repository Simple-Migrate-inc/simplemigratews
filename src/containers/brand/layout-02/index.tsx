import { useMemo } from "react";
import Image from "next/image";
import Section from "@ui/section";
import SwiperSlider, { SwiperSlide } from "@ui/swiper";
import { motion } from "framer-motion";
import { scrollUpVariants } from "@utils/variants";
import { ItemType, TSection } from "@utils/types";

const AnimatedSwiper = motion(SwiperSlider);

type TProps = TSection & {
    data: {
        items?: ItemType[];
    };
};

const BrandArea = ({ data: { items }, space, bg }: TProps) => {
    const options = useMemo(() => {
        return {
            slidesPerView: 1,
            autoplay: false,
            breakpoints: {
                320: {
                    slidesPerView: 2,
                },
                576: {
                    slidesPerView: 4,
                },
                768: {
                    slidesPerView: 5,
                },
                992: {
                    slidesPerView: 6,
                },
            },
        };
    }, []);

    return (
        <Section className="brand-area" space={space} bg={bg}>
            <h2 className="tw-sr-only">Brand Area</h2>
            <div className="tw-container">
                {items && (
                    <AnimatedSwiper
                        options={options}
                        initial="offscreen"
                        whileInView="onscreen"
                        viewport={{ once: true, amount: 0.4 }}
                        variants={scrollUpVariants}
                    >
                        {items.map((item) => (
                            <SwiperSlide
                                key={item.id}
                                className="tw-flex tw-justify-center tw-my-auto tw-relative"
                            >
                                <Image
                                    className="fill-image tw-transition-all hover:tw-saturate-[1%]"
                                    src={item.images?.[0]?.src}
                                    alt={item.images?.[0]?.alt || "logo"}
                                    fill
                                    sizes="(max-width: 768px) 100vw,
                                    (max-width: 1200px) 100vw,
                                    100vw"
                                />
                            </SwiperSlide>
                        ))}
                    </AnimatedSwiper>
                )}
            </div>
        </Section>
    );
};

export default BrandArea;
