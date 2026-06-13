import net from 'net';

// Helper to encode Thai Unicode characters to CP874 (TIS-11) bytes
export function encodeThaiCP874(text) {
  const bytes = [];
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0x0E01 && code <= 0x0E5B) {
      bytes.push(code - 0x0E01 + 0xA1);
    } else if (code < 128) {
      bytes.push(code);
    } else {
      if (code === 0x0E3F) {
        bytes.push(0xDF);
      } else {
        bytes.push(0x20); // space
      }
    }
  }
  return Buffer.from(bytes);
}

// ESC/POS Command Constants
const ESC = 0x1B;
const GS = 0x1D;

const CMD_INIT = Buffer.from([ESC, 0x40]); 
const CMD_SELECT_CP874 = Buffer.from([ESC, 0x74, 0x1A]); 

const CMD_ALIGN_LEFT = Buffer.from([ESC, 0x61, 0x00]);
const CMD_ALIGN_CENTER = Buffer.from([ESC, 0x61, 0x01]);

const CMD_BOLD_ON = Buffer.from([ESC, 0x45, 0x01]);
const CMD_BOLD_OFF = Buffer.from([ESC, 0x45, 0x00]);

const CMD_SIZE_DOUBLE = Buffer.from([GS, 0x21, 0x11]); 
const CMD_SIZE_NORMAL = Buffer.from([GS, 0x21, 0x00]); 

const CMD_CUT = Buffer.from([0x0A, 0x0A, 0x0A, 0x0A, GS, 0x56, 0x42, 0x00]); 

export function sendPrintJob(order, printerIp) {
  return new Promise((resolve, reject) => {
    if (!printerIp) {
      const err = new Error("Printer IP is not configured");
      console.log(`[PRINT] Print failed: ${err.message}`);
      return reject(err);
    }

    const socket = new net.Socket();
    socket.setTimeout(4000); 

    socket.connect(9100, printerIp, () => {
      console.log(`[PRINT] TCP connection opened ✓`);
      
      const chunks = [];
      chunks.push(CMD_INIT);
      chunks.push(CMD_SELECT_CP874);

      // Derive table and section
      const tableNum = parseInt(order.table) || 0;
      const section = tableNum <= 20 ? 'อินดอร์' : 'เอาท์ดอร์';

      // Time format HH:MM
      const dateObj = new Date(order.timestamp);
      const timeStr = dateObj.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false, 
        timeZone: 'Asia/Bangkok' 
      });

      // Receipt Header
      chunks.push(CMD_ALIGN_CENTER);
      chunks.push(CMD_BOLD_ON);
      chunks.push(encodeThaiCP874("================================\n"));
      chunks.push(encodeThaiCP874("      ADA'S CAFE' * ฮาลาล\n"));
      chunks.push(encodeThaiCP874("================================\n"));
      
      chunks.push(CMD_ALIGN_LEFT);
      // Large Table & ID line
      chunks.push(CMD_BOLD_ON);
      chunks.push(encodeThaiCP874(`โต๊ะ: ${tableNum} (${section})   #${String(order.id).padStart(4, '0')}\n`));
      chunks.push(CMD_BOLD_OFF);
      
      chunks.push(encodeThaiCP874(`เวลา: ${timeStr} น.\n`));
      chunks.push(encodeThaiCP874("--------------------------------\n"));

      // Items
      let totalQty = 0;
      order.items.forEach(item => {
        totalQty += item.quantity;
        chunks.push(encodeThaiCP874(`${item.quantity}x ${item.name_th}\n`));

        const mods = [];
        if (item.modifiers && item.modifiers.length > 0) {
          item.modifiers.forEach(m => {
            mods.push(m.name_th || m.name_en);
          });
        }
        if (item.addOns && item.addOns.length > 0) {
          item.addOns.forEach(a => {
            mods.push(`เพิ่ม ${a.name_th || a.name_en}`);
          });
        }

        if (mods.length > 0) {
          chunks.push(encodeThaiCP874(`    [${mods.join(', ')}]\n`));
        }

        if (item.note) {
          chunks.push(encodeThaiCP874(`    หมายเหตุ: ${item.note}\n`));
        }
      });

      chunks.push(encodeThaiCP874("--------------------------------\n"));
      chunks.push(CMD_BOLD_ON);
      chunks.push(encodeThaiCP874(`รวม ${totalQty} รายการ\n`));
      chunks.push(encodeThaiCP874("================================\n"));
      chunks.push(encodeThaiCP874("[QR ORDER — ครัว]\n"));
      chunks.push(encodeThaiCP874("================================\n"));
      chunks.push(CMD_BOLD_OFF);

      chunks.push(CMD_CUT);

      const buffer = Buffer.concat(chunks);
      const bytesSent = buffer.length;

      socket.write(buffer, () => {
        console.log(`[PRINT] KOT bytes sent: ${bytesSent} bytes ✓`);
        socket.destroy();
      });
    });

    socket.on('close', (hadError) => {
      if (!hadError) {
        console.log(`[PRINT] TCP connection closed ✓`);
        console.log(`[PRINT] Order #${String(order.id).padStart(4, '0')} print status: SUCCESS`);
        resolve(true);
      }
    });

    socket.on('error', (err) => {
      console.log(`[PRINT] TCP connection FAILED: ${err.code || err.message}`);
      socket.destroy();
      reject(err);
    });

    socket.on('timeout', () => {
      console.log(`[PRINT] TCP connection FAILED: Timeout`);
      socket.destroy();
      reject(new Error("Timeout"));
    });
  });
}
