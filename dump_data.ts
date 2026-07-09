
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function dump() {
  const collections = ['campaigns', 'product_campaigns'];
  for (const col of collections) {
    console.log(`--- Collection: ${col} ---`);
    const snapshot = await getDocs(collection(db, col));
    snapshot.forEach((doc) => {
      console.log(`ID: ${doc.id}`);
      console.log(`Data: ${JSON.stringify(doc.data())}`);
      console.log('---');
    });
  }
}

dump();
