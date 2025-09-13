# TODO App React

A modern, cross-platform TODO application built with React Native and Expo. This app helps users manage their daily tasks efficiently across Android, iOS, and web platforms.

## 📱 Features

- ✅ Add new tasks
- ✏️ Edit existing tasks
- 🗑️ Delete completed tasks
- 📋 Mark tasks as complete/incomplete
- 💾 Persistent storage
- 🎨 Clean and intuitive user interface
- 📱 Cross-platform compatibility (iOS, Android, Web)

## 🛠️ Tech Stack

- **Framework:** React Native with Expo
- **Language:** JavaScript/TypeScript
- **Navigation:** Expo Router (file-based routing)
- **Development Platform:** Expo SDK
- **Storage:** AsyncStorage (for data persistence)

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/) (optional but recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ashish-khandelwal01/TODO-App-React.git
   cd TODO-App-React
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run the app**

   After starting the development server, you'll see a QR code and several options:

    - **On iOS:** Scan the QR code with your iPhone camera or use the Expo Go app
    - **On Android:** Scan the QR code with the Expo Go app
    - **On Web:** Press `w` in the terminal to open in your browser
    - **iOS Simulator:** Press `i` (requires Xcode on macOS)
    - **Android Emulator:** Press `a` (requires Android Studio)

## 📁 Project Structure

```
TODO-App-React/
├── app/                    # Main application directory
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── _layout.tsx        # Root layout component
│   └── index.tsx          # Entry point
├── components/            # Reusable components
├── constants/            # App constants
├── hooks/               # Custom React hooks
├── assets/              # Static assets (images, icons)
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
└── README.md          # Project documentation
```

## 🎯 Usage

1. **Adding a Task**
    - Tap the "+" button or input field
    - Enter your task description
    - Press "Add" or hit Enter

2. **Completing a Task**
    - Tap the checkbox next to any task
    - Completed tasks will be marked with a checkmark

3. **Editing a Task**
    - Tap on the task text to edit
    - Make your changes and confirm

4. **Deleting a Task**
    - Swipe left on a task or tap the delete button
    - Confirm deletion when prompted

## 🔧 Development

### Reset Project

If you want to start with a clean slate:

```bash
npm run reset-project
```

This command will move the starter code to the `app-example` directory and create a blank `app` directory for fresh development.

### Building for Production

For iOS:
```bash
expo build:ios
```

For Android:
```bash
expo build:android
```

For Web:
```bash
expo build:web
```

## 📦 Dependencies

Key dependencies include:

- `expo` - The Expo platform
- `react` - React library
- `react-native` - React Native framework
- `expo-router` - File-based routing
- `@expo/vector-icons` - Icon library
- Additional Expo modules for device features

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 👨‍💻 Author

**Ashish Khandelwal**
- GitHub: [@ashish-khandelwal01](https://github.com/ashish-khandelwal01)

## 📚 Learn More

To learn more about the technologies used in this project:

- [Expo Documentation](https://docs.expo.dev/) - Learn about Expo features and API
- [React Native Documentation](https://reactnative.dev/) - Learn React Native
- [Expo Router](https://docs.expo.dev/router/introduction/) - File-based routing for Expo
- [React Documentation](https://react.dev/) - Learn React

## 🐛 Issues

If you encounter any issues or have questions, please [create an issue](https://github.com/ashish-khandelwal01/TODO-App-React/issues) on GitHub.

## ⭐ Support

If you found this project helpful, please give it a ⭐ on GitHub!
