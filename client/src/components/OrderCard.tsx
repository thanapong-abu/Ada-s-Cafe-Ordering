import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Printer, Check, Clock, AlertTriangle } from 'lucide-react';
import { getTableDetails } from './Header';

export interface OrderItem {
  id: number;
  name_th: string;
  name_en: string;
  quantity: number;
  modifiers?: any[];
  addOns?: any[];
  note?: string;
}

export interface Order {
  id: number;
  table: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed';
  timestamp: string;
  note?: string;
  total: number;
  printStatus: 'idle' | 'printing' | 'printed' | 'failed';
  printRetries: number;
}

interface OrderCardProps {
  order: Order;
  onConfirm: (id: number) => void;
  onReprint: (id: number) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onConfirm,
  onReprint
}) => {
  const { t, language } = useLanguage();
  const tableInfo = getTableDetails(order.table);

  const formattedTime = new Date(order.timestamp).toLocaleTimeString(language === 'th' ? 'th-TH' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`order-card ${order.status === 'pending' ? 'status-pending' : 'status-confirmed'}`}>
      {/* Card Header */}
      <div className="card-header">
        <div className="order-title-block">
          <span className="order-id">#{order.id}</span>
          <span className="order-time">
            <Clock size={12} /> {formattedTime}
          </span>
        </div>
        <div className="table-badge-waiter">
          {language === 'th' ? tableInfo.label_th : tableInfo.label_en}
        </div>
      </div>

      {/* Item List */}
      <div className="card-body">
        <ul className="items-list">
          {order.items.map((item, idx) => {
            const displayName = language === 'th' ? item.name_th : item.name_en;
            
            const modsText = (item.modifiers || [])
              .map(m => language === 'th' ? m.name_th : m.name_en)
              .concat((item.addOns || []).map(a => `+ ${language === 'th' ? a.name_th : a.name_en}`))
              .join(', ');

            return (
              <li key={idx} className="item-li">
                <div className="item-main-row">
                  <span className="item-qty">{item.quantity}x</span>
                  <span className="item-name-waiter">{displayName}</span>
                </div>
                {modsText && <div className="item-mods-waiter">{modsText}</div>}
                {item.note && (
                  <div className="item-note-waiter">
                     ** {item.note}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {order.note && (
          <div className="order-general-note">
            <strong>{t('menu.specialNote')}:</strong> {order.note}
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="card-footer-waiter">
        <div className="price-and-print">
          <div className="order-total-waiter">฿{order.total}</div>
          
          {/* Printer Status */}
          <div className={`print-status-tag ${order.printStatus}`}>
            <Printer size={12} />
            <span className="print-status-text">
              {order.printStatus === 'printing' && 'กำลังพิมพ์...'}
              {order.printStatus === 'printed' && 'พิมพ์แล้ว'}
              {order.printStatus === 'failed' && 'พิมพ์ล้มเหลว'}
              {order.printStatus === 'idle' && 'รอพิมพ์'}
            </span>
            {order.printStatus === 'failed' && (
              <AlertTriangle size={12} className="warning-icon-print" />
            )}
          </div>
        </div>

        <div className="action-buttons-waiter">
          {order.status === 'pending' && (
            <button 
              className="btn-confirm-order"
              onClick={() => onConfirm(order.id)}
            >
              <Check size={14} /> {t('waiter.confirmBtn')}
            </button>
          )}
          <button 
            className="btn-reprint"
            onClick={() => onReprint(order.id)}
            title="Reprint Kitchen Receipt"
          >
            <Printer size={14} /> Reprint
          </button>
        </div>
      </div>

      <style>{`
        .order-card {
          background-color: var(--color-surface);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 16px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 12px rgba(139,69,19,0.05);
          position: relative;
          transition: transform var(--transition-fast);
        }

        .order-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(139,69,19,0.08);
        }

        .order-card.status-pending {
          border-left: 5px solid var(--color-new-order);
        }

        .order-card.status-confirmed {
          border-left: 5px solid var(--color-primary);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--color-divider);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .order-title-block {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .order-id {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .order-time {
          font-size: 11px;
          color: var(--color-text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .table-badge-waiter {
          background-color: var(--color-primary);
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
        }

        .card-body {
          flex: 1;
          margin-bottom: 16px;
        }

        .items-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-li {
          padding-bottom: 8px;
          border-bottom: 1px dashed rgba(139,69,19,0.08);
        }

        .item-li:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-main-row {
          display: flex;
          gap: 8px;
          font-size: 14px;
          font-weight: 600;
        }

        .item-qty {
          color: var(--color-primary-mid);
        }

        .item-name-waiter {
          color: var(--color-text);
        }

        .item-mods-waiter {
          font-size: 11px;
          color: var(--color-text-mid);
          margin-left: 28px;
          margin-top: 2px;
        }

        .item-note-waiter {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-new-order);
          margin-left: 28px;
          margin-top: 2px;
        }

        .order-general-note {
          background-color: rgba(212, 84, 26, 0.05);
          border: 1px solid rgba(212, 84, 26, 0.15);
          border-radius: var(--radius-sm);
          padding: 8px 10px;
          font-size: 12px;
          color: var(--color-text);
          margin-top: 12px;
        }

        .card-footer-waiter {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-top: 1px solid var(--color-divider);
          padding-top: 12px;
        }

        .price-and-print {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .order-total-waiter {
          font-size: 18px;
          font-weight: 700;
          color: var(--color-accent);
        }

        .print-status-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid transparent;
        }

        .print-status-tag.idle {
          background-color: rgba(139,69,19,0.05);
          color: var(--color-text-muted);
        }

        .print-status-tag.printing {
          background-color: rgba(201,168,76,0.15);
          color: var(--color-accent-gold);
          border-color: rgba(201,168,76,0.3);
          animation: pulse 1.5s infinite;
        }

        .print-status-tag.printed {
          background-color: rgba(45,80,22,0.1);
          color: var(--color-primary);
          border-color: rgba(45,80,22,0.2);
        }

        .print-status-tag.failed {
          background-color: rgba(212,84,26,0.1);
          color: var(--color-new-order);
          border-color: rgba(212,84,26,0.3);
        }

        .warning-icon-print {
          color: var(--color-new-order);
          margin-left: 2px;
        }

        .action-buttons-waiter {
          display: flex;
          gap: 8px;
        }

        .btn-confirm-order {
          flex: 1;
          background-color: var(--color-primary);
          color: white;
          font-size: 12px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          box-shadow: 0 2px 6px rgba(45,80,22,0.2);
        }

        .btn-confirm-order:hover {
          background-color: var(--color-primary-mid);
        }

        .btn-reprint {
          background-color: var(--color-surface2);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          font-size: 12px;
          font-weight: 700;
          padding: 8px 12px;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
        }

        .btn-reprint:hover {
          background-color: var(--color-border);
        }
      `}</style>
    </div>
  );
};
export default OrderCard;
