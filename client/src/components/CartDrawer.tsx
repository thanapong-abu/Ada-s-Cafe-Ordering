import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tableParam: string | null;
  onOrderSuccess: (orderId: number) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  tableParam,
  onOrderSuccess
}) => {
  const { t, language } = useLanguage();
  const { cart, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  
  const [generalNote, setGeneralNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    const orderPayload = {
      table: tableParam || "Unknown",
      items: cart.map(item => ({
        id: item.id,
        name_th: item.name_th,
        name_en: item.name_en,
        quantity: item.quantity,
        modifiers: item.modifiers,
        addOns: item.addOns,
        note: item.note
      })),
      note: generalNote.trim(),
      total: cartTotal
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        throw new Error("Failed to place order");
      }

      const resData = await response.json();
      if (resData.success && resData.order) {
        // Success
        clearCart();
        setGeneralNote('');
        onOrderSuccess(resData.order.id);
        onClose();
      } else {
        throw new Error(resData.error || "Order placement failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(t('errors.orderFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer-container" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            <ShoppingBag size={20} className="cart-icon-title" />
            <h3>{t('cart.title')} ({cart.length})</h3>
          </div>
          <button className="cart-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="cart-body">
          {errorMsg && <div className="error-alert">{errorMsg}</div>}

          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <span className="empty-emoji">🥣</span>
              <p className="empty-title">{t('cart.empty')}</p>
              <p className="empty-subtitle">{t('cart.emptyHint')}</p>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map(item => {
                const displayName = language === 'th' ? item.name_th : item.name_en;
                
                // Combine modifiers and add-ons into small bullet text
                const modsText = item.modifiers
                  .map(m => language === 'th' ? m.name_th : m.name_en)
                  .concat(item.addOns.map(a => `+ ${language === 'th' ? a.name_th : a.name_en}`))
                  .join(', ');

                return (
                  <div key={item.cartItemId} className="cart-item-row">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{displayName}</div>
                      {modsText && <div className="cart-item-options">{modsText}</div>}
                      {item.note && <div className="cart-item-note">** {item.note}</div>}
                    </div>

                    <div className="cart-item-actions">
                      <div className="qty-picker">
                        <button 
                          className="qty-picker-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <Minus size={12} />
                        </button>
                        <span className="qty-picker-val">{item.quantity}</span>
                        <button 
                          className="qty-picker-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="cart-item-price-area">
                        <span className="cart-item-price">฿{item.price * item.quantity}</span>
                        <button 
                          className="cart-item-remove-btn"
                          onClick={() => removeFromCart(item.cartItemId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* General Order Note */}
              <div className="general-note-area">
                <label className="general-note-title">{t('menu.specialNote')} ({t('menu.sectionRecommended')})</label>
                <textarea
                  className="general-note-input"
                  placeholder={t('menu.notePlaceholder')}
                  value={generalNote}
                  onChange={e => setGeneralNote(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="total-label">{t('cart.total')}</span>
              <span className="total-value">฿{cartTotal}</span>
            </div>

            <button 
              className="checkout-btn" 
              onClick={handleCheckout}
              disabled={isSubmitting}
            >
              {isSubmitting ? '...' : t('cart.confirmOrder')}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .cart-overlay {
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
          z-index: 95;
          animation: fadeIn var(--transition-fast);
        }

        .cart-drawer-container {
          background-color: var(--color-bg);
          width: 100%;
          max-width: 600px;
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          display: flex;
          flex-direction: column;
          max-height: 80vh;
          box-shadow: 0 -8px 30px rgba(59,42,26,0.2);
          animation: slideUp var(--transition-normal);
          border-top: 1px solid var(--color-border);
        }

        .cart-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid var(--color-divider);
          background-color: var(--color-surface);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
        }

        .cart-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-accent);
        }

        .cart-header-title h3 {
          font-family: var(--font-display);
          font-size: 16px;
        }

        .cart-icon-title {
          color: var(--color-primary-mid);
        }

        .cart-close-btn {
          background: var(--color-surface2);
          border: 1px solid var(--color-border);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-mid);
        }

        .cart-body {
          padding: 16px 20px;
          overflow-y: auto;
          flex: 1;
        }

        .error-alert {
          background-color: rgba(212, 84, 26, 0.1);
          color: var(--color-new-order);
          padding: 10px 12px;
          border-radius: var(--radius-sm);
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 14px;
          border: 1px solid rgba(212, 84, 26, 0.2);
        }

        .cart-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
        }

        .empty-emoji {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .empty-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--color-text-mid);
          margin-bottom: 6px;
        }

        .empty-subtitle {
          font-size: 12px;
          color: var(--color-text-muted);
        }

        .cart-item-row {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid var(--color-divider);
          gap: 12px;
        }

        .cart-item-info {
          flex: 1;
        }

        .cart-item-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text);
        }

        .cart-item-options {
          font-size: 11px;
          color: var(--color-text-mid);
          margin-top: 2px;
        }

        .cart-item-note {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-new-order);
          margin-top: 2px;
        }

        .cart-item-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .qty-picker {
          display: flex;
          align-items: center;
          background-color: var(--color-surface2);
          border: 1px solid var(--color-border);
          border-radius: 20px;
          padding: 2px;
        }

        .qty-picker-btn {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-mid);
        }

        .qty-picker-val {
          font-size: 12px;
          font-weight: 700;
          min-width: 20px;
          text-align: center;
          color: var(--color-text);
        }

        .cart-item-price-area {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 65px;
          justify-content: flex-end;
        }

        .cart-item-price {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .cart-item-remove-btn {
          color: var(--color-text-muted);
          transition: color var(--transition-fast);
        }

        .cart-item-remove-btn:hover {
          color: var(--color-new-order);
        }

        .general-note-area {
          margin-top: 20px;
        }

        .general-note-title {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-muted);
          margin-bottom: 6px;
          display: block;
        }

        .general-note-input {
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
        }

        .cart-footer {
          padding: 16px 20px 24px 20px;
          background-color: var(--color-surface);
          border-top: 1px solid var(--color-divider);
        }

        .cart-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .total-label {
          font-size: 14px;
          font-weight: 700;
          color: var(--color-text-mid);
        }

        .total-value {
          font-size: 20px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .checkout-btn {
          width: 100%;
          background-color: var(--color-primary);
          color: white;
          font-size: 15px;
          font-weight: 700;
          padding: 14px;
          border-radius: 30px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(45,80,22,0.25);
          transition: all var(--transition-fast);
        }

        .checkout-btn:hover {
          background-color: var(--color-primary-mid);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
export default CartDrawer;
