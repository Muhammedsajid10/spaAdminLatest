import React from 'react';
import './Loading.css';

const Loading = ({ text = 'Loading...', overlay = false }) => {
  const LoadingContent = () => (
    
      <div className="circular-progress">
        <svg className="progress-ring" width="40" height="40">
          <circle
            className="progress-ring-circle"
            stroke="#000000"
            strokeWidth="3"
            fill="transparent"
            r="16"
            cx="20"
            cy="20" 
          />
        </svg>
      </div>
   
  );

  // if (overlay) {
  //   return (
  //     <div className="loading-overlay">
  //       <LoadingContent />
  //     </div>
  //   );
  // }

  return <LoadingContent />;
};

export default Loading;