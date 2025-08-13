import { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalStack, setModalStack] = useState([]);

  const openModal = (modalType, props = {}) => {
    setModalStack(prev => [...prev, { type: modalType, props, id: Date.now() }]);
  };

  const closeModal = () => {
    setModalStack(prev => prev.slice(0, -1));
  };

  const closeAllModals = () => {
    setModalStack([]);
  };

  const getCurrentModal = () => {
    return modalStack[modalStack.length - 1] || null;
  };

  const goBackToModal = (modalType) => {
    const index = modalStack.findIndex(modal => modal.type === modalType);
    if (index !== -1) {
      setModalStack(prev => prev.slice(0, index + 1));
    }
  };

  const value = {
    modalStack,
    currentModal: getCurrentModal(),
    openModal,
    closeModal,
    closeAllModals,
    goBackToModal,
    isModalOpen: modalStack.length > 0
  };

  return (
    <ModalContext.Provider value={value}>
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}