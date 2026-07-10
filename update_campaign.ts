
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

async function updateCampaign() {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const campaignId = 'yqrlQYzJTsNr4Y7uGs4E';
  
  const updatedData = {
    title: "Coleção Especial: Presentes que Encantam",
    subtitle: "Detalhes únicos para transformar momentos especiais",
    description: "Uma seleção especial de personalizados feitos com carinho para presentear quem você ama.",
    colorTheme: "#FAF9F6",
    linkUrl: "/catalog",
    updatedAt: new Date()
  };

  try {
    const docRef = doc(db, 'campaigns', campaignId);
    await updateDoc(docRef, updatedData);
    console.log(`Successfully updated campaign ${campaignId}`);
  } catch (e) {
    console.error('Error updating campaign:', e);
  }
}

updateCampaign();
