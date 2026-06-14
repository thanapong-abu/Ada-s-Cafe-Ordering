import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import HalalBadge from './HalalBadge';
import { Star } from 'lucide-react';

interface MenuCardProps {
  item: any;
  onSelectItem: (item: any) => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onSelectItem }) => {
  const { language, t } = useLanguage();

  const name = language === 'th' ? item.name_th : item.name_en;
  const desc = language === 'th' ? item.description_th : item.description_en;

  // Resolve base price (lowest price among variants)
  const getDisplayPrice = () => {
    const prices = [item.price, item.price_iced, item.price_frappe, item.price_beef, item.price_shrimp, item.price_seafood].filter(p => p !== null && p !== undefined);
    if (prices.length === 0) return 0;
    return Math.min(...prices);
  };

  const hasMultiplePrices = 
    (item.price !== null && item.price_iced !== null) || 
    (item.price_iced !== null && item.price_frappe !== null) ||
    item.has_protein_modifier;

  return (
    <div className="menu-card hover-leaf-effect" onClick={() => onSelectItem(item)}>
      <div className="menu-card-inner">
        <div className="menu-card-left">
          <div className="menu-card-title-row">
            <span className="menu-item-name">{name}</span>
            {item.is_best_seller && (
              <span className="best-seller-star-badge" title={t('common.bestSeller')}>
                <Star size={10} fill="currentColor" />
              </span>
            )}
          </div>
          
          {desc && <p className="menu-item-desc">{desc}</p>}
          
          <div className="menu-item-badges">
            {item.is_halal && <HalalBadge />}
            {hasMultiplePrices && (
              <span className="customizable-indicator">
                {t('modifiers.title')}
              </span>
            )}
          </div>
        </div>

        <div className="dotted-divider"></div>

        <div className="menu-card-right">
          <div className="price-tag">
            <span className="price-currency">฿</span>
            <span className="price-amount">{getDisplayPrice()}{hasMultiplePrices ? '+' : ''}</span>
          </div>
          <button className="add-to-cart-circle-btn" aria-label={t('menu.addToCart')}>
            +
          </button>
        </div>
      </div>

      <style>{`
        .menu-card {
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          margin-bottom: 12px;
          padding: 14px 16px;
          box-shadow: 0 2px 8px rgba(139,69,19,0.06);
          cursor: pointer;
          transition: all var(--transition-fast);
          position: relative;
          overflow: hidden;
        }

        .menu-card:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(139,69,19,0.1);
          background-color: var(--color-surface2);
          border-color: rgba(139,69,19,0.25);
        }

        .menu-card-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
        }

        .menu-card-left {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          max-width: 70%;
        }

        .menu-card-title-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .menu-item-name {
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          color: var(--color-text);
          line-height: 1.3;
        }

        .best-seller-star-badge {
          background-color: var(--color-accent-gold);
          color: white;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .menu-item-desc {
          font-family: var(--font-body);
          font-size: 12px;
          color: var(--color-text-mid);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .menu-item-badges {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }

        .customizable-indicator {
          font-size: 9px;
          font-weight: 600;
          white-space: nowrap;
          flex-shrink: 0;
          color: var(--color-text-muted);
          background-color: rgba(139,69,19,0.06);
          padding: 1px 6px;
          border-radius: 10px;
          border: 0.5px solid var(--color-border);
        }

        .menu-card-right {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 75px;
          justify-content: flex-end;
        }

        .price-tag {
          display: flex;
          align-items: baseline;
          color: var(--color-accent);
          font-family: var(--font-body);
        }

        .price-currency {
          font-size: 12px;
          font-weight: 600;
          margin-right: 1px;
        }

        .price-amount {
          font-size: 16px;
          font-weight: 700;
        }

        .add-to-cart-circle-btn {
          background-color: var(--color-primary);
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          font-weight: 600;
          box-shadow: 0 2px 5px rgba(45,80,22,0.2);
          transition: all var(--transition-fast);
        }

        .menu-card:hover .add-to-cart-circle-btn {
          background-color: var(--color-primary-mid);
          transform: scale(1.08);
        }
      `}</style>
    </div>
  );
};
export default MenuCard;
