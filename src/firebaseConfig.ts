import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import 'firebase/storage';

// La configurazione del tuo progetto Firebase (la ottieni dalla Firebase Console)
const firebaseConfig = {
    apiKey: "AIzaSyAiWA8BdCahuxOOlRIc3gKFFASwgPHbqfY",
    authDomain: "mappa-6aa71.firebaseapp.com",
    projectId: "mappa-6aa71",
    storageBucket: "mappa-6aa71.appspot.com",
    messagingSenderId: "160238399820",
    appId: "1:160238399820:web:18a6a8d74b241a05965fe9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// Inizializza Firestore
const db = getFirestore(app);

export { db };