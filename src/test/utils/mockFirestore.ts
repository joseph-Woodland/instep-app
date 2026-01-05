/**
 * A simple in-memory implementation of Firestore for testing flows.
 */
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

                // Handle sentinels
                if (value && typeof value === 'object') {
                    if (value.__isIncrement) {
                        const currentVal = existing[key] || 0;
                        newData[key] = currentVal + value.value;
                        continue;
                    }
                    if (value.__isArrayUnion) {
                        const currentArr = Array.isArray(existing[key]) ? existing[key] : [];
                        // Naive union: concat then unique
                        const set = new Set([...currentArr, ...value.items]);
                        newData[key] = Array.from(set);
                        continue;
                    }
                    if (value.__isServerTimestamp) {
                        // resolve to time
                        newData[key] = {
                            toMillis: () => Date.now(),
                            seconds: Math.floor(Date.now() / 1000)
                        };
                        continue;
                    }
                }

                // Normal value
                newData[key] = value;
            }
        } else {
            // Replacement set. 
            // We should still scan for serverTimestamp sentinels though.
            newData = { ...data };
            for (const key in newData) {
                const value = newData[key];
                if (value && typeof value === 'object' && value.__isServerTimestamp) {
                    newData[key] = {
                        toMillis: () => Date.now(),
                        seconds: Math.floor(Date.now() / 1000)
                    };
                }
            }
        }

        this.data[path] = newData;
    }

    get(path: string) {
        return this.data[path];
    }

    query(collectionPath: string, constraints: any[]) {
        let results = [];
        for (const key in this.data) {
            if (key.startsWith(collectionPath + '/')) {
                // Check if direct child
                const relative = key.substring(collectionPath.length + 1);
                if (relative.includes('/')) continue;

                const docData = this.data[key];
                let match = true;

                for (const c of constraints) {
                    if (c.type === 'where') {
                        const val = docData[c.field];
                        const target = c.value;

                        switch (c.op) {
                            case '==': if (val !== target) match = false; break;
                            case '!=': if (val === target) match = false; break;
                            case '>': if (!(val > target)) match = false; break;
                            case '>=': if (!(val >= target)) match = false; break;
                            case '<': if (!(val < target)) match = false; break;
                            case '<=': if (!(val <= target)) match = false; break;
                            case 'in': if (!target.includes(val)) match = false; break;
                            case 'array-contains':
                                if (!Array.isArray(val) || !val.includes(target)) match = false;
                                break;
                            default:
                                throw new Error(`MockFirestore: Unimplemented query op in runner: ${c.op}`);
                        }
                    }
                }
                if (match) results.push({ id: key.split('/').pop(), ...docData });
            }
        }

        // Handle orderBy
        const orderBy = constraints.find(c => c.type === 'orderBy');
        if (orderBy) {
            results.sort((a, b) => {
                const field = orderBy.field;
                const valA = a[field];
                const valB = b[field];

                // Simple comparisons
                if (valA < valB) return orderBy.dir === 'desc' ? 1 : -1;
                if (valA > valB) return orderBy.dir === 'desc' ? -1 : 1;
                return 0;
            });
        }

        // Handle limit
        const limit = constraints.find(c => c.type === 'limit');
        if (limit) {
            results = results.slice(0, limit.n);
        }

        return results;
    }
}

export const mockFirestore = new MockFirestore();
