import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import Header from '../components/Header';
import HalalBar from '../components/HalalBar';
import CategoryTabs from '../components/CategoryTabs';
import RecommendedRow from '../components/RecommendedRow';
import MenuCard from '../components/MenuCard';
import ModifierModal from '../components/ModifierModal';
import CartDrawer from '../components/CartDrawer';
import SuccessView from '../views/SuccessView';
import { ShoppingBag } from 'lucide-react';

export const CustomerMenu: React.FC = () => {
  const { t } = useLanguage();
  const { cart, cartTotal } = useCart();

  // ── URL Params ──
  const [tableParam, setTableParam] = useState<string | null>(null);
  
  // ── Menu Data ──
  const [menuData, setMenuData] = useState<{ categories: any[]; items: any[] }>({ categories: [], items: [] });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ── Selected States ──
  const [activeCategoryId, setActiveCategoryId] = useState<number>(1);
  const [selectedItemForModifiers, setSelectedItemForModifiers] = useState<any>(null);
  
  // ── Drawer/Modal Open States ──
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [successOrderId, setSuccessOrderId] = useState<number | null>(null);

  useEffect(() => {
    // 1. Parse Table Parameter
    const params = new URLSearchParams(window.location.search);
    const tableNumber = parseInt(params.get('table') || '0');
    if (tableNumber >= 1 && tableNumber <= 32) {
      setTableParam(String(tableNumber));
    } else {
      setTableParam(null);
    }

    // 2. Fetch Menu
    fetch('/api/menu')
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch menu");
        return res.json();
      })
      .then(data => {
        setMenuData(data);
        if (data.categories && data.categories.length > 0) {
          setActiveCategoryId(data.categories[0].id);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setErrorMsg(t('errors.menuLoadFailed'));
        setIsLoading(false);
      });
  }, []);

  const handleSelectItem = (item: any) => {
    if (item.has_modifiers || item.has_protein_modifier) {
      setSelectedItemForModifiers(item);
    } else {
      // For items without options, open modal with simple quantity selector
      setSelectedItemForModifiers(item);
    }
  };

  const handleOrderSuccess = (orderId: number) => {
    setSuccessOrderId(orderId);
  };

  const handleOrderMore = () => {
    setSuccessOrderId(null);
  };

  if (isLoading) {
    return (
      <div className="menu-loading-screen">
        <div className="loader"></div>
        <p>Loading Ada's Cafe'...</p>
        <style>{`
          .menu-loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: var(--color-bg);
            color: var(--color-text-mid);
          }
          .loader {
            border: 4px solid var(--color-surface);
            border-top: 4px solid var(--color-primary);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin-bottom: 12px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="menu-error-screen">
        <p className="error-text">{errorMsg}</p>
        <button onClick={() => window.location.reload()} className="retry-btn">
          Retry
        </button>
        <style>{`
          .menu-error-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background-color: var(--color-bg);
            gap: 15px;
          }
          .error-text {
            color: var(--color-new-order);
            font-weight: 700;
          }
          .retry-btn {
            background-color: var(--color-primary);
            color: white;
            padding: 8px 18px;
            border-radius: 20px;
          }
        `}</style>
      </div>
    );
  }

  // If order was successfully completed, show success screen
  if (successOrderId !== null) {
    return (
      <div className="app-container">
        <SuccessView 
          orderId={successOrderId} 
          tableParam={tableParam} 
          onOrderMore={handleOrderMore} 
        />
      </div>
    );
  }

  // Filter items in active category
  const filteredItems = menuData.items.filter(item => item.category_id === activeCategoryId);

  return (
    <div className="app-container">
      {/* Top Header */}
      <Header tableParam={tableParam} />

      {/* Halal Certified Bar */}
      <HalalBar />

      <main className="main-content">
        {/* Horizontal scroll recommended row */}
        <RecommendedRow 
          items={menuData.items} 
          onSelectItem={handleSelectItem} 
        />

        {/* Botanical leaf motif separator */}
        <div className="botanical-divider">
          <svg viewBox="0 0 120 12">
            <path d="M 0 6 Q 30 1, 60 6 T 120 6" fill="none" stroke="var(--color-primary-light)" strokeWidth="1" />
            <circle cx="60" cy="6" r="3" fill="var(--color-primary)" />
            <path d="M 50 6 C 53 2, 53 -2, 45 2" fill="none" stroke="var(--color-primary-mid)" strokeWidth="1"/>
            <path d="M 70 6 C 67 2, 67 -2, 75 2" fill="none" stroke="var(--color-primary-mid)" strokeWidth="1"/>
          </svg>
        </div>

        {/* Category Horizontal scroll tabs */}
        <CategoryTabs 
          categories={menuData.categories}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
        />

        {/* Menu Cards List */}
        <div className="menu-list-container">
          {filteredItems.length === 0 ? (
            <div className="empty-category-msg">
              No items available in this category.
            </div>
          ) : (
            filteredItems.map(item => (
              <MenuCard 
                key={item.id} 
                item={item} 
                onSelectItem={handleSelectItem} 
              />
            ))
          )}
        </div>
      </main>

      {/* Floating cart bar at bottom */}
      {cart.length > 0 && (
        <div className="floating-cart-bar">
          <button className="cart-bar-btn" onClick={() => setIsCartOpen(true)}>
            <div className="cart-bar-left">
              <span className="cart-badge-count">{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
              <span className="cart-bar-text">{t('menu.viewCart')}</span>
            </div>
            <div className="cart-bar-right">
              <ShoppingBag size={18} />
              <span className="cart-bar-price">฿{cartTotal}</span>
            </div>
          </button>
        </div>
      )}

      {/* Custom options Modal */}
      <ModifierModal 
        item={selectedItemForModifiers}
        isOpen={selectedItemForModifiers !== null}
        onClose={() => setSelectedItemForModifiers(null)}
      />

      {/* Cart Summary Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tableParam={tableParam}
        onOrderSuccess={handleOrderSuccess}
      />

      <style>{`
        .menu-list-container {
          padding: 16px;
        }

        .empty-category-msg {
          text-align: center;
          color: var(--color-text-muted);
          padding: 40px 20px;
        }

        .floating-cart-bar {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          max-width: calc(600px - 32px); /* keep centered within app-container */
          margin: 0 auto;
          z-index: 80;
          animation: slideUp var(--transition-normal);
        }

        .cart-bar-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          background-color: var(--color-primary);
          color: white;
          padding: 14px 20px;
          border-radius: 30px;
          box-shadow: 0 8px 20px rgba(45,80,22,0.35);
          transition: all var(--transition-fast);
        }

        .cart-bar-btn:hover {
          background-color: var(--color-primary-mid);
          transform: translateY(-1px);
        }

        .cart-bar-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .cart-badge-count {
          background-color: var(--color-accent-gold);
          color: var(--color-text);
          font-size: 11px;
          font-weight: 700;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .cart-bar-text {
          font-size: 14px;
          font-weight: 700;
        }

        .cart-bar-right {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .cart-bar-price {
          font-size: 15px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};
export default CustomerMenu;
