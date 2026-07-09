
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function dump() {
  const colRef = collection(db, 'campaigns');
  const snapshot = await getDocs(colRef);
  console.log('--- Campaigns ---');
  snapshot.forEach((doc) => {
    console.log(`ID: ${doc.id}, Data: ${JSON.stringify(doc.data())}`);
  });
}

dump().catch(console.error);
