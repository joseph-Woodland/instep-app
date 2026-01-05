# InStep App: Final Phase Testing Checklist

This checklist is designed for manual testing of the InStep app across Web and Mobile (Expo Go) platforms.

## 🏁 Phase 1: Onboarding & Goal Selection
- [ ] **Welcome Screen scrolling**: On mobile web, verify you can scroll down to see "Get Started" and "Log in".
- [ ] **Goal Grid**: Verify all predefined goals (5K Run, Basic Coding, Save Money) are visible.
- [ ] **Scrolling Continue**: Verify the "Continue" button sits at the bottom of the list and is NOT stuck to the screen bottom.
- [ ] **Experience Level**: Toggle between "Just Starting" and "I have a routine" — check if the Guide text changes.
- [ ] **Request a Goal**: Open the modal, enter a custom goal, and verify the "Received!" alert appears.

## 🏠 Phase 2: Home Screen (The Daily Hub)
- [ ] **Greeting**: Does it say "Good Morning, [Your Name]"?
- [ ] **Daily Gratitude**:
    - [ ] Enter a gratitude note and click the checkmark.
    - [ ] Verify the card turns green and shows your quoted answer.
    - [ ] Click "Edit answer" and verify you can change it.
- [ ] **Daily Goal Card**: Verify the progress percentage matches your goal state.
- [ ] **Circle Preview**: Check if the avatar row shows and the "View All" link takes you to the Chat tab.
- [ ] **Reminder Shortcut**: Click "Manage Reminders" and verify it navigates to the Profile tab.

## 💬 Phase 3: Group Chat & Progress
- [ ] **Check-In Functionality**:
    - [ ] Click "+ Daily Check-in".
    - [ ] Verify the milestone list matches your specific goal (e.g., "Run 1km" for a 5K goal).
    - [ ] Attempt to save an empty note (Save button should be disabled).
    - [ ] Save a real note and verify a system message appears in the chat: *"You checked in: ..."*
- [ ] **Messaging**: Send a message and verify it appears in the list.
- [ ] **Guide Tips**: If you are a Guide, click "Share a tip" and verify the yellow "💡 Tip" bubble appears.
- [ ] **Milestone Celebration**: Complete a milestone in the check-in and verify the "🎉 You reached milestone" system message appears.

## 🔗 Phase 4: Social & Invites
- [ ] **Invite Link Generation**:
    - [ ] Open the "Invite a friend" modal from Home or Chat.
    - [ ] Click "Create Invite Link".
    - [ ] Verify the link looks like `instep-app.com/invite/CODE`.
    - [ ] Click "Share Invite" (Native only) or "Copy" and verify the clipboard content.
- [ ] **Redeeming codes**: Navigate to "Log in" -> "Have an invite code?" and enter a valid code (if you have one generated).

## 👤 Phase 5: Profile & Preferences
- [ ] **Edit Profile**: Click "Edit Profile", change your name, and verify it updates in the Header and Home greeting instantly.
- [ ] **Daily Reminders**:
    - [ ] Toggle reminders ON/OFF.
    - [ ] Change the time in the modal and verify the label reflects the new time.
- [ ] **Experience Badge**: Verify the "Seedling" or "Guide" badges appear correctly.

## 📱 Phase 6: Sync & Persistence
- [ ] **Cross-Screen Sync**: Update your name in Profile, then go back to Home. Does it still say the new name?
- [ ] **Web vs Mobile**: Perform a check-in on the web version, then open the app on your phone. Is the chat message there?
