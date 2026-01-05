# InStep App (Together)

A goal-oriented social platform designed to help users achieve milestones together through group accountability and guided journeys. This app is built with **React Native (Expo)** and **Firebase**.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Expo CLI

### Installation
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd instep-app
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the App
- **Start the dev server**:
  ```bash
  npm start
  ```
- **Run on Android/iOS**: Scan the QR code with Expo Go or run on emulator (`A` for Android, `I` for iOS).
- **Run tests**:
  ```bash
  npm test
  ```

## 📂 Project Documentation

We keep our documentation organized in the `/docs` directory.

- **[Testing Strategy](./docs/testing/TESTING.md)**: How to run unit, integration, and flow tests.
- **[Design Artifacts](./docs/design/google-stitch/)**: HTML exports from Google Stitch and design references.
- **[Product Notes](./docs/product/MISSING_FEATURES.md)**: Roadmap, missing features, and product requirements.
- **[Architecture](./docs/architecture/)**: High-level design decisions.

## 🛠 Scripts

- `/scripts/manualSeed.js`: Utility to seed local data.
- `/scripts/testFirebase.js`: Script to verify Firebase connectivity.

## 🤝 Contributing

1. Create a feature branch.
2. Ensure tests pass (`npm test`).
3. Submit a Pull Request.
