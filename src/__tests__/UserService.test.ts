import { UserService } from '../services/UserService';
import { getDoc, setDoc, doc } from 'firebase/firestore';

describe('UserService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateUserProfile', () => {
        it('should update user profile with merge true', async () => {
            await UserService.updateUserProfile('user1', { name: 'New Name' });

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(), // docRef
                expect.objectContaining({
                    name: 'New Name',
                }),
                { merge: true }
            );
        });
    });

    describe('getUser', () => {
        it('should return user data if exists', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({ name: 'Test User' })
            });

            const result = await UserService.getUser('user1');
            expect(result).toEqual({ name: 'Test User' });
        });

        it('should return null if user does not exist', async () => {
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => false
            });

            const result = await UserService.getUser('user1');
            expect(result).toBeNull();
        });
    });

    describe('updatePushToken', () => {
        it('should add token using arrayUnion', async () => {
            await UserService.updatePushToken('user1', 'token123');

            expect(setDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    pushTokens: { __isArrayUnion: true, items: ['token123'] }
                }),
                { merge: true }
            );
        });

        it('should handle errors gracefully', async () => {
            (setDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore error'));
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            await expect(UserService.updatePushToken('user1', 'token1')).resolves.not.toThrow();

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('getUsers', () => {
        it('should return map of users', async () => {
            // We need to mock getDoc to return different values based on calls
            // getUsers calls getDoc in parallel.
            (getDoc as jest.Mock)
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: 'u1',
                    data: () => ({ name: 'User 1' })
                })
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: 'u2',
                    data: () => ({ name: 'User 2' })
                });

            const result = await UserService.getUsers(['u1', 'u2']);
            expect(result).toEqual({
                'u1': { name: 'User 1' },
                'u2': { name: 'User 2' }
            });
        });

        it('should handle empty array', async () => {
            const result = await UserService.getUsers([]);
            expect(result).toEqual({});
        });

        it('should handle partial failures or missing docs', async () => {
            (getDoc as jest.Mock)
                .mockResolvedValueOnce({
                    exists: () => true,
                    id: 'u1',
                    data: () => ({ name: 'User 1' })
                })
                .mockResolvedValueOnce({
                    exists: () => false,
                    id: 'u2'
                });

            const result = await UserService.getUsers(['u1', 'u2']);
            expect(result).toEqual({
                'u1': { name: 'User 1' }
            });
        });
    });

    // Add error test for updateUserProfile
    describe('updateUserProfile errors', () => {
        it('should throw on error', async () => {
            (setDoc as jest.Mock).mockRejectedValueOnce(new Error('Update failed'));
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

            await expect(UserService.updateUserProfile('u1', {})).rejects.toThrow('Update failed');

            consoleSpy.mockRestore();
        });
    });
});
