/**
 * A simple in-memory implementation of Firestore for testing flows.
 */
class MockFirestore {
    data: Record<string, Record<string, any>> = {};

    constructor() {
        this.data = {};
    }

    reset() {
        this.data = {};
    }

    set(path: string, data: any, options: { merge?: boolean } = {}) {
        const existing = this.data[path] || {};

        let newData = data;
        if (options.merge) {
            newData = { ...existing };
            // Merge keys individually to support field transforms (like increment)
            for (const key in data) {
                const value = data[key];
                // Check for our custom increment sentinel
                if (value && typeof value === 'object' && value.__isIncrement) {
                    const currentVal = existing[key] || 0;
                    newData[key] = currentVal + value.value;
                } else {
                    newData[key] = value;
                }
            }
        } else {
            // Even in non-merge set, we might (rarely) see sentinels but usually setDoc wipes doc.
            // But if we use setDoc(..., { merge: true }), we fall into block above.
            // If strictly setDoc(doc), then it's a replacement. We assume no sentinels for pure replacement usually,
            // or if they exist, they behave same.
            newData = { ...data };
        }

        this.data[path] = newData;
    }

    get(path: string) {
        return this.data[path];
    }

    query(collectionPath: string, constraints: any[]) {
        const results = [];
        for (const key in this.data) {
            if (key.startsWith(collectionPath + '/')) {
                // Ensure it's a direct child? our mock uses flat paths so "groups/g1/messages/m1" 
                // startsWith "groups" but is not child of "groups".
                // We need to check segment count. 
                // collectionPath "groups", key "groups/g1" -> valid.
                // collectionPath "groups", key "groups/g1/messages/m1" -> invalid.

                const relative = key.substring(collectionPath.length + 1);
                if (relative.includes('/')) continue; // Deep child

                const docData = this.data[key];
                let match = true;

                for (const c of constraints) {
                    if (c.type === 'where') {
                        if (docData[c.field] !== c.value) match = false;
                    }
                    // mock other constraints if needed
                }
                if (match) results.push({ id: key.split('/').pop(), ...docData });
            }
        }
        return results;
    }
}

export const mockFirestore = new MockFirestore();
