import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);

const test = async () => {
    // Generate the URL for the function
    const url = `https://southamerica-east1-${config.projectId}.cloudfunctions.net/createPreference`;
    console.log("Fetching URL:", url);
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            data: {
                orderId: 'test',
                companyId: 'pallyra',
                items: [],
                payer: { name: 'Test', email: 'test@test.com' },
                back_urls: { success: 'http', failure: 'http', pending: 'http' },
                auto_return: 'approved'
            }
        })
    });
    
    console.log("Status:", res.status);
    console.log("Headers:", res.headers.get('content-type'));
    const text = await res.text();
    console.log("Response text:", text);
};
test();
