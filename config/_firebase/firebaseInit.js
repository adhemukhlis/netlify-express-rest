import firebase from "@firebase/app";
import "@firebase/database"; // jika hanya ingin menggunakan firebase database
import config from "./firebaseConfig";

export default(!firebase.apps.length ? firebase.initializeApp( config ) : firebase.app( ));