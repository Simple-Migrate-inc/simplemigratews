import ContactForm from "@components/forms/contact-form";
import { Modal, ModalHeader, ModalClose, ModalBody } from "@ui/modal";

type TProps = {
    show: boolean;
    onClose: () => void;
};

const EnquiryModal = ({ show, onClose }: TProps) => {
    return (
        <Modal show={show} onClose={onClose} size="lg">
            <ModalHeader>
                <h4 className="tw-mb-0">Enquiry Form</h4>
                <ModalClose onClose={onClose}>x</ModalClose>
            </ModalHeader>
            <ModalBody className="tw-p-8">
                <ContactForm />
            </ModalBody>
        </Modal>
    );
};

export default EnquiryModal;
