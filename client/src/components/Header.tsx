import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface HeaderProps {
  tableParam: string | null;
}

export const getTableDetails = (tableParam: string | null) => {
  if (!tableParam) return { num: '-', label_th: 'ไม่ระบุ', label_en: 'Not Specified' };
  const tableNum = parseInt(tableParam);
  if (isNaN(tableNum) || tableNum < 1 || tableNum > 32) {
    return { num: tableParam, label_th: tableParam, label_en: tableParam };
  }
  const isIndoor = tableNum <= 20;
  const sectionTh = isIndoor ? 'อินดอร์' : 'เอาท์ดอร์';
  const sectionEn = isIndoor ? 'Indoor' : 'Outdoor';

  return {
    num: String(tableNum),
    label_th: `โต๊ะ ${tableNum} · ${sectionTh}`,
    label_en: `Table ${tableNum} · ${sectionEn}`
  };
};

export const Header: React.FC<HeaderProps> = ({ tableParam }) => {
  const { language, setLanguage } = useLanguage();
  const tableInfo = getTableDetails(tableParam);
  return (
    <header className="cafe-header">
      <div className="header-left">
        {/* Logo Image */}
        <div className="logo-container">
          <img className="logo-img" src="/logo.jpg" alt="Ada's Cafe Logo" />
        </div>
        <div className="title-container">
          <span className="brand-name">Ada's Cafe</span>
          <span className="brand-sub">CHIANG RAI</span>
        </div>
      </div>

      <div className="header-center">
        <div className="table-badge-header">
          <span className="table-number">{language === 'th' ? tableInfo.label_th : tableInfo.label_en}</span>
        </div>
      </div>

      <div className="header-right">
        <div className="lang-toggle-pill">
          <button 
            className={`lang-btn ${language === 'th' ? 'active' : ''}`}
            onClick={() => setLanguage('th')}
          >
            ไทย
          </button>
          <button 
            className={`lang-btn ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
        </div>
      </div>

      <style>{`
        .cafe-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--color-surface);
          padding: 10px 16px;
          border-bottom: 2px solid var(--color-border);
          box-shadow: 0 2px 6px rgba(139,69,19,0.04);
          z-index: 10;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo-container {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 1.5px solid var(--color-primary);
        }

        .title-container {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .brand-name {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .brand-sub {
          font-size: 8px;
          font-weight: 700;
          color: var(--color-primary);
          letter-spacing: 1.5px;
        }

        .header-center {
          display: flex;
          justify-content: center;
        }

        .table-badge-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: var(--color-surface2);
          padding: 4px 12px;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
          min-width: 90px;
        }

        .table-label {
          font-size: 9px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
        }

        .table-number {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-primary);
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .lang-toggle-pill {
          display: flex;
          background-color: var(--color-surface2);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 2px;
        }

        .lang-btn {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 15px;
          color: var(--color-text-mid);
          transition: all var(--transition-fast);
        }

        .lang-btn.active {
          background-color: var(--color-primary);
          color: #FFF;
          box-shadow: 0 2px 4px rgba(45,80,22,0.2);
        }
      `}</style>
    </header>
  );
};
export default Header;
