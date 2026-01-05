const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, setDoc, doc, serverTimestamp } = require("firebase/firestore");

// Config from weekly-arcade
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

const MOCKED_USER_ID = "user_123";

async function seedData() {
    console.log("Seeding data for mocked user...");

    try {
        // 1. Manually create a group for "learn-coding-basic"
        const groupRef = doc(collection(db, 'groups'));
        await setDoc(groupRef, {
            id: groupRef.id,
            goalId: 'learn-coding-basic',
            name: 'Learn Basic Coding Group A',
            maxMembers: 10,
            memberCount: 1,
            isActive: true,
            createdAt: serverTimestamp(),
        });
        console.log(`✅ Created Group: ${groupRef.id}`);

        // 2. Manually create UserGroup membership
        const membershipRef = doc(collection(db, 'userGroups'));
        await setDoc(membershipRef, {
            id: membershipRef.id,
            userId: MOCKED_USER_ID,
            groupId: groupRef.id,
            goalId: 'learn-coding-basic',
            role: 'member',
            joinedAt: serverTimestamp(),
        });
        console.log(`✅ Created UserGroup membership for ${MOCKED_USER_ID}`);

    } catch (e) {
        console.error("❌ Seeding Failed:", e);
    }
}

seedData();
