
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function check() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  
  try {
    const colRef = collection(db, 'campaigns');
    const snapshot = await getDocs(colRef);
    console.log('--- Campaigns ---');
    console.log(`Count: ${snapshot.size}`);
    snapshot.forEach((doc) => {
      console.log(`ID: ${doc.id}`);
    });
  } catch (e) {
    console.error('Error:', e);
  }
}

check();
