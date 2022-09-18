import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "@firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyD3KWukP2KoU4fENm-pNrgn_TeyqajzJeI",
    authDomain: "cdigi-425d6.firebaseapp.com",
    projectId: "cdigi-425d6",
    storageBucket: "cdigi-425d6.appspot.com",
    messagingSenderId: "897097657247",
    appId: "1:897097657247:web:95b9f14643e8839389ebaa",
    measurementId: "G-YNYZ8YP698"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Connect the db
export const db = getFirestore(app);