import { ChatService } from '../../services/ChatService';
import { mockFirestore } from '../../test/utils/mockFirestore';
import { makeUser } from '../../test/fixtures/factories';

describe('Scenario: Group Chat Flow', () => {
    beforeEach(() => {
        mockFirestore.reset();
    });

    it('posts a message and sees it in the feed', async () => {
        const groupId = 'g1';
        const user = makeUser({ id: 'u1', name: 'Alice' });

        // 1. Send Message
        await ChatService.sendMessage(groupId, user.id, user.name, 'Hello Group!');

        // 2. Verify it's in the DB
        // We need to find the ID. Since we can't easily query subcollections in our simple mock 
        // without knowing the exact path or iterating widely, let's peek at the internal store
        // Our mock stores keys as "groups/g1/messages/msgId"

        const allKeys = Object.keys(mockFirestore.data);
        const msgKey = allKeys.find(k => k.startsWith(`groups/${groupId}/messages/`));

        expect(msgKey).toBeDefined();
        const msg = mockFirestore.get(msgKey!);
        expect(msg.text).toBe('Hello Group!');
        expect(msg.userId).toBe('u1');
    });

    it('can receive messages via subscription (simulated)', (done) => {
        const groupId = 'g1';

        // Seed a message
        const msgId = 'msg1';
        mockFirestore.set(`groups/${groupId}/messages/${msgId}`, {
            id: msgId,
            text: 'First Post',
            createdAt: Date.now()
        });

        // Test Subscription
        // Our mock onSnapshot calls back immediately with current state
        ChatService.subscribeToGroupMessages(groupId, (messages) => {
            try {
                expect(messages.length).toBeGreaterThan(0);
                expect(messages[0].text).toBe('First Post');
                done(); // Success
            } catch (e) {
                done(e);
            }
        });
    });
});
