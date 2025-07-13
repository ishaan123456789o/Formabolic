import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'block' }}
  >
    {/* Barbell shaft */}
    <rect x="10" y="21" width="28" height="6" rx="2" fill="currentColor" opacity="0.7" />
    {/* Left weight */}
    <rect x="4" y="16" width="6" height="16" rx="2" fill="currentColor" />
    {/* Right weight */}
    <rect x="38" y="16" width="6" height="16" rx="2" fill="currentColor" />
    {/* End caps for extra style */}
    <rect x="2" y="19" width="2" height="10" rx="1" fill="currentColor" opacity="0.5" />
    <rect x="44" y="19" width="2" height="10" rx="1" fill="currentColor" opacity="0.5" />
  </svg>
);

export default Logo; 