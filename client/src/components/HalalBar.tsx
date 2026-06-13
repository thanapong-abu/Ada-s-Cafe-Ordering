import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const HalalBar: React.FC = () => {
  const { t } = useLanguage();
  return (
    <div className="halal-bar">
      <span className="halal-crescent">☽</span>
      <span className="halal-text">{t('common.halalCertified')}</span>
      <style>{`
        .halal-bar {
          background-color: var(--color-primary);
          color: #F5EFE6;
          text-align: center;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-bottom: 2px solid var(--color-primary-light);
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .halal-bar .halal-crescent {
          color: var(--color-accent-gold);
          font-size: 14px;
          animation: pulse 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};
export default HalalBar;
