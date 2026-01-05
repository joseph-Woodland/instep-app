import { GroupService } from '../../services/GroupService';
import { mockFirestore } from '../../test/utils/mockFirestore';
import { makeUser } from '../../test/fixtures/factories';

describe('Scenario: Invite & Join', () => {
    beforeEach(() => {
        mockFirestore.reset();
    });

    it('user creates an invite and another user redeems it', async () => {
        const host = makeUser({ id: 'host1' });
        const guest = makeUser({ id: 'guest1' });
        const groupId = 'group-1';
        const goalId = 'goal-1';

        // Pre-seed group
        mockFirestore.set(`groups/${groupId}`, {
            id: groupId,
            name: 'Invite Group',
            memberCount: 1,
            maxMembers: 10,
            isActive: true
        });

        // 1. Create Invite
        const invite = await GroupService.createGroupInvite(host.id, groupId, goalId, 'member');
        expect(invite.inviteCode).toBeDefined();

        // 2. Guest validates code
        const validation = await GroupService.validateGroupInvite(invite.inviteCode);
        expect(validation.valid).toBe(true);
        expect(validation.groupName).toBe('Invite Group');

        // 3. Guest redeems code
        const result = await GroupService.redeemGroupInvite(guest.id, invite.inviteCode);
        expect(result.success).toBe(true);
        expect(result.status).toBe('joined');
        expect(result.groupId).toBe(groupId);

        // 4. Verify Membership
        const memberships = mockFirestore.query('userGroups', [
            { type: 'where', field: 'userId', value: guest.id },
            { type: 'where', field: 'groupId', value: groupId }
        ]);
        expect(memberships).toHaveLength(1);

        // 5. Verify Counters
        const group = mockFirestore.get(`groups/${groupId}`);
        expect(group.memberCount).toBe(2); // 1 host + 1 guest (naive increment implementation in mock)

        const updatedInviteKey = Object.keys(mockFirestore.data).find(k => k.startsWith('groupInvites/') && mockFirestore.data[k].inviteCode === invite.inviteCode);
        const updatedInvite = mockFirestore.get(updatedInviteKey!);
        expect(updatedInvite.usesCount).toBe(1);
    });
});
