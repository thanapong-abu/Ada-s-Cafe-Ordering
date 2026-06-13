import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import OrderCard from '../components/OrderCard';
import type { Order } from '../components/OrderCard';
import { Wifi, WifiOff } from 'lucide-react';

export const WaiterScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // ── Web Audio Chime Synthesis (Zero Asset Dependency) ──
  const playNotificationChime = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      // Tone 1: Ding (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.5);

      // Tone 2: Dong (A5) after 150ms
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.00, ctx.currentTime); // A5
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.8);
      }, 150);

    } catch (e) {
      console.error("Audio synthesis chime failed:", e);
    }
  };

  // ── Connect WebSocket ──
  useEffect(() => {
    let isReconnecting = false;

    const connectWS = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = `${window.location.hostname}:${window.location.port || '3000'}`;
      const wsUrl = `${protocol}//${wsHost}`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        if (isReconnecting) {
          console.log("[WS] Reconnected ✓");
          isReconnecting = false;
        } else {
          console.log("[WS] Connected successfully ✓");
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        isReconnecting = true;
        console.log("[WS] Disconnected. Retrying in 3s...");
        setTimeout(connectWS, 3000);
      };

      ws.onerror = () => {
        // Suppress errors during offline reconnect cycles
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        switch (message.type) {
          case 'init_orders':
            setOrders(message.data);
            break;
          case 'new_order':
            setOrders(prev => {
              if (prev.some(o => o.id === message.data.id)) return prev;
              return [...prev, message.data];
            });
            if (notificationsEnabled) {
              playNotificationChime();
            }
            break;
          case 'order_confirmed':
            setOrders(prev =>
              prev.map(o => (o.id === message.data.id ? { ...o, status: 'confirmed', printStatus: message.data.printStatus } : o))
            );
            break;
          case 'print_status_update':
            setOrders(prev =>
              prev.map(o => (o.id === message.data.orderId ? { 
                ...o, 
                printStatus: message.data.printStatus,
                printRetries: message.data.retries
              } : o))
            );
            break;
          default:
            break;
        }
      };
    };

    connectWS();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [notificationsEnabled]);

  // ── Audio Activation ──
  const handleEnableAudio = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const tempCtx = new AudioContextClass();
        if (tempCtx.state === 'suspended') {
          tempCtx.resume();
        }
      }
    } catch (e) {
      console.error("Failed to unlock Web Audio:", e);
    }
    setNotificationsEnabled(true);
    // Play chime test feedback
    setTimeout(playNotificationChime, 100);
  };

  // ── Handlers ──
  const handleConfirmOrder = async (id: number) => {
    try {
      const response = await fetch(`/api/order/${id}/confirm`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Failed to confirm order");
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถรับออเดอร์ได้ กรุณาตรวจสอบการเชื่อมต่อ");
    }
  };

  const handleReprintOrder = async (id: number) => {
    try {
      const response = await fetch(`/api/order/${id}/reprint`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error("Failed to reprint order");
    } catch (err) {
      console.error(err);
      alert("ส่งพิมพ์ซ้ำไม่สำเร็จ");
    }
  };

  // Group orders
  const pendingOrders = orders
    .filter(o => o.status === 'pending')
    .sort((a, b) => a.id - b.id); // Oldest pending first

  const confirmedOrders = orders
    .filter(o => o.status === 'confirmed')
    .sort((a, b) => b.id - a.id); // Newest confirmed first

  return (
    <div className="app-container waiter-layout">
      {/* Reconnection Banner Alert */}
      {!wsConnected && (
        <div className="reconnect-banner">
          {language === 'th' ? '⚠️ กำลังเชื่อมต่อใหม่...' : '⚠️ Reconnecting...'}
        </div>
      )}

      {/* Audio permission overlay */}
      {!notificationsEnabled && (
        <div className="audio-activation-overlay">
          <div className="activation-card">
            <div className="activation-brand">ADA'S CAFE</div>
            <div className="activation-bell-icon">🔔</div>
            <button className="activation-btn" onClick={handleEnableAudio}>
              {language === 'th' ? 'แตะเพื่อเปิดการแจ้งเตือนเสียง' : 'Tap to Enable Sound Alerts'}
            </button>
            <p className="activation-subtext">
              {language === 'th'
                ? 'กดครั้งเดียวเพื่อรับการแจ้งเตือนเสียงสำหรับออเดอร์ใหม่'
                : 'Tap once to enable sound alerts for incoming orders.'}
            </p>
            <p className="activation-warning">
              {language === 'th'
                ? '* สถานะการแจ้งเตือนเสียงจะถูกรีเซ็ตและต้องเปิดใช้งานใหม่ทุกครั้งที่มีการโหลดหน้าเว็บใหม่'
                : '* Sound settings reset and must be re-enabled on every page load or refresh.'}
            </p>
          </div>
        </div>
      )}

      {/* Custom Waiter Header */}
      <header className="waiter-header">
        <div className="waiter-header-left">
          <h1 className="waiter-title">Ada's Cafe Dashboard</h1>
          <span className="waiter-tag">{t('waiter.title')}</span>
        </div>

        <div className="waiter-header-right">
          <div className={`connection-pill ${wsConnected ? 'connected' : 'disconnected'}`}>
            {wsConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{wsConnected ? 'Server Connected' : 'Server Disconnected'}</span>
          </div>
        </div>
      </header>

      <div className="waiter-cols-container">
        {/* Left Column: Pending New Orders */}
        <section className="waiter-col">
          <div className="col-header pending-color">
            <h2>{t('waiter.newBadge')} ({pendingOrders.length})</h2>
          </div>
          
          <div className="orders-grid">
            {pendingOrders.length === 0 ? (
              <div className="waiter-empty-card">
                <p>{t('waiter.noOrders')}</p>
                <span>{t('waiter.noOrdersHint')}</span>
              </div>
            ) : (
              pendingOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onConfirm={handleConfirmOrder}
                  onReprint={handleReprintOrder}
                />
              ))
            )}
          </div>
        </section>

        {/* Right Column: Confirmed/Accepted Orders */}
        <section className="waiter-col">
          <div className="col-header confirmed-color">
            <h2>{t('waiter.confirmedBadge')} ({confirmedOrders.length})</h2>
          </div>

          <div className="orders-grid">
            {confirmedOrders.length === 0 ? (
              <div className="waiter-empty-card">
                <p>ไม่มีออเดอร์ที่รับแล้ว</p>
              </div>
            ) : (
              confirmedOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onConfirm={handleConfirmOrder}
                  onReprint={handleReprintOrder}
                />
              ))
            )}
          </div>
        </section>
      </div>

      <style>{`
        .reconnect-banner {
          background-color: var(--color-new-order);
          color: white;
          text-align: center;
          padding: 10px;
          font-weight: 700;
          font-size: 14px;
          animation: pulse 1.5s infinite;
          letter-spacing: 0.5px;
          border-bottom: 2px solid rgba(0,0,0,0.1);
        }

        .audio-activation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--color-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .activation-card {
          background-color: var(--color-surface);
          border: 2px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 40px 30px;
          text-align: center;
          max-width: 440px;
          width: 100%;
          box-shadow: 0 10px 25px rgba(139,69,19,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .activation-brand {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 700;
          color: var(--color-accent);
          margin-bottom: 20px;
          letter-spacing: 1px;
        }

        .activation-bell-icon {
          font-size: 64px;
          margin-bottom: 24px;
          animation: pulse 2s infinite ease-in-out;
        }

        .activation-btn {
          background-color: var(--color-primary);
          color: white;
          font-size: 15px;
          font-weight: 700;
          padding: 14px 28px;
          border-radius: 30px;
          margin-bottom: 16px;
          width: 100%;
          box-shadow: 0 4px 12px rgba(45,80,22,0.25);
          transition: all var(--transition-fast);
        }

        .activation-btn:hover {
          background-color: var(--color-primary-mid);
          transform: translateY(-1px);
        }

        .activation-subtext {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-text);
          margin-bottom: 12px;
          line-height: 1.4;
        }

        .activation-warning {
          font-size: 11px;
          font-weight: 600;
          color: var(--color-new-order);
          line-height: 1.4;
        }

        .waiter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: var(--color-surface);
          padding: 14px 20px;
          border-bottom: 2px solid var(--color-border);
        }

        .waiter-title {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--color-accent);
          line-height: 1;
        }

        .waiter-tag {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-primary-mid);
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-top: 2px;
          display: block;
        }

        .connection-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 30px;
          color: white;
        }

        .connection-pill.connected {
          background-color: var(--color-primary);
        }

        .connection-pill.disconnected {
          background-color: var(--color-new-order);
          animation: pulse 1.5s infinite;
        }

        .waiter-cols-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          padding: 20px;
          flex: 1;
        }

        @media (min-width: 768px) {
          .waiter-cols-container {
            grid-template-columns: 1fr 1fr;
          }
        }

        .waiter-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-color: rgba(139,69,19,0.02);
          border-radius: var(--radius-lg);
          padding: 16px;
          border: 1px dashed var(--color-border);
          min-height: 70vh;
        }

        .col-header {
          padding-bottom: 8px;
          border-bottom: 2px solid var(--color-border);
          margin-bottom: 6px;
        }

        .col-header h2 {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
        }

        .pending-color h2 {
          color: var(--color-new-order);
        }

        .confirmed-color h2 {
          color: var(--color-primary);
        }

        .orders-grid {
          display: flex;
          flex-direction: column;
          gap: 16px;
          overflow-y: auto;
          max-height: 75vh;
        }

        .waiter-empty-card {
          text-align: center;
          color: var(--color-text-muted);
          padding: 60px 20px;
          background-color: var(--color-surface);
          border: 1px dashed var(--color-border);
          border-radius: var(--radius-md);
        }

        .waiter-empty-card p {
          font-size: 14px;
          font-weight: 700;
        }

        .waiter-empty-card span {
          font-size: 11px;
          margin-top: 4px;
          display: block;
        }
      `}</style>
    </div>
  );
};
export default WaiterScreen;
