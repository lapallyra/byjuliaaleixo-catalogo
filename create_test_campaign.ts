
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function createCampaign() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const campaign = {
    internalName: "Teste Banner Sazonal Home",
    title: "Especial Presentes Personalizados",
    subtitle: "Momentos especiais merecem presentes únicos",
    description: "Campanha temporária para validação visual do banner sazonal.",
    type: "seasonal_campaign",
    active: true,
    priority: 100,
    companyId: "all",
    items: [],
    targetPages: ["home"],
    startDate: "2026-07-09",
    endDate: "2026-12-31",
    imageUrl: "https://placehold.co/1200x400/cca062/white?text=Banner+Sazonal",
    mobileImageUrl: "https://placehold.co/600x400/cca062/white?text=Banner+Sazonal",
    colorTheme: "#cca062",
    linkUrl: "/catalog",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    const colRef = collection(db, 'campaigns');
    const docRef = await addDoc(colRef, campaign);
    console.log(`Successfully created campaign with ID: ${docRef.id}`);
  } catch (e) {
    console.error('Error creating campaign:', e);
  }
}

createCampaign();
