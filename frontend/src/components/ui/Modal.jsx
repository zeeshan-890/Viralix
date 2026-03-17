import * as React from "react";
import { cn } from "../../lib/utils";
const Modal = ({ open, onOpenChange, children }) => {
    if (!open)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)}/>
            <div className="relative z-50 w-full max-w-lg mx-4">
                {children}
            </div>
        </div>);
};
const ModalContent = ({ className, children }) => {
    return (<div className={cn("bg-white rounded-lg shadow-lg p-6", className)}>
            {children}
        </div>);
};
const ModalHeader = ({ children }) => {
    return (<div className="mb-4">
            {children}
        </div>);
};
const ModalTitle = ({ children }) => {
    return (<h2 className="text-lg font-semibold text-gray-900">
            {children}
        </h2>);
};
const ModalDescription = ({ children }) => {
    return (<p className="text-sm text-gray-600 mt-1">
            {children}
        </p>);
};
export { Modal, ModalContent, ModalHeader, ModalTitle, ModalDescription };
