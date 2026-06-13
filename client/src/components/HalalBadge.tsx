import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const HalalBadge: React.FC = () => {
  const { t } = useLanguage();
  return (
    <span className="halal-badge">
      <span className="crescent">☽</span>
      <span className="text">{t('common.halalBadge')}</span>
      <style>{`
        .halal-badge {
          display: inline-flex;
          align-items: center;
          background-color: var(--color-primary);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 20px;
          gap: 3px;
          letter-spacing: 0.5px;
          border: 1.5px solid var(--color-primary-light);
          line-height: 1;
        }
        .halal-badge .crescent {
          font-size: 12px;
          color: var(--color-accent-gold);
          transform: translateY(-0.5px);
        }
      `}</style>
    </span>
  );
};
export default HalalBadge;
