
const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs } = require("firebase/firestore");

const firebaseConfig = {
    apiKey: "AIzaSyA4lFiX3y6E22GEpxoxT8t1BoNN4DGBZBc",
    authDomain: "weekly-arcade-live.firebaseapp.com",
    projectId: "weekly-arcade-live",
    storageBucket: "weekly-arcade-live.firebasestorage.app",
    messagingSenderId: "1092821016254",
    appId: "1:1092821016254:web:3a06f25f45a2c87e5a48ef"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function testConnection() {
    console.log("🔥 Starting Firebase Connection Test...");
    try {
        // 1. Try to WRITE
        console.log("👉 Attempting to write to 'test_connection' collection...");
        const docRef = await addDoc(collection(db, "test_connection"), {
            timestamp: new Date(),
            test: "Hello form Together App"
        });
        console.log("✅ Write Successful! Document ID: ", docRef.id);

        // 2. Try to READ
        console.log("👉 Attempting to read from 'test_connection' collection...");
        const querySnapshot = await getDocs(collection(db, "test_connection"));
        console.log(`✅ Read Successful! Found ${querySnapshot.size} documents.`);
        querySnapshot.forEach((doc) => {
            console.log(`   - ${doc.id} =>`, doc.data());
        });

    } catch (e) {
        console.error("❌ Firebase Test Failed!");
        console.error("Error Message:", e.message);
        if (e.code) console.error("Error Code:", e.code);
    }
}

testConnection();
