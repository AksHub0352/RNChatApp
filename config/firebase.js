import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Constants from "expo-constants";

// Firebase config
const firebaseConfig = {
    apiKey: Constants?.expoConfig?.extra?.apiKey,
    authDomain: Constants?.expoConfig?.extra?.authDomain,
    projectId: Constants?.expoConfig?.extra?.projectId,
    storageBucket: Constants?.expoConfig?.extra?.storageBucket,
    messagingSenderId: Constants?.expoConfig?.extra?.messagingSenderId,
    appId: Constants?.expoConfig?.extra?.appId,
    databaseURL: Constants?.expoConfig?.extra?.databaseURL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Define and export auth variable
export const database = getFirestore(app);
export const storage = getStorage(app);


// Function to upload image to Firebase Storage
export const uploadImageToFirebase = async (uri, fileName) => {
    const imageRef = ref(storage, `images/${fileName}`);
    const uploadTask = uploadBytesResumable(imageRef, uri);

    return new Promise((resolve, reject) => {
        uploadTask.on(
            "state_changed",
            null,
            (error) => {
                reject(error);
            },
            async () => {
                const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
                resolve(downloadUrl);
            }
        );
    });
};

// Function to add a new document to Firestore collection
export const addMessageToFirestore = async (message) => {
    try {
        await addDoc(collection(database, 'chats'), message);
    } catch (error) {
        console.error('Error adding document: ', error);
    }
};
