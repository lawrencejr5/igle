import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC0i3zSheu4MTNBiac7sMNPLE8Dt--urWc",
  authDomain: "igle-f826c.firebaseapp.com",
  projectId: "igle-f826c",
  storageBucket: "igle-f826c.firebasestorage.app",
  messagingSenderId: "554705834171",
  appId: "1:554705834171:web:aba2430678704560b2d99e",
  measurementId: "G-R8GEJD1NYN",
};

if (!getApps().length) initializeApp(firebaseConfig);

export const auth = getAuth();
export default firebaseConfig;
