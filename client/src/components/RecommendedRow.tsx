import React, { useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Star } from 'lucide-react';

interface RecommendedRowProps {
  items: any[];
  onSelectItem: (item: any) => void;
}

export const RecommendedRow: React.FC<RecommendedRowProps> = ({ items, onSelectItem }) => {
  const { language, t } = useLanguage();
  const recommendedItems = items.filter(item => item.is_best_seller);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let isDown = false;
    let startX: number;
    let scrollLeft: number;
    let hasMoved = false;

    const handleMouseDown = (e: MouseEvent) => {
      isDown = true;
      hasMoved = false;
      el.classList.add('active-drag');
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    };

    const handleMouseLeave = () => {
      isDown = false;
      el.classList.remove('active-drag');
    };

    const handleMouseUp = () => {
      isDown = false;
      el.classList.remove('active-drag');
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5; // Scroll speed multiplier
      if (Math.abs(x - startX) > 6) {
        hasMoved = true;
      }
      el.scrollLeft = scrollLeft - walk;
    };

    const handleClickCapture = (e: MouseEvent) => {
      if (hasMoved) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    el.addEventListener('mousedown', handleMouseDown);
    el.addEventListener('mouseleave', handleMouseLeave);
    el.addEventListener('mouseup', handleMouseUp);
    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('click', handleClickCapture, true); // Capture phase

    return () => {
      el.removeEventListener('mousedown', handleMouseDown);
      el.removeEventListener('mouseleave', handleMouseLeave);
      el.removeEventListener('mouseup', handleMouseUp);
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('click', handleClickCapture, true);
    };
  }, []);

  if (recommendedItems.length === 0) return null;

  return (
    <div className="recommended-section">
      <div className="recommended-header">
        <h2 className="recommended-title">{t('menu.sectionRecommended')}</h2>
        <span className="recommended-subtitle">Homemade with love</span>
      </div>

      <div ref={scrollRef} className="recommended-row-scroll">
        <div className="recommended-row">
          {recommendedItems.map(item => {
            const name = language === 'th' ? item.name_th : item.name_en;
            const desc = language === 'th' ? item.description_th : item.description_en;
            
            // For price, show lowest price (e.g. espresso hot is 50, iced is 70)
            const minPrice = item.price || item.price_iced || item.price_frappe || 0;

            return (
              <div 
                key={item.id} 
                className="recommended-card"
                onClick={() => onSelectItem(item)}
              >
                <div className="recommended-card-header">
                  <span className="rec-best-badge">
                    <Star size={10} fill="currentColor" /> {t('common.bestSeller')}
                  </span>
                </div>
                
                <div className="recommended-card-body">
                  <div className="rec-item-name">{name}</div>
                  <div className="rec-item-desc">{desc || "..."}</div>
                </div>

                <div className="recommended-card-footer">
                  <span className="rec-price">฿{minPrice}</span>
                  <button className="rec-add-btn">
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .recommended-section {
          padding: 18px 16px 12px 16px;
          background-color: var(--color-bg);
        }

        .recommended-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .recommended-title {
          font-size: 18px;
          font-family: var(--font-display);
          color: var(--color-accent);
          font-weight: 700;
        }

        .recommended-subtitle {
          font-family: var(--font-accent);
          font-size: 11px;
          color: var(--color-text-muted);
          font-style: italic;
        }

        .recommended-row-scroll {
          overflow-x: auto;
          scrollbar-width: none;
          padding-bottom: 6px;
          -webkit-overflow-scrolling: touch; /* iOS momentum */
          cursor: grab;
          user-select: none;
        }

        .recommended-row-scroll::-webkit-scrollbar {
          display: none;
        }

        .recommended-row-scroll.active-drag {
          cursor: grabbing;
        }

        .recommended-row {
          display: inline-flex;
          gap: 12px;
        }

        .recommended-card {
          width: 155px;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          box-shadow: 0 4px 10px rgba(139,69,19,0.04);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .recommended-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(139,69,19,0.06);
          background-color: var(--color-surface2);
        }

        .recommended-card-header {
          margin-bottom: 8px;
        }

        .rec-best-badge {
          background-color: var(--color-primary);
          color: #FFF;
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          border: 1px solid var(--color-accent-gold);
        }

        .rec-item-name {
          font-size: 13px;
          font-weight: 700;
          color: var(--color-text);
          margin-bottom: 4px;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 32px;
        }

        .rec-item-desc {
          font-size: 10px;
          color: var(--color-text-muted);
          line-height: 1.3;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 26px;
        }

        .recommended-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }

        .rec-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .rec-add-btn {
          background-color: var(--color-primary-mid);
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(74,124,47,0.2);
          transition: all var(--transition-fast);
        }

        .rec-add-btn:hover {
          background-color: var(--color-primary);
        }
      `}</style>
    </div>
  );
};
export default RecommendedRow;
