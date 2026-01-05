# Missing Features & Redesign Notes

## Overview
This document outlines the discrepancies between the provided UI designs (HTML/Images) and the current React Native implementation of the "InStep" app. While the visual redesign is largely complete, several features are currently mocked or unimplemented.

## Visual Redesign Status
- **Welcome Screen**: Implemented with new branding, "Leaf" logo, and placeholder hero image.
- **Onboarding Goal**: Implemented grid layout for goals, new "Experience Level" cards, and the "Guide Opt-In" toggle.
- **Home Screen**: Implemented "Today's Focus" gradient card and "Your Circle" avatar row.
- **Profile Screen**: Implemented "My Journey" stats, "Daily Reflection" card, and Preferences list.
- **Group Chat**: (Partial) Uses existing structure but aligns with the simplified aesthetics. Does not yet feature the "Daily Reflection" pinned card from designs.

## Missing or Mocked Features

### 1. Daily Reflection (Home & Profile)
- **Status**: UI Only.
- **Description**: The "Daily Reflection" question ("What are you grateful for?") is static.
- **Missing Logic**: Saving the user's input, rotating questions daily, or sharing this with the group.

### 2. User Avatars
- **Status**: Placeholders.
- **Description**: The app currently uses `ui-avatars.com` with random backgrounds or initials.
- **Missing Logic**: Real user profile image upload and storage.

### 3. Profile Stats ("My Journey")
- **Status**: Mocked.
- **Description**: "Goals Shared: 12" and "Cheers Given: 45" are hardcoded.
- **Missing Logic**: Backend aggregation of these metrics.

### 4. "Guide Bot" vs. Human Guide
- **Status**: Hybrid Logic.
- **Description**: The design text mentions "A friendly bot to check in on you". The implementation follows the "Phase 5" logic of **Human/Peer Guides**.
- **Resolution**: The UI toggle "Add a supportive Guide?" currently triggers the "Become a Guide" logic for Experienced users, or does nothing (default assignment) for Beginners. The "Bot" aspect is ignored.

### 5. Preferences Screen
- **Status**: Non-functional.
- **Description**: The Preferences list items (Notifications, Privacy, Edit Profile) are visual only.
- **Missing Logic**: Navigation to actual settings screens.

### 6. Home Screen "Your Circle" Updates
- **Status**: Mocked.
- **Description**: "Sarah just shared a win" is hardcoded.
- **Missing Logic**: Fetching the latest group activity highlight to display here.

## Next Steps
1. Connect "Daily Reflection" input to `GoalService` or `ChatService`.
2. Implement backend for User Stats.
3. Build out the Settings/Preferences screens.
