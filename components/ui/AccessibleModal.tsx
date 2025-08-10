import React, { useEffect, useRef, ReactNode, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAccessibility } from '@/hooks/useAccessibility';
import { useMobile } from '@/hooks/useMobile';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
  className?: string;
  ariaDescribedBy?: string;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  initialFocus,
  className = '',
  ariaDescribedBy,
}: AccessibleModalProps) {
  const { announceToScreenReader, generateId } = useAccessibility();
  const { isMobile, enableHapticFeedback } = useMobile();
  const [titleId] = useState(() => generateId('modal-title'));
  const [descriptionId] = useState(() => generateId('modal-description'));
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Announce modal opening to screen readers
  useEffect(() => {
    if (isOpen) {
      announceToScreenReader(`Modal opened: ${title}`, 'polite');
      
      // Haptic feedback on mobile
      if (isMobile) {
        enableHapticFeedback();
      }
    }
  }, [isOpen, title, announceToScreenReader, isMobile, enableHapticFeedback]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        announceToScreenReader('Modal closed', 'polite');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose, announceToScreenReader]);

  const handleClose = () => {
    onClose();
    announceToScreenReader('Modal closed', 'polite');
    
    if (isMobile) {
      enableHapticFeedback();
    }
  };

  const getSizeClasses = () => {
    const baseClasses = 'w-full transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all';
    
    switch (size) {
      case 'sm':
        return `${baseClasses} max-w-md`;
      case 'md':
        return `${baseClasses} max-w-lg`;
      case 'lg':
        return `${baseClasses} max-w-2xl`;
      case 'xl':
        return `${baseClasses} max-w-4xl`;
      case 'full':
        return `${baseClasses} max-w-7xl mx-4`;
      default:
        return `${baseClasses} max-w-lg`;
    }
  };

  const getMobileClasses = () => {
    if (!isMobile) return '';
    
    return size === 'full' 
      ? 'mx-2 my-4 max-h-[calc(100vh-2rem)]' 
      : 'mx-4 my-8 max-h-[calc(100vh-4rem)]';
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog
        as="div"
        className="relative z-[9999]"
        onClose={closeOnOverlayClick ? handleClose : () => {}}
        initialFocus={initialFocus || closeButtonRef}
        aria-labelledby={titleId}
        aria-describedby={ariaDescribedBy || descriptionId}
      >
        {/* Overlay */}
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            aria-hidden="true"
          />
        </Transition.Child>

        {/* Modal container */}
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel 
                className={`${getSizeClasses()} ${getMobileClasses()} ${className}`}
                role="dialog"
                aria-modal="true"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <Dialog.Title
                    as="h2"
                    id={titleId}
                    className="text-lg font-semibold text-gray-900 pr-8"
                  >
                    {title}
                  </Dialog.Title>
                  
                  {showCloseButton && (
                    <button
                      ref={closeButtonRef}
                      type="button"
                      className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                      onClick={handleClose}
                      aria-label={`Close ${title} modal`}
                    >
                      <XMarkIcon className="w-5 h-5" aria-hidden="true" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div 
                  className="p-6 overflow-y-auto max-h-[60vh]"
                  id={descriptionId}
                >
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Confirmation modal variant
interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
}: ConfirmationModalProps) {
  const { announceToScreenReader } = useAccessibility();
  const { isMobile, enableHapticFeedback } = useMobile();
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = () => {
    onConfirm();
    onClose();
    announceToScreenReader('Action confirmed', 'polite');
    
    if (isMobile) {
      enableHapticFeedback();
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          icon: 'text-red-600',
        };
      case 'warning':
        return {
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          icon: 'text-yellow-600',
        };
      default:
        return {
          button: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
          icon: 'text-primary-600',
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      initialFocus={confirmButtonRef}
    >
      <div className="space-y-4">
        <p className="text-gray-700 leading-relaxed">
          {message}
        </p>
        
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4">
          <button
            type="button"
            className="btn-secondary w-full sm:w-auto min-w-touch min-h-touch"
            onClick={onClose}
            aria-label={`${cancelText} and close modal`}
          >
            {cancelText}
          </button>
          
          <button
            ref={confirmButtonRef}
            type="button"
            className={`${variantClasses.button} text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 w-full sm:w-auto min-w-touch min-h-touch`}
            onClick={handleConfirm}
            aria-label={`${confirmText} action`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  );
}

// Loading modal variant
interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
}

export function LoadingModal({ isOpen, title, message }: LoadingModalProps) {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={() => {}} // Cannot close loading modal
      title={title}
      size="sm"
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      <div className="flex flex-col items-center space-y-4">
        <div 
          className="loading-indicator text-primary-600"
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
        
        {message && (
          <p className="text-gray-600 text-center">
            {message}
          </p>
        )}
      </div>
    </AccessibleModal>
  );
}
