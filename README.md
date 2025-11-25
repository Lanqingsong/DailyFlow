
# MindFlow / DailyFlow Tracker

MindFlow is a personal growth application designed to track habits, plans, and daily activities. It features a bilingual interface (English/Chinese), mood tracking, visual analytics, and privacy protection.

## Features

- **Activity Tracking**: Log daily activities under Exercise, Health, Learning, and Work.
- **Planning**: Create one-time or recurring plans.
- **Visual Calendar**: View history, mood trends, and missed plans (highlighted in red).
- **Statistics**: Interactive charts for weekly activity and focus analysis.
- **Rich Media**: Support for adding photos and audio recordings to entries.
- **Privacy First**: Local storage only with optional PIN code protection.
- **Internationalization**: Switch between English and Chinese (Simplified).

## Tech Stack

- **Framework**: React 18 / 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Mobile Runtime**: Capacitor (Android & iOS)
- **Charts**: Recharts
- **Icons**: Lucide React

## 🚀 Complete Build & Compile Guide

### Q: Do I strictly need Android Studio?
**Short Answer:** You need the **Android SDK** and **Gradle**, which come with Android Studio.
**Detailed Answer:** You do **not** need to open the Android Studio graphical interface to build the app. You can use the command line (CLI) to build the APK as long as the Android SDK is installed and the `ANDROID_HOME` environment variable is set. However, installing Android Studio is the easiest way to get all these prerequisites set up correctly.

---

### Phase 1: Web Assets Build (Required for all platforms)


方法一：使用 Capacitor（推荐）
1. 安装 Capacitor
cmd
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init MindFlowDiary com.yourname.mindflowdiary
2. 构建项目
cmd
npm run build
3. 添加 Android 平台
cmd
npx cap add android
npx cap copy android
npx cap sync android
4. 打开 Android Studio 并构建 APK
cmd
npx cap open android
在 Android Studio 中：

等待 Gradle 同步完成

点击 Build > Generate Signed Bundle / APK

选择 APK

创建或使用现有的密钥库

完成构建




Before building for Android or iOS, you must compile your React code into static HTML/JS/CSS.

```bash
# 1. Install dependencies (if you haven't)
npm install

# 2. Build the web project (Outputs to /dist or /build)
npm run build

# 3. Sync the web assets to the native platforms
npx cap sync
```

---

### Phase 2: Android Build

#### Option A: The "Click Button" Way (Using Android Studio GUI)
Best for beginners or if you need to configure app icons and splash screens visually.

1.  Run `npx cap open android`.
2.  Wait for Android Studio to load.
3.  Click the **Build** menu -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
4.  Once done, click "locate" in the notification popup to find your `.apk` file.

#### Option B: The "Hacker" Way (Command Line Only) ⚡️
Best for CI/CD or if you find Android Studio too heavy.

1.  Ensure you have completed **Phase 1**.
2.  Navigate to the android directory:
    ```bash
    cd android
    ```
3.  Run the Gradle wrapper script to build the Debug APK:
    *   **Mac/Linux**:
        ```bash
        ./gradlew assembleDebug
        ```
    *   **Windows (PowerShell/CMD)**:
        ```cmd
        gradlew assembleDebug
        ```
4.  **Find your APK**:
    The built file will be located at:
    `android/app/build/outputs/apk/debug/app-debug.apk`

*Note: To build a release version for the Play Store, use `./gradlew bundleRelease` (requires signing configuration).*

---

### Phase 3: iOS Build (Mac Only)

iOS development **strictly requires Xcode**. There is no reliable way to build iOS apps on Windows or Linux without using a cloud build service (like Ionic Appflow or GitHub Actions).

1.  **Sync**: `npx cap sync ios`
2.  **Open**: `npx cap open ios`
3.  **Build**:
    *   Select your connected iPhone or a Simulator from the top bar.
    *   Press **Cmd + R** to run/install.
    *   Or go to **Product** -> **Archive** to generate a build for the App Store.

---

## 🛠 Troubleshooting & Permissions

### Permissions Setup
The app requires access to Camera and Microphone.
*   **Android**: Handled automatically by Capacitor in `AndroidManifest.xml`.
*   **iOS**: You **must** add usage descriptions in `Info.plist` (inside Xcode):
    *   Key: `Privacy - Camera Usage Description` | Value: "Required for photo logs"
    *   Key: `Privacy - Microphone Usage Description` | Value: "Required for audio logs"

### Common Build Issues
1.  **"SDK location not found"**:
    *   Create a file named `local.properties` inside the `android/` folder.
    *   Add: `sdk.dir=/Users/YOUR_USER/Library/Android/sdk` (macOS) or `sdk.dir=C:\\Users\\YOUR_USER\\AppData\\Local\\Android\\Sdk` (Windows).
2.  **"Gradle version mismatch"**:
    *   Capacitor handles this mostly, but if prompted, allow Android Studio to upgrade the Gradle plugin.

## AI Generation Process

This project was built iteratively using AI prompts. Below is a summary of the key prompts used:

1.  **Initial Setup**: "I need a plan and clock-in mobile app with calendar, categories (Exercise, Health, etc.), sub-categories, statistics, media support, and mood tracking."
2.  **iOS Adaptation**: "Ensure the input box isn't covered by the keyboard on iOS and fix camera permission issues."
3.  **Build Process**: "Provide a CLI-based build approach for Android to avoid opening the heavy IDE."

## License

MIT License.
Copyright (c) 2024 Lan.
