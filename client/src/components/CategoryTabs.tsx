import React, { useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface Category {
  id: number;
  name_th: string;
  name_en: string;
  icon: string;
  slug: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategoryId: number;
  onSelectCategory: (id: number) => void;
}

export const CategoryTabs: React.FC<CategoryTabsProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory
}) => {
  const { language } = useLanguage();
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

  return (
    <div ref={scrollRef} className="category-scroll-container">
      <div className="category-tabs">
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          const displayName = language === 'th' ? category.name_th : category.name_en;

          return (
            <button
              key={category.id}
              className={`category-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onSelectCategory(category.id)}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{displayName}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .category-scroll-container {
          background-color: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          overflow-x: auto;
          white-space: nowrap;
          padding: 12px 16px;
          scrollbar-width: none; /* Firefox */
          -webkit-overflow-scrolling: touch; /* iOS momentum */
          cursor: grab;
          user-select: none;
        }

        .category-scroll-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .category-scroll-container.active-drag {
          cursor: grabbing;
        }

        .category-tabs {
          display: inline-flex;
          gap: 10px;
        }

        .category-tab-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: var(--color-surface2);
          border: 1px solid rgba(139,69,19,0.08);
          padding: 8px 14px;
          border-radius: 30px;
          transition: all var(--transition-fast);
        }

        .category-tab-btn:hover {
          background-color: var(--color-surface2);
          transform: translateY(-1px);
        }

        .category-tab-btn.active {
          background-color: var(--color-primary-mid);
          color: #FFF;
          border-color: var(--color-primary);
          box-shadow: 0 4px 10px rgba(74,124,47,0.25);
        }

        .category-icon {
          font-size: 16px;
        }

        .category-name {
          font-size: 12px;
          font-weight: 700;
          color: inherit;
        }

        .category-tab-btn:not(.active) .category-name {
          color: var(--color-text);
        }
      `}</style>
    </div>
  );
};
export default CategoryTabs;
