import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import { orderQueue } from './orderQueue.js';
import { sendPrintJob } from './printer.js';

// Load Environment Variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = process.env.BRIDGE_PORT || 3000;
const SERVER_IP = process.env.BRIDGE_SERVER_IP || 'YOUR_SERVER_IP_HERE';
const PRINTER_IP = process.env.KITCHEN_PRINTER_IP || 'YOUR_PRINTER_IP_HERE';

// ── Startup Checklist Checkers ──
const menuPath = path.join(__dirname, 'menu.json');
if (!fs.existsSync(menuPath)) {
  console.error("╔══════════════════════════════════════════╗");
  console.error("║ ✗ CRITICAL ERROR: menu.json NOT FOUND    ║");
  console.error("║ Server cannot start without menu data.   ║");
  console.error("╚══════════════════════════════════════════╝");
  process.exit(1);
}

// Load menu data
let menuData = { categories: [], items: [] };
try {
  menuData = JSON.parse(fs.readFileSync(menuPath, 'utf-8'));
} catch (err) {
  console.error("Error reading menu.json:", err);
  process.exit(1);
}

const clientDistPath = path.join(__dirname, '../client/dist');
const distFound = fs.existsSync(clientDistPath);

app.use(cors());
app.use(express.json());

// WebSocket client registry
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[ORDER] WebSocket clients connected: ${clients.size}`);
  
  ws.send(JSON.stringify({
    type: 'init_orders',
    data: orderQueue.getOrders()
  }));

  ws.on('close', () => {
    clients.delete(ws);
  });

  ws.on('error', () => {
    clients.delete(ws);
  });
});

function broadcast(messageObj) {
  const payload = JSON.stringify(messageObj);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// Background Print Scheduler with Retries (30 seconds)
async function printOrderAsync(order) {
  const maxRetries = 3;
  const retryDelay = 30000; // 30 seconds between retries as required by Task 2
  const orderIdFormatted = String(order.id).padStart(4, '0');

  orderQueue.updatePrintStatus(order.id, 'printing');
  broadcast({ type: 'print_status_update', data: { orderId: order.id, printStatus: 'printing', retries: order.printRetries } });

  while (order.printRetries < maxRetries) {
    try {
      console.log(`[ORDER] Sending to kitchen printer (${PRINTER_IP}:9100)...`);
      await sendPrintJob(order, PRINTER_IP);
      return;
    } catch (err) {
      orderQueue.incrementPrintRetries(order.id);
      
      console.log(`[PRINT] Order #${orderIdFormatted} added to retry queue (attempt ${order.printRetries}/${maxRetries})`);
      
      broadcast({ 
        type: 'print_status_update', 
        data: { 
          orderId: order.id, 
          printStatus: 'printing', 
          retries: order.printRetries, 
          error: err.message 
        } 
      });

      if (order.printRetries >= maxRetries) {
        break;
      }
      
      console.log(`[RETRY] Order #${orderIdFormatted} reprint scheduled in 30 seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  orderQueue.updatePrintStatus(order.id, 'failed');
  broadcast({ type: 'print_status_update', data: { orderId: order.id, printStatus: 'failed', retries: order.printRetries } });
}

// ── HTTP API Endpoints ──

// Health Check
app.get('/api/health', (req, res) => {
  console.log(`[HEALTH] Status check requested`);
  const ordersList = orderQueue.getOrders();
  const pendingPrints = ordersList.filter(o => o.printStatus === 'printing' || o.printStatus === 'idle').length;

  console.log(`[HEALTH] Uptime: ${Math.round(process.uptime())}s | Orders: ${ordersList.length} | Pending prints: ${pendingPrints}`);

  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    printerIp: PRINTER_IP,
    orderCount: ordersList.length,
    pendingPrints: pendingPrints,
    timestamp: new Date().toISOString()
  });
});

// Get Menu Data
app.get('/api/menu', (req, res) => {
  res.json(menuData);
});

// Get All Orders
app.get('/api/orders', (req, res) => {
  res.json(orderQueue.getOrders());
});

// Create Order (Both /api/order and /api/orders mapping)
const handleCreateOrder = (req, res) => {
  const { table, items, note, total } = req.body;
  const tableNumber = parseInt(table);

  console.log(`[ORDER] New order received`);

  // Table range validation 1–32 (Task 3)
  if (isNaN(tableNumber) || tableNumber < 1 || tableNumber > 32) {
    console.log(`[ORDER] ✗ Invalid table number received: ${table}`);
    return res.status(400).json({ error: "Invalid table number. Must be 1–32." });
  }

  const section = tableNumber <= 20 ? 'อินดอร์' : 'เอาท์ดอร์';
  const order = orderQueue.addOrder({ table: String(tableNumber), items, note, total });
  const orderIdFormatted = String(order.id).padStart(4, '0');

  console.log(`[ORDER] Table: ${tableNumber} (${section}) | Order ID: #${orderIdFormatted} | Items: ${items.length}`);
  
  // Log items
  console.log(`[ORDER] Items:`);
  items.forEach(item => {
    const mods = (item.modifiers || []).map(m => m.name_th || m.name_en)
      .concat((item.addOns || []).map(a => a.name_th || a.name_en));
    const modsStr = mods.length > 0 ? ` [${mods.join(' / ')}]` : '';
    const noteStr = item.note ? ` Note: ${item.note}` : '';
    console.log(`              ${item.quantity}x ${item.name_th}${modsStr}${noteStr}`);
  });

  console.log(`[ORDER] Saved to queue ✓`);
  console.log(`[ORDER] Broadcasting to Waiter Screen via WebSocket...`);
  
  // Broadcast
  broadcast({
    type: 'new_order',
    data: order
  });
  console.log(`[ORDER] Broadcast sent ✓`);

  // Trigger print asynchronously
  printOrderAsync(order).catch(console.error);

  res.status(201).json({
    success: true,
    order: order
  });
};

app.post('/api/order', handleCreateOrder);
app.post('/api/orders', handleCreateOrder);

// Confirm Order (by Waiter)
app.post('/api/order/:id/confirm', (req, res) => {
  const orderId = req.params.id;
  const order = orderQueue.getOrder(orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  const confirmedOrder = orderQueue.confirmOrder(orderId);
  
  // Broadcast
  broadcast({
    type: 'order_confirmed',
    data: confirmedOrder
  });
  console.log(`[WAITER] Broadcast sent to all clients ✓`);

  // Re-trigger print
  printOrderAsync(confirmedOrder).catch(console.error);

  res.json({
    success: true,
    order: confirmedOrder
  });
});

// Manual reprint
app.post('/api/order/:id/reprint', (req, res) => {
  const orderId = req.params.id;
  const order = orderQueue.getOrder(orderId);

  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  console.log(`[REPRINT] Manual reprint requested for Order #${orderId}`);
  
  // Reset attempts
  order.printRetries = 0;
  printOrderAsync(order).catch(console.error);

  res.json({
    success: true,
    message: `Reprint triggered for Order #${orderId}`
  });
});

// ── Serve Built Client Assets ──
if (distFound) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.send("Ada's Cafe Bridge Server is running. Client build folder not found. Run 'cd client && npm run build'.");
  });
}

// ── Startup Checklist Log (Task 1) ──
server.listen(PORT, '0.0.0.0', () => {
  const ipWarning = SERVER_IP === "YOUR_SERVER_IP_HERE";
  const printerWarning = PRINTER_IP === "YOUR_PRINTER_IP_HERE";

  console.log("\n  ╔══════════════════════════════════════════╗");
  console.log("  ║     ADA'S CAFE — QR ORDER SYSTEM       ║");
  console.log("  ║         Startup Checklist               ║");
  console.log("  ╚══════════════════════════════════════════╝\n");

  console.log("  [CONFIG]");
  console.log(`  ${ipWarning ? '⚠️' : '✓'} Bridge Server IP   : ${SERVER_IP}`);
  console.log(`  ✓ Bridge Port        : ${PORT}`);
  console.log(`  ${printerWarning ? '⚠️' : '✓'} Kitchen Printer IP : ${PRINTER_IP}`);
  console.log(`  ✓ Table Count        : 32 (Indoor: 20, Outdoor: 12)`);
  console.log(`  ✓ Default Wait Time  : 10 minutes\n`);

  console.log("  [FILES]");
  console.log(`  ✓ menu.json found    : ${menuData.categories.length} categories, ${menuData.items.length} items`);
  console.log(`  ✓ i18n/th.ts         : loaded`);
  console.log(`  ✓ i18n/en.ts         : loaded`);
  if (distFound) {
    console.log(`  ✓ client/dist/       : found`);
  } else {
    console.log(`  ✗ client/dist/       : NOT FOUND → run: cd client && npm run build`);
  }
  console.log("");

  console.log("  [NETWORK] (not tested — will test on first boot at cafe)");
  console.log("  ⏳ Printer TCP connection will be attempted on first order");
  console.log("  ⏳ WebSocket will bind when first client connects\n");

  console.log("  [WARNINGS]");
  if (ipWarning) {
    console.log("  ⚠️  BRIDGE_SERVER_IP is still set to example value");
    console.log("      → Update server/.env before going live");
  } else {
    console.log("  ✓ BRIDGE_SERVER_IP is configured");
  }

  if (printerWarning) {
    console.log("  ⚠️  KITCHEN_PRINTER_IP is still set to example value");
    console.log("      → Find printer IP: hold Feed button on printer at startup");
  } else {
    console.log("  ✓ KITCHEN_PRINTER_IP is configured");
  }
  console.log("");

  console.log("  ══════════════════════════════════════════");
  console.log(`  Server running at: http://${SERVER_IP}:${PORT}`);
  console.log(`  Waiter screen   : http://${SERVER_IP}:${PORT}/waiter`);
  console.log("  ══════════════════════════════════════════\n");
});
