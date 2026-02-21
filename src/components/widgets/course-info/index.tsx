/* eslint-disable react/jsx-no-useless-fragment */
import { useState } from "react";
import dayjs from "dayjs";
import Router from "next/router";
import Button from "@ui/button";
import SocialShare from "@components/social-share/layout-01";
import EnrollModal from "@components/modals/enroll-modal";
import ScheduleCallModal from "@components/modals/schedule-call-modal";
import EnquiryModal from "@components/modals/enquiry-modal";
import { useUser } from "@contexts/user-context";
import { useMount } from "@hooks";
import CourseInfoItem from "./item";

type TProps = {
    lessonLink: string;
    slug: string;
    price: number;
    currency: string;
    instructor: string;
    duration: string;
    lectures: number;
    students: number;
    language: string;
    published_at: string;
};

const CourseInfo = ({
    lessonLink: _lessonLink,
    slug,
    price,
    currency,
    instructor,
    duration,
    lectures,
    students,
    language,
    published_at,
}: TProps) => {
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [showEnquiryModal, setShowEnquiryModal] = useState(false);
    const mounted = useMount();
    const { courseProgress } = useUser();
    const enrolledCourse = courseProgress.find((cs) => cs.course === slug);

    const continueHandler = () => {
        if (enrolledCourse) {
            void Router.push(enrolledCourse.currentLesson);
        }
    };

    if (!mounted) return null;

    return (
        <>
            <div className="course-info-widget tw-pt-7.5 tw-px-7.5 tw-pb-[33px] tw-bg-white tw-shadow-2sm tw-shadow-heading/10 tw-rounded lg:tw-max-w-[340px]">
                <div className="course-price tw-flex tw-items-center tw-justify-between tw-mb-[7px]">
                    <h6 className="tw-mb-0">
                        <i className="far fa-money-bill-wave tw-text-body tw-min-w-[28px] tw-text-center" />{" "}
                       Asking Price
                    </h6>
                    <span className="tw-text-right">
                        <span className="tw-text-2xl tw-text-primary tw-font-extrabold">
                            {currency}
                            {price}
                            <span className="tw-text-lg">.00</span>
                        </span>
                    </span>
                </div>
                <div className="course-meta tw-mb-10">
                    <CourseInfoItem
                        icon="far fa-chalkboard-teacher"
                        label="Contact"
                        value={instructor}
                    />
                    <CourseInfoItem
                        icon="far fa-clock"
                        label="Category"
                        value={duration}
                    />
                    <CourseInfoItem
                        icon="far fa-user"
                        label="Gross Revenue Annual"
                        value={lectures}
                    />
                    <CourseInfoItem
                        icon="far fa-user"
                        label="EBITDA / Net Profit"
                        value={`${students} Students`}
                    />
                    <CourseInfoItem
                        icon="far fa-language"
                        label="Real Estate"
                        value={language}
                    />
                    <CourseInfoItem
                        icon="far fa-calendar"
                        label="Deadline"
                        value={dayjs(published_at).format("MMM DD YYYY")}
                    />
                </div>

                {enrolledCourse ? (
                    <Button
                        fullwidth
                        className="tw-mb-4"
                        onClick={continueHandler}
                    >
                        Continue
                    </Button>
                ) : (
                    <>
                        {price !== 0 ? (
                            <Button
                                fullwidth
                                className="tw-mb-4"
                                onClick={() => setShowScheduleModal(true)}
                            >
                                Schedule a call
                            </Button>
                        ) : (
                            <Button
                                fullwidth
                                className="tw-mb-4"
                                onClick={() => setShowEnquiryModal(true)}
                            >
                                Enquire now
                            </Button>
                        )}
                    </>
                )}

                <Button fullwidth onClick={() => setShowEnquiryModal(true)}>
                    Enquire Now
                </Button>
                <div className="tw-mt-5 tw-text-center">
                    <SocialShare />
                </div>
            </div>
            <ScheduleCallModal
                show={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
            />
            <EnquiryModal
                show={showEnquiryModal}
                onClose={() => setShowEnquiryModal(false)}
            />
            <EnrollModal
                show={showEnrollModal}
                onClose={() => setShowEnrollModal(false)}
            />
        </>
    );
};

export default CourseInfo;
