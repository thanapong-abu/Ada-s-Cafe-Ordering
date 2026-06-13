import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Clock } from 'lucide-react';
import { getTableDetails } from '../components/Header';

interface SuccessViewProps {
  orderId: number;
  tableParam: string | null;
  onOrderMore: () => void;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  orderId,
  tableParam,
  onOrderMore
}) => {
  const { t, language } = useLanguage();
  const tableInfo = getTableDetails(tableParam);

  return (
    <div className="success-view-container">
      <div className="success-card">
        {/* Animated Check Icon */}
        <div className="success-icon-wrapper">
          <CheckCircle2 size={64} className="success-icon" />
        </div>

        <h1 className="success-title">{t('success.title')}</h1>
        <p className="success-subtitle">{t('success.message')}</p>

        {/* Order Details Badge */}
        <div className="order-badge-container">
          <span className="order-badge-label">{t('success.orderNumber')}</span>
          <span className="order-badge-number">#{orderId}</span>
        </div>

        {/* Table Confirmation info */}
        <div className="success-table-badge">
          {t('common.table')}: {language === 'th' ? tableInfo.label_th : tableInfo.label_en}
        </div>

        {/* Wait Time Indicator */}
        <div className="wait-time-box">
          <Clock size={18} className="wait-icon" />
          <div className="wait-text-area">
            <span className="wait-label">{t('success.estimatedWait')}</span>
            <span className="wait-value">15 - 20 {t('success.minutes')}</span>
          </div>
        </div>

        <div className="leaf-decor">
          <svg viewBox="0 0 100 20" className="decor-svg">
            <path d="M 10 10 C 30 5, 50 15, 90 10" fill="none" stroke="var(--color-primary-light)" strokeWidth="1" strokeDasharray="3"/>
            <path d="M 40 10 Q 50 2, 60 10" fill="none" stroke="var(--color-primary)" strokeWidth="1.5"/>
          </svg>
        </div>

        <p className="thank-you-msg">{t('success.thankYou')}</p>

        <button className="order-more-btn" onClick={onOrderMore}>
          {t('success.orderMore')}
        </button>
      </div>

      <style>{`
        .success-view-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px 16px;
          min-height: 80vh;
          background-color: var(--color-bg);
        }

        .success-card {
          background-color: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-xl);
          width: 100%;
          max-width: 420px;
          padding: 30px 24px;
          box-shadow: 0 10px 25px rgba(139,69,19,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          animation: scaleIn var(--transition-normal);
        }

        .success-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background-color: rgba(74, 124, 47, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          border: 2px solid var(--color-primary-light);
        }

        .success-icon {
          color: var(--color-primary);
          animation: pulse 2s infinite ease-in-out;
        }

        .success-title {
          font-family: var(--font-display);
          font-size: 24px;
          color: var(--color-accent);
          margin-bottom: 8px;
        }

        .success-subtitle {
          font-size: 13px;
          color: var(--color-text-mid);
          line-height: 1.5;
          margin-bottom: 24px;
          max-width: 280px;
        }

        .order-badge-container {
          background-color: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 10px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          min-width: 160px;
        }

        .order-badge-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .order-badge-number {
          font-size: 22px;
          font-weight: 700;
          color: var(--color-accent);
          margin-top: 2px;
        }

        .success-table-badge {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-primary);
          margin-bottom: 20px;
          background-color: var(--color-surface2);
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid var(--color-border);
        }

        .wait-time-box {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: var(--color-surface2);
          border: 1.5px dashed var(--color-primary-light);
          border-radius: var(--radius-md);
          padding: 12px 18px;
          margin-bottom: 24px;
        }

        .wait-icon {
          color: var(--color-primary-mid);
        }

        .wait-text-area {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .wait-label {
          font-size: 10px;
          font-weight: 700;
          color: var(--color-text-muted);
        }

        .wait-value {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text);
        }

        .leaf-decor {
          width: 120px;
          height: 20px;
          margin-bottom: 15px;
          opacity: 0.7;
        }

        .decor-svg {
          width: 100%;
          height: 100%;
        }

        .thank-you-msg {
          font-family: var(--font-accent);
          font-style: italic;
          font-size: 13px;
          color: var(--color-accent);
          margin-bottom: 24px;
        }

        .order-more-btn {
          width: 100%;
          background-color: var(--color-primary);
          color: white;
          font-size: 15px;
          font-weight: 700;
          padding: 12px 24px;
          border-radius: 30px;
          box-shadow: 0 4px 10px rgba(45,80,22,0.2);
          transition: all var(--transition-fast);
        }

        .order-more-btn:hover {
          background-color: var(--color-primary-mid);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
export default SuccessView;
