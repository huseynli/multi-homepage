import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useModal } from "utils/contexts/modal";

import DashboardManagement from "./dashboard-management";
import ConfigEditor from "./config-editor";

const MODAL_COMPONENTS = {
  'dashboard-management': DashboardManagement,
  'config-editor': ConfigEditor,
};

export default function ModalContainer() {
  const { currentModal, closeModal, isModalOpen } = useModal();

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape" && isModalOpen) {
        closeModal();
      }
    };

    if (isModalOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      if (!isModalOpen) {
        document.body.style.overflow = "unset";
      }
    };
  }, [isModalOpen, closeModal]);

  if (!currentModal || typeof window === "undefined") {
    return null;
  }

  const ModalComponent = MODAL_COMPONENTS[currentModal.type];

  if (!ModalComponent) {
    console.warn(`Unknown modal type: ${currentModal.type}`);
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" 
          onClick={closeModal}
        />
        <div className="inline-block my-8 text-left align-middle transition-all transform">
          <ModalComponent
            isOpen={true}
            onClose={closeModal}
            {...currentModal.props}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
