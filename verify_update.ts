
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function verifyUpdate() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const campaignId = 'yqrlQYzJTsNr4Y7uGs4E';

  try {
    const docRef = doc(db, 'campaigns', campaignId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('--- Verified Updated Campaign ---');
      console.log(JSON.stringify(docSnap.data(), null, 2));
    } else {
      console.log('Campaign not found.');
    }
  } catch (e) {
    console.error('Error verifying campaign:', e);
  }
}

verifyUpdate();
