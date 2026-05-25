import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const functions = getFunctions(app);

const test = async () => {
  try {
    const createPreference = httpsCallable(functions, 'createPreference');
    const result = await createPreference({
        orderId: 'test',
        companyId: 'pallyra',
        items: [],
        payer: { name: 'Test', email: 'test@test.com' },
        back_urls: { success: 'http', failure: 'http', pending: 'http' },
        auto_return: 'approved'
    });
    console.log("Success:", result.data);
  } catch(e: any) {
    console.log("Error name:", e.name);
    console.log("Error code:", e.code);
    console.log("Error message:", e.message);
    console.log("Error details:", e.details);
  }
};
test();
