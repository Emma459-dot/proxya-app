import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"

// IMPORTANT: Remplacez ces valeurs par votre vraie configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDcbtz4WbxjgXFv69p-XmaMYy8lFcDZYrc",
  authDomain: "proxya-47d11.firebaseapp.com",
  projectId: "proxya-47d11",
  storageBucket: "proxya-47d11.firebasestorage.app",
  messagingSenderId: "260156643504",
  appId: "1:260156643504:web:cf454bd4a68afe5df08375"
};
// Initialisation de l'app Firebase
const app = initializeApp(firebaseConfig)

// Initialisation de Firestore
export const db = getFirestore(app)

// Pour le développement local, vous pouvez utiliser l'émulateur (optionnel)
// if (location.hostname === 'localhost') {
//   connectFirestoreEmulator(db, 'localhost', 8080)
// }

console.log("Firebase initialisé avec le projet:", firebaseConfig.projectId)
