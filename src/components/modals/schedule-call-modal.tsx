import { Modal, ModalHeader, ModalClose, ModalBody } from "@ui/modal";

type TProps = {
    show: boolean;
    onClose: () => void;
};

const ScheduleCallModal = ({ show, onClose }: TProps) => {
    return (
        <Modal show={show} onClose={onClose} size="xl">
            <ModalHeader>
                <h4 className="tw-mb-0">Schedule a Call</h4>
                <ModalClose onClose={onClose}>x</ModalClose>
            </ModalHeader>
            <ModalBody className="tw-p-0">
                <div className="tw-w-full tw-h-[70vh]">
                    <iframe
                        title="Schedule a call"
                        src="https://meetings.hubspot.com/mike-qureshi"
                        className="tw-w-full tw-h-full tw-border-0"
                        loading="lazy"
                        allow="camera; microphone; fullscreen; autoplay"
                    />
                </div>
            </ModalBody>
        </Modal>
    );
};

export default ScheduleCallModal;
