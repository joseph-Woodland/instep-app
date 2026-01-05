// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  getApp: jest.fn(),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithCredential: jest.fn(),
  GoogleAuthProvider: {
    credential: jest.fn(),
  },
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
}));

/*
  Enhanced Firestore Mock that uses the in-memory `mockFirestore` store.
*/
jest.mock('firebase/firestore', () => {
    // We must require inside the factory because of hoisting
    const getMockFirestore = () => {
        try {
            const { mockFirestore } = require('./src/test/utils/mockFirestore');
            return mockFirestore;
        } catch (e) {
            console.error("Failed to require mockFirestore inside mock factory", e);
            return {
                get: () => null,
                set: () => {},
                query: () => []
            };
        }
    };

    return {
        getFirestore: jest.fn(),
        collection: jest.fn((...args) => {
            const path = args.slice(1).join('/');
            return { type: 'collection', path };
        }),
        doc: jest.fn((...args) => {
             let path = '';
             let id = '';
             
             if (args[0]?.type === 'collection') {
                 // doc(collectionRef, id)
                 // NOTE: Real Firestore throws if ID is missing/empty for existing collections (used for setDoc)
                 // However, doc(collection()) CAN be used for auto-id, but usually developers use addDoc.
                 // We will enforce stricter explicit ID usage to prevent test bugs where ID was accidentally undefined.
                 if (!args[1]) {
                     // If intentional auto-id via doc() is needed, we can relax this, but usually it's a smell in our specific codebase.
                     // Let's create an auto-id if really omitted but log warning? 
                     // Or just strictly require it unless it's a new document context.
                     // Per strict requirements: "Fail loudly on invalid usage"
                     throw new Error("MockFirestore: doc() requires an ID when used with a collection reference. Use addDoc() for auto-ID or provide a valid string ID.");
                 }
                 id = args[1];
                 path = `${args[0].path}/${id}`;
             } else {
                 // doc(db, "coll", "doc")
                 if (args.length < 3) { // db + coll + doc = 3 args min
                      throw new Error("MockFirestore: doc() requires full path arguments (db, collection, docId).");
                 }
                 path = args.slice(1).join('/');
                 id = path.split('/').pop();
             }
             
             if (!path || path.endsWith('/')) {
                 throw new Error(`MockFirestore: Invalid document path generated: "${path}"`);
             }
             
             return { type: 'doc', path, id };
        }),
        getDoc: jest.fn(async (ref) => {
            const store = getMockFirestore();
            const data = store.get(ref.path);
            return {
                exists: () => !!data,
                data: () => data,
                id: ref.id,
                ref
            };
        }),
        getDocs: jest.fn(async (queryOrRef) => {
            const store = getMockFirestore();
            let path = queryOrRef.path;
            let constraints = []; 
            if (queryOrRef.type === 'query') {
                path = queryOrRef.path;
                constraints = queryOrRef.constraints || [];
            }
            
            const docs = store.query(path, constraints);
            return {
                empty: docs.length === 0,
                docs: docs.map(d => ({
                    id: d.id,
                    data: () => d,
                    ref: { path: path + '/' + d.id }
                }))
            };
        }),
        setDoc: jest.fn(async (ref, data, options) => {
            const store = getMockFirestore();
            // Pass options (merge) correctly
            store.set(ref.path, data, options);
        }),
        updateDoc: jest.fn(async (ref, data) => {
            const store = getMockFirestore();
            store.set(ref.path, data, { merge: true });
        }),
        addDoc: jest.fn(async (collRef, data) => {
            const store = getMockFirestore();
            const id = 'doc-' + Math.random().toString(36).substr(2,9);
            const path = `${collRef.path}/${id}`;
            store.set(path, data);
            return { id, path };
        }),
        query: jest.fn((ref, ...constraints) => {
             return { 
                 type: 'query', 
                 path: ref.path, 
                 constraints: constraints.map(c => c)
             };
        }),
        where: jest.fn((field, op, value) => {
            // Validate op
            const validOps = ['==', '!=', '>', '>=', '<', '<=', 'array-contains', 'in', 'not-in', 'array-contains-any'];
            if (!validOps.includes(op)) {
                throw new Error(`MockFirestore: Unsupported 'where' operator: ${op}`);
            }
            return { type: 'where', field, op, value };
        }),
        orderBy: jest.fn((field, dir) => ({ type: 'orderBy', field, dir })),
        limit: jest.fn((n) => ({ type: 'limit', n })),
        serverTimestamp: jest.fn(() => ({ __isServerTimestamp: true })),
        increment: jest.fn((n) => ({ __isIncrement: true, value: n })), 
        arrayUnion: jest.fn((...items) => ({ __isArrayUnion: true, items })),
        onSnapshot: jest.fn((query, callback) => {
             // Immediate callback with current state
             const store = getMockFirestore();
             let path = query.path;
             let constraints = query.constraints || [];
             const docs = store.query(path, constraints);
             
             callback({
                empty: docs.length === 0,
                docs: docs.map(d => ({
                    id: d.id,
                    data: () => d,
                    ref: { path: path + '/' + d.id }
                }))
             });
             return () => {};
        })
    }
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
