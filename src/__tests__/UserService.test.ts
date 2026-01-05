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
});
