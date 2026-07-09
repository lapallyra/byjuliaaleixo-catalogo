import { db } from '../lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';

export const resendTelegramNotification = async (logId: string, logData: any) => {
   // Re-send it
   await sendTelegramNotification(logData.type, logData.message);
};

export const sendTelegramNotification = async (type: string, message: string) => {
  try {
    const res = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        message: message
      })
    });

    if (res.ok) {
       await logTelegramEvent(type, message, 'success');
    } else {
       const errorText = await res.text();
       await logTelegramEvent(type, message, 'error', errorText);
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
