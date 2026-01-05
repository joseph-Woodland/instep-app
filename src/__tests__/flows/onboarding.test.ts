import { GroupService } from '../../services/GroupService';
import { mockFirestore } from '../../test/utils/mockFirestore';
import { makeUser, makeGoal } from '../../test/fixtures/factories';

describe('Scenario: New User Onboarding', () => {
    beforeEach(() => {
        mockFirestore.reset();
    });

    it('assigns a user to a new group if none exist', async () => {
        const user = makeUser({ id: 'u1' });
        const goalId = 'run-5k';

        // Setup: Goal Definition exists in "mock DB" via GoalService usually reading from file/DB
        // But GroupService reads from 'groups' collection.
        // Initially empty.

        const groupId = await GroupService.assignUserToGroup(user.id, goalId);

        expect(groupId).toBeDefined();

        // Verification: Group should be created in DB
        const group = mockFirestore.get(`groups/${groupId}`);
        expect(group).toBeDefined();
        expect(group.name).toContain('Group');
        expect(group.memberCount).toBe(1);

        // Verification: Membership created
        // We need to scan userGroups for this user
        const memberships = mockFirestore.query('userGroups', [
            { type: 'where', field: 'userId', value: user.id }
        ]);
        expect(memberships).toHaveLength(1);
        expect(memberships[0].groupId).toBe(groupId);
        expect(memberships[0].role).toBe('member');
    });

    it('assigns user to existing group if available', async () => {
        const goalId = 'run-5k';
        // Pre-seed a group
        const existingGroup = {
            id: 'g1',
            goalId,
            name: 'Existing Group',
            maxMembers: 10,
            memberCount: 5,
            isActive: true,
            createdAt: Date.now()
        };
        mockFirestore.set('groups/g1', existingGroup);

        const user = makeUser({ id: 'u2' });
        const groupId = await GroupService.assignUserToGroup(user.id, goalId);

        expect(groupId).toBe('g1');

        // Check if DB was validly accessed
        const memberships = mockFirestore.query('userGroups', [
            { type: 'where', field: 'userId', value: user.id }
        ]);
        expect(memberships).toHaveLength(1);
        expect(memberships[0].groupId).toBe('g1');
    });
});
