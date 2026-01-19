
import React from 'react';
import { BRANDING } from '../constants/branding';

export const BrandingLogo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <img 
      src={BRANDING.LOGO_SRC} 
      alt={BRANDING.NAME} 
      className={`${className} transition-opacity duration-300 object-contain`} 
    />
  );
};
