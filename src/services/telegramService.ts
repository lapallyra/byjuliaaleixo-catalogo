import { db } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';

const getSystemNotificationsConfig = async (): Promise<any> => {
  try {
    const docSnap = await getDoc(doc(db, 'system_notifications', 'settings'));
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (e) {
    console.error('Error fetching system notifications config in telegramService:', e);
  }
  return null;
};

const decryptHex = (str: string) => {
  try {
     return atob(str.split('').reverse().join(''));
  } catch(e) { return "" }
};

export const resendTelegramNotification = async (logId: string, logData: any) => {
   // Re-send it
   await sendTelegramNotification(logData.type, logData.message);
};

export const sendTelegramNotification = async (type: string, message: string) => {
  try {
    const tgConfig = await getSystemNotificationsConfig();
    
    if (!tgConfig || !tgConfig.telegram_enabled || !tgConfig.telegram_bot_token || !tgConfig.telegram_chat_id) {
      return; 
    }

    // Check specific preferences
    if (type === 'new_order' && !tgConfig.notify_new_order) return;
    if (type === 'payment_confirmed' && !tgConfig.notify_payment_confirmed) return;
    if (type === 'order_canceled' && !tgConfig.notify_order_canceled) return;
    if (type === 'order_completed' && !tgConfig.notify_order_completed) return;
    if (type === 'low_stock' && !tgConfig.notify_low_stock) return;
    if (type === 'new_client' && !tgConfig.notify_new_client) return;

    const token = decryptHex(tgConfig.telegram_bot_token);
    if (!token) return;

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: tgConfig.telegram_chat_id,
        text: message
      })
    });

    if (res.ok) {
       await logTelegramEvent(type, message, 'success');
    } else {
       await logTelegramEvent(type, message, 'error', await res.text());
    }

  } catch (error: any) {
    console.error("Failed to send telegram notification:", error);
    await logTelegramEvent(type, message, 'error', error.message);
  }
};

const logTelegramEvent = async (type: string, message: string, status: 'success' | 'error', errorDetails?: string) => {
   try {
     await addDoc(collection(db, 'telegram_logs'), {
        type,
        message,
        status,
        errorDetails: errorDetails || '',
        createdAt: serverTimestamp()
     });
   } catch(e) {
     console.error("Failed to log telegram event", e);
   }
};
