import firebase from "@firebase/app";
// import "@firebase/firestore"; // jika hanya ingin menggunakan firebase database
import config from "./firebaseConfig";
const firebaseInitConfig =  firebase.initializeApp( config )
export const firebaseFirestore = firebaseInitConfig.firestore()