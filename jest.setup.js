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
             if (args[0]?.type === 'collection') {
                 path = `${args[0].path}/${args[1] || 'auto-id-' + Math.random().toString(36).substr(2,9)}`;
             } else {
                 path = args.slice(1).join('/');
             }
             return { type: 'doc', path, id: path.split('/').pop() };
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
        where: jest.fn((field, op, value) => ({ type: 'where', field, op, value })),
        orderBy: jest.fn((field, dir) => ({ type: 'orderBy', field, dir })),
        limit: jest.fn((n) => ({ type: 'limit', n })),
        serverTimestamp: jest.fn(() => ({ 
            toMillis: () => Date.now(),
            seconds: Math.floor(Date.now() / 1000) 
        })),
        increment: jest.fn((n) => ({ __isIncrement: true, value: n })), 
        arrayUnion: jest.fn((...items) => items),
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
