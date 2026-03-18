import React from 'react';
import '../styles/Dialog.css';

const Dialog = ({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'default',
  showInput = false,
  inputValue = '',
  onInputChange,
  inputPlaceholder = 'Type here...',
  requireDeleteConfirmation = false
}) => {
  if (!isOpen) return null;

  // Determine if button should be disabled
  const isDisabled = showInput && requireDeleteConfirmation && inputValue !== 'DELETE';

  return (
    <div className="dialog-overlay" role="presentation" onClick={(e) => e.stopPropagation()}>
      <div className="dialog-card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        {title && <h3 className="dialog-title">{title}</h3>}
        {message && <p className="dialog-message">{message}</p>}
        {showInput && (
          <textarea
            className="dialog-input"
            value={inputValue}
            onChange={(e) => onInputChange?.(e.target.value)}
            placeholder={inputPlaceholder}
            rows={3}
          />
        )}
        <div className="dialog-actions">
          {onCancel && (
            <button className="dialog-btn" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button
            className={`dialog-btn ${variant === 'danger' ? 'danger' : 'primary'}`}
            onClick={onConfirm}
            disabled={isDisabled}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
