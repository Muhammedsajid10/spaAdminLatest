import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';
import './Toast.css';

const Toast = ({ 
  message, 
  type = 'info', 
  isVisible = false, 
  onClose,
  duration = 3000,
  position = 'top-right'
}) => {
  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const icons = {
    success: <CheckCircle size={20} />,
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />
  };

  return (
    <div className={`toast toast--${type} toast--${position}`} onClick={onClose}>
      <div className="toast__content">
        <span className="toast__icon">{icons[type]}</span>
        <span className="toast__message">{message}</span>
      </div>
    </div>
  );
};

export default Toast;