let orders = [];
let nextOrderId = 1;

export const orderQueue = {
  addOrder(orderData) {
    const order = {
      id: nextOrderId++,
      table: orderData.table || "0",
      items: orderData.items || [],
      status: "pending", // pending, confirmed
      timestamp: new Date().toISOString(),
      note: orderData.note || "",
      total: orderData.total || 0,
      printRetries: 0,
      printStatus: "idle" // idle, printing, printed, failed
    };
    orders.push(order);
    console.log(`[QUEUE] Order #${order.id} pushed to queue`);
    return order;
  },

  confirmOrder(id) {
    const order = orders.find(o => o.id === parseInt(id));
    if (order) {
      const oldStatus = order.status;
      order.status = "confirmed";
      console.log(`[WAITER] Order #${id} confirmed by waiter`);
      console.log(`[WAITER] Status updated: ${oldStatus} → confirmed ✓`);
    }
    return order;
  },

  getOrders() {
    return orders;
  },

  getOrder(id) {
    return orders.find(o => o.id === parseInt(id));
  },

  updatePrintStatus(id, status) {
    const order = orders.find(o => o.id === parseInt(id));
    if (order) {
      order.printStatus = status;
      console.log(`[QUEUE] Order #${id} print status updated: ${status} ✓`);
    }
  },

  incrementPrintRetries(id) {
    const order = orders.find(o => o.id === parseInt(id));
    if (order) {
      order.printRetries += 1;
      console.log(`[RETRY] Order #${id} print retry count: ${order.printRetries}/3`);
      return order.printRetries;
    }
    return 0;
  }
};
