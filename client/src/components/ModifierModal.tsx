import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import type { ModifierOption, AddOnOption } from '../context/CartContext';
import { X, Plus, Minus } from 'lucide-react';

interface ModifierModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({ item, isOpen, onClose }) => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();

  if (!isOpen || !item) return null;

  // ── Modifiers State ──
  const [selectedTemp, setSelectedTemp] = useState<string>('iced');
  const [selectedMilk, setSelectedMilk] = useState<string>('whole');
  const [selectedSweetness, setSelectedSweetness] = useState<string>('normal');
  const [selectedProtein, setSelectedProtein] = useState<string>('chicken');
  
  // Add-ons (Multi-select)
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState<string>('');

  // ── Initialize defaults based on item properties ──
  useEffect(() => {
    // Temperature default selection
    if (item.price_iced !== null && item.price_iced !== undefined) {
      setSelectedTemp('iced');
    } else if (item.price !== null && item.price !== undefined) {
      setSelectedTemp('hot');
    } else if (item.price_frappe !== null && item.price_frappe !== undefined) {
      setSelectedTemp('frappe');
    }

    // Protein default
    setSelectedProtein('chicken');

    // Reset others
    setSelectedMilk('whole');
    setSelectedSweetness('normal');
    setSelectedAddOns([]);
    setQuantity(1);
    setNote('');
  }, [item]);

  // ── Modifier lists ──
  const tempOptions = [
    { value: 'hot', name_th: 'ร้อน', name_en: 'Hot', available: item.price !== null },
    { value: 'iced', name_th: 'เย็น', name_en: 'Iced', available: item.price_iced !== null },
    { value: 'frappe', name_th: 'ปั่น', name_en: 'Frappe', available: item.price_frappe !== null }
  ];

  const milkOptions = [
    { value: 'whole', name_th: 'นมสด', name_en: 'Fresh Milk', priceAdded: 0 },
    { value: 'oat', name_th: 'โอ๊ตมิลก์', name_en: 'Oat Milk', priceAdded: 15 },
    { value: 'almond', name_th: 'นมอัลมอนด์', name_en: 'Almond Milk', priceAdded: 15 }
  ];

  const sweetnessOptions = [
    { value: 'less', name_th: 'หวานน้อย', name_en: 'Less Sweet', priceAdded: 0 },
    { value: 'normal', name_th: 'หวานปกติ', name_en: 'Normal Sweet', priceAdded: 0 },
    { value: 'extra', name_th: 'หวานมาก', name_en: 'Extra Sweet', priceAdded: 0 }
  ];

  const proteinOptions = [
    { value: 'chicken', name_th: 'ไก่', name_en: 'Chicken', price: item.price },
    { value: 'beef', name_th: 'เนื้อ', name_en: 'Beef', price: item.price_beef, available: !!item.price_beef },
    { value: 'shrimp', name_th: 'กุ้ง', name_en: 'Shrimp', price: item.price_shrimp, available: !!item.price_shrimp },
    { value: 'seafood', name_th: 'ทะเล', name_en: 'Seafood', price: item.price_seafood, available: !!item.price_seafood }
  ];

  const addOnOptions = [
    { value: 'extraShot', name_th: 'Extra Shot', name_en: 'Extra Shot', priceAdded: 15 },
    { value: 'syrup', name_th: 'ไซรัป', name_en: 'Syrup', priceAdded: 15 },
    { value: 'whippedCream', name_th: 'วิปครีม', name_en: 'Whipped Cream', priceAdded: 15 }
  ];

  // ── Calculate Dynamic Price ──
  const calculateUnitPrice = (): number => {
    let base = item.price || 0;

    if (item.category_id === 1 || item.category_id === 2) {
      if (selectedTemp === 'iced' && item.price_iced !== null) base = item.price_iced;
      else if (selectedTemp === 'frappe' && item.price_frappe !== null) base = item.price_frappe;
      else if (selectedTemp === 'hot' && item.price !== null) base = item.price;
    } else if (item.has_protein_modifier) {
      if (selectedProtein === 'beef' && item.price_beef) base = item.price_beef;
      else if (selectedProtein === 'shrimp' && item.price_shrimp) base = item.price_shrimp;
      else if (selectedProtein === 'seafood' && item.price_seafood) base = item.price_seafood;
      else base = item.price;
    }

    let extraCost = 0;
    
    // Add modifiers cost (only for drinks)
    if (item.category_id === 1 || item.category_id === 2) {
      // Add milk cost (only for coffee, category 1)
      if (item.category_id === 1) {
        const milkOpt = milkOptions.find(o => o.value === selectedMilk);
        if (milkOpt) extraCost += milkOpt.priceAdded;
      }
    }

    // Add selected add-ons cost
    selectedAddOns.forEach(val => {
      const opt = addOnOptions.find(o => o.value === val);
      if (opt) extraCost += opt.priceAdded;
    });

    return base + extraCost;
  };

  const unitPrice = calculateUnitPrice();
  const totalPrice = unitPrice * quantity;

  // ── Handle Confirm ──
  const handleConfirm = () => {
    const modifiersToSave: ModifierOption[] = [];
    const addOnsToSave: AddOnOption[] = [];

    // Drink custom modifiers
    if (item.category_id === 1 || item.category_id === 2) {
      const tempOpt = tempOptions.find(o => o.value === selectedTemp);
      if (tempOpt) {
        modifiersToSave.push({
          type: 'temperature',
          value: selectedTemp,
          name_th: tempOpt.name_th,
          name_en: tempOpt.name_en,
          priceAdded: 0
        });
      }

      // Size modifier removed

      if (item.category_id === 1) {
        const milkOpt = milkOptions.find(o => o.value === selectedMilk);
        if (milkOpt) {
          modifiersToSave.push({
            type: 'milk',
            value: selectedMilk,
            name_th: milkOpt.name_th,
            name_en: milkOpt.name_en,
            priceAdded: milkOpt.priceAdded
          });
        }
      }

      const sweetnessOpt = sweetnessOptions.find(o => o.value === selectedSweetness);
      if (sweetnessOpt) {
        modifiersToSave.push({
          type: 'sweetness',
          value: selectedSweetness,
          name_th: sweetnessOpt.name_th,
          name_en: sweetnessOpt.name_en,
          priceAdded: 0
        });
      }
    }

    // Food protein modifiers
    if (item.has_protein_modifier) {
      const protOpt = proteinOptions.find(o => o.value === selectedProtein);
      if (protOpt) {
        let diffPrice = 0;
        if (selectedProtein === 'beef') diffPrice = (item.price_beef || 0) - item.price;
        else if (selectedProtein === 'shrimp') diffPrice = (item.price_shrimp || 0) - item.price;
        else if (selectedProtein === 'seafood') diffPrice = (item.price_seafood || 0) - item.price;

        modifiersToSave.push({
          type: 'protein',
          value: selectedProtein,
          name_th: protOpt.name_th,
          name_en: protOpt.name_en,
          priceAdded: diffPrice
        });
      }
    }

    // Addons
    selectedAddOns.forEach(val => {
      const opt = addOnOptions.find(o => o.value === val);
      if (opt) {
        addOnsToSave.push({
          value: val,
          name_th: opt.name_th,
          name_en: opt.name_en,
          priceAdded: opt.priceAdded
        });
      }
    });

    addToCart(item, modifiersToSave, addOnsToSave, quantity, note);
    onClose();
  };

  const toggleAddOn = (val: string) => {
    setSelectedAddOns(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const name = language === 'th' ? item.name_th : item.name_en;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-area">
            <h3>{name}</h3>
            <span className="modal-base-price">฿{unitPrice}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="modal-body-content">
          
          {/* Temperature (Drinks) */}
          {(item.category_id === 1 || item.category_id === 2) && (
            <div className="modifier-group">
              <label className="modifier-group-title">{t('modifiers.temperature')}</label>
              <div className="modifier-options-row">
                {tempOptions.filter(o => o.available).map(opt => (
                  <button
                    key={opt.value}
                    className={`modifier-pill ${selectedTemp === opt.value ? 'active' : ''}`}
                    onClick={() => setSelectedTemp(opt.value)}
                  >
                    {language === 'th' ? opt.name_th : opt.name_en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Milk type (Coffee only) */}
          {item.category_id === 1 && (
            <div className="modifier-group">
              <label className="modifier-group-title">{t('modifiers.milk')}</label>
              <div className="modifier-options-grid">
                {milkOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`modifier-pill ${selectedMilk === opt.value ? 'active' : ''}`}
                    onClick={() => setSelectedMilk(opt.value)}
                  >
                    {language === 'th' ? opt.name_th : opt.name_en} {opt.priceAdded > 0 ? `(+฿${opt.priceAdded})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sweetness (Drinks) */}
          {(item.category_id === 1 || item.category_id === 2) && (
            <div className="modifier-group">
              <label className="modifier-group-title">{t('modifiers.sweetness')}</label>
              <div className="modifier-options-row">
                {sweetnessOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`modifier-pill ${selectedSweetness === opt.value ? 'active' : ''}`}
                    onClick={() => setSelectedSweetness(opt.value)}
                  >
                    {language === 'th' ? opt.name_th : opt.name_en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Protein (Stir Fried / Salads / Curry) */}
          {item.has_protein_modifier && (
            <div className="modifier-group">
              <label className="modifier-group-title">{t('modifiers.protein')}</label>
              <div className="modifier-options-grid">
                {proteinOptions.filter(o => o.value === 'chicken' || o.available).map(opt => {
                  const displayPrice = opt.price;
                  return (
                    <button
                      key={opt.value}
                      className={`modifier-pill ${selectedProtein === opt.value ? 'active' : ''}`}
                      onClick={() => setSelectedProtein(opt.value)}
                    >
                      {language === 'th' ? opt.name_th : opt.name_en} (฿{displayPrice})
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Addons (Drinks only) */}
          {(item.category_id === 1 || item.category_id === 2) && (
            <div className="modifier-group">
              <label className="modifier-group-title">{t('menu.addOn')}</label>
              <div className="modifier-options-grid">
                {addOnOptions.map(opt => (
                  <button
                    key={opt.value}
                    className={`modifier-pill checkbox-pill ${selectedAddOns.includes(opt.value) ? 'active' : ''}`}
                    onClick={() => toggleAddOn(opt.value)}
                  >
                    <span className="checkbox-indicator">{selectedAddOns.includes(opt.value) ? '✓' : '+'}</span>
                    {language === 'th' ? opt.name_th : opt.name_en} (+฿{opt.priceAdded})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Special notes */}
          <div className="modifier-group">
            <label className="modifier-group-title">{t('menu.specialNote')}</label>
            <textarea
              className="note-textarea"
              placeholder={t('menu.notePlaceholder')}
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="modal-footer">
          <div className="qty-controls">
            <button 
              className="qty-btn" 
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
            >
              <Minus size={16} />
            </button>
            <span className="qty-value">{quantity}</span>
            <button 
              className="qty-btn" 
              onClick={() => setQuantity(q => q + 1)}
            >
              <Plus size={16} />
            </button>
          </div>

          <button className="confirm-add-cart-btn" onClick={handleConfirm}>
            {t('modifiers.confirm')} — ฿{totalPrice}
          </button>
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(59, 42, 26, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 100;
          animation: fadeIn var(--transition-fast);
        }

        @media (min-width: 480px) {
          .modal-overlay {
            align-items: center;
          }
        }

        .modal-container {
          background-color: var(--color-bg);
          width: 100%;
          max-width: 480px;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          display: flex;
          flex-direction: column;
          max-height: 85vh;
          box-shadow: 0 -8px 30px rgba(59,42,26,0.15);
          animation: slideUp var(--transition-normal);
          border-top: 1px solid var(--color-border);
        }

        @media (min-width: 480px) {
          .modal-container {
            border-radius: var(--radius-lg);
            border: 1px solid var(--color-border);
            max-height: 75vh;
            animation: scaleIn var(--transition-normal);
          }
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 20px 20px 14px 20px;
          border-bottom: 1px solid var(--color-divider);
          background-color: var(--color-surface);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }

        @media (min-width: 480px) {
          .modal-header {
            border-radius: var(--radius-lg) var(--radius-lg) 0 0;
          }
        }

        .modal-title-area {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .modal-title-area h3 {
          font-family: var(--font-display);
          font-size: 18px;
          color: var(--color-accent);
        }

        .modal-base-price {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-primary);
        }

        .modal-close-btn {
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-mid);
          transition: all var(--transition-fast);
        }

        .modal-close-btn:hover {
          background-color: var(--color-border);
        }

        .modal-body-content {
          padding: 16px 20px;
          overflow-y: auto;
          flex: 1;
        }

        .modifier-group {
          margin-bottom: 20px;
        }

        .modifier-group-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 10px;
          display: block;
        }

        .modifier-options-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .modifier-options-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .modifier-pill {
          background-color: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: 30px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
          text-align: center;
          transition: all var(--transition-fast);
        }

        .modifier-pill:hover {
          background-color: var(--color-surface2);
        }

        .modifier-pill.active {
          background-color: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
          box-shadow: 0 3px 8px rgba(45,80,22,0.2);
        }

        .checkbox-pill {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 8px;
          text-align: left;
        }

        .checkbox-indicator {
          background-color: rgba(139,69,19,0.1);
          width: 18px;
          height: 18px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--color-primary);
        }

        .modifier-pill.active .checkbox-indicator {
          background-color: rgba(255,255,255,0.2);
          color: white;
        }

        .note-textarea {
          width: 100%;
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--color-text);
          outline: none;
          resize: none;
          transition: all var(--transition-fast);
        }

        .note-textarea:focus {
          border-color: var(--color-primary-mid);
          background-color: var(--color-surface2);
        }

        .modal-footer {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          border-top: 1px solid var(--color-divider);
          background-color: var(--color-surface);
          box-shadow: 0 -2px 10px rgba(0,0,0,0.02);
        }

        .qty-controls {
          display: flex;
          align-items: center;
          background-color: var(--color-surface2);
          border: 1px solid var(--color-border);
          border-radius: 30px;
          padding: 4px;
        }

        .qty-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background-color: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-mid);
          border: 1px solid rgba(139,69,19,0.08);
          transition: all var(--transition-fast);
        }

        .qty-btn:hover:not(:disabled) {
          background-color: var(--color-border);
          color: var(--color-text);
        }

        .qty-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .qty-value {
          font-size: 15px;
          font-weight: 700;
          color: var(--color-text);
          min-width: 28px;
          text-align: center;
        }

        .confirm-add-cart-btn {
          flex: 1;
          background-color: var(--color-primary);
          color: white;
          font-weight: 700;
          font-size: 14px;
          padding: 12px 16px;
          border-radius: 30px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(45,80,22,0.25);
          transition: all var(--transition-fast);
        }

        .confirm-add-cart-btn:hover {
          background-color: var(--color-primary-mid);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
export default ModifierModal;
