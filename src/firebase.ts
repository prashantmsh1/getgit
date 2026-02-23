// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "getgit-34305.firebaseapp.com",
  projectId: "getgit-34305",
  storageBucket: "getgit-34305.firebasestorage.app",
  messagingSenderId: "1017141319802",
  appId: "1:1017141319802:web:35c7231298e5330311c3c3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);

export async function uploadFile(
  file: File,
  setProgress?: (progress: number) => void,
) {
  return new Promise((resolve, reject) => {
    try {
      const storageRef = ref(storage, `files/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress?.(Number(progress.toFixed(2)));

          switch (snapshot.state) {
            case "paused":
              console.log("Upload is paused");
              break;
            case "running":
              console.log("Upload is running");
              break;
            case "success":
              console.log("Upload is done");
              break;
            case "error":
              console.log("Upload is failed");
              break;
          }
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((downloadURL) => {
              resolve(downloadURL);
            })
            .catch(reject);
        },
      );
    } catch (error) {
      console.log(error);
    }
  });
}
