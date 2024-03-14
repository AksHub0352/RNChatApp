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

export const uploadImageToFirebase = async (uri, fileName) => {
    console.log('Uploading image with URI:', uri);
    console.log('File name:', fileName);

    const imageRef = ref(storage, `images/${fileName}`);

    try {
        // Fetch the image data and convert it to blob
        const response = await fetch(uri);
        const blob = await response.blob();

        console.log('Blob:', blob); // Log the blob

        // Log blob size
        console.log('Blob size:', blob.size);
        console.log('Expected file size:', 1060192); // Log the expected file size

        const uploadTaskSnapshot = await uploadBytesResumable(imageRef, blob);
        const downloadUrl = await getDownloadURL(uploadTaskSnapshot.ref);
        return downloadUrl;
    } catch (error) {
        console.error('Error uploading image to Firebase Storage: ', error);
        throw error;
    }
};






// Function to add a new document to Firestore collection
export const addMessageToFirestore = async (message) => {
    try {
        await addDoc(collection(database, 'chats'), message);
    } catch (error) {
        console.error('Error adding document: ', error);
    }
};
