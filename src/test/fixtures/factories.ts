export const makeUser = (overrides = {}) => ({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    name: 'Test User',
    email: 'test@example.com',
    createdAt: Date.now(),
    ...overrides
});

export const makeGoal = (id = 'goal-1', overrides = {}) => ({
    id,
    title: 'Test Goal',
    description: 'A test goal',
    milestones: [
        { id: 'm1', title: 'Milestone 1', percentage: 10 },
        { id: 'm2', title: 'Milestone 2', percentage: 20 }
    ],
    ...overrides
});

export const makeGroup = (overrides = {}) => ({
    id: 'group-' + Math.random().toString(36).substr(2, 9),
    name: 'Test Group',
    memberCount: 1,
    maxMembers: 10,
    isActive: true,
    ...overrides
});

export const makeMessage = (overrides = {}) => ({
    id: 'msg-' + Math.random().toString(36).substr(2, 9),
    text: 'Hello World',
    userId: 'user-1',
    userName: 'Test User',
    createdAt: Date.now(),
    type: 'user',
    ...overrides
});
