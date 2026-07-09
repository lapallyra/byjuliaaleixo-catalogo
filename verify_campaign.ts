
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function verify() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  try {
    const colRef = collection(db, 'campaigns');
    const snapshot = await getDocs(colRef);
    let found = false;
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (doc.id === 'yqrlQYzJTsNr4Y7uGs4E') {
        found = true;
        console.log('--- Found Test Campaign ---');
        console.log(`ID: ${doc.id}`);
        console.log(`Data: ${JSON.stringify(data)}`);
      }
    });
    if (!found) {
        console.log('Campaign not found.');
    }
  } catch (e) {
    console.error('Error verifying campaign:', e);
  }
}

verify();
