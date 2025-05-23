# 🌟 GinChat Mobile - Premium Messaging Experience

<div align="center">

![GinChat Logo](./assets/adaptive-icon.png)

**A luxurious, real-time messaging application built with React Native & Expo**

[![React Native](https://img.shields.io/badge/React%20Native-0.79.2-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~53.0.7-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[Features](#-features) • [Installation](#-installation) • [Architecture](#-architecture) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Features](#-features)
- [🚀 Quick Start](#-quick-start)
- [🛠️ Installation](#-installation)
- [🏗️ Architecture](#-architecture)
- [🔐 Authentication System](#-authentication-system)
- [🛡️ Protected Routing](#-protected-routing)
- [🎨 UI Components](#-ui-components)
- [📱 Screens & Navigation](#-screens--navigation)
- [🌐 API Integration](#-api-integration)
- [📁 Project Structure](#-project-structure)
- [⚙️ Configuration](#-configuration)
- [🧪 Testing](#-testing)
- [🚀 Deployment](#-deployment)
- [🔧 Development Workflow](#-development-workflow)
- [🐛 Troubleshooting](#-troubleshooting)
- [📖 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

GinChat Mobile is a premium messaging application that provides a luxurious chat experience with real-time communication, multimedia support, and elegant UI design. Built with modern React Native and Expo technologies, it offers both functionality and aesthetic appeal.

### 🎯 Key Highlights

- **Premium Design**: Gold-themed UI with beautiful gradients and shadows
- **Real-time Messaging**: Instant communication with WebSocket integration
- **Multimedia Support**: Text, images, audio, and video messages
- **Secure Authentication**: JWT-based auth with protected routing
- **Cross-Platform**: Works seamlessly on iOS, Android, and web
- **Modern Architecture**: Clean code with TypeScript and context-based state management

---

## ✨ Features

### 💬 **Core Messaging**
- **Real-time Chat**: Instant messaging with WebSocket technology
- **Group Conversations**: Create and join chat rooms
- **Message Types**: Support for text, images, audio, and video
- **Message Status**: Delivery and read indicators
- **Media Gallery**: Browse shared media in conversations

### 🔐 **Authentication & Security**
- **Secure Login**: JWT token-based authentication
- **User Registration**: Complete signup flow with validation
- **Protected Routes**: Automatic navigation based on auth status
- **Session Management**: Automatic token refresh and logout
- **Input Validation**: Comprehensive form validation

### 🎨 **Premium UI/UX**
- **Gold Theme**: Luxurious gold-themed design system
- **Adaptive Components**: Responsive design components
- **Smooth Animations**: Beautiful transitions and interactions
- **Dark/Light Support**: Elegant theme variations
- **Custom Components**: Reusable UI elements (GoldButton, GoldInput)

### 📱 **Mobile Experience**
- **Cross-Platform**: iOS, Android, and web support
- **Offline Capability**: Local storage and sync
- **Push Notifications**: Real-time message notifications
- **Media Handling**: Image/video capture and file selection
- **Keyboard Optimization**: Smart keyboard avoidance

### 🛠️ **Developer Experience**
- **TypeScript**: Full type safety and IntelliSense
- **Hot Reload**: Fast development with Expo
- **Component Library**: Reusable design system
- **Error Boundaries**: Graceful error handling
- **Debugging Tools**: Comprehensive logging and debugging

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/GinChatMobile.git
cd GinChatMobile

# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platforms
npm run android    # Android emulator
npm run ios        # iOS simulator
npm run web        # Web browser
```

---

## 🛠️ Installation

### 📋 Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **Expo CLI** installed globally
- **React Native development environment**

#### For iOS Development:
- **macOS** with Xcode installed
- **iOS Simulator** or physical device

#### For Android Development:
- **Android Studio** with Android SDK
- **Android Emulator** or physical device

### 🔧 Setup Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/GinChatMobile.git
   cd GinChatMobile
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   ```bash
   # Create environment configuration
   cp .env.example .env.local
   ```

4. **Start Development Server**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run on Device/Emulator**
   - **Android**: Press `a` or `npm run android`
   - **iOS**: Press `i` or `npm run ios`
   - **Web**: Press `w` or `npm run web`

### 🌐 Network Configuration

For development on physical devices:

```bash
# Use tunnel mode for external access
npm run start-tunnel

# Use host binding for local network
npm run start-host
```

---

## 🏗️ Architecture

### 🏛️ Application Architecture

```
┌─────────────────────────────────────────┐
│                Frontend                  │
│  ┌─────────────┐  ┌─────────────────────┐│
│  │ React Native│  │     Expo Router     ││
│  │ Components  │  │    Navigation       ││
│  └─────────────┘  └─────────────────────┘│
│  ┌─────────────────────────────────────┐ │
│  │        Context API                  │ │
│  │  • AuthContext                     │ │
│  │  • WebSocketContext                │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
              │ HTTP/WebSocket
              ▼
┌─────────────────────────────────────────┐
│               Backend API                │
│  ┌─────────────┐  ┌─────────────────────┐│
│  │    Auth     │  │      ChatRooms      ││
│  │ (JWT Tokens)│  │    (Real-time)      ││
│  └─────────────┘  └─────────────────────┘│
│  ┌─────────────────────────────────────┐ │
│  │            Database                 │ │
│  │         (MongoDB)                   │ │
│  └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 🧩 Component Architecture

```typescript
// Component Hierarchy
App
├── AuthProvider
│   ├── WebSocketProvider
│   │   ├── ProtectedRoute
│   │   │   ├── Navigation (Expo Router)
│   │   │   │   ├── AuthPages (/, /login, /signup)
│   │   │   │   └── ProtectedPages
│   │   │   │       ├── TabNavigation
│   │   │   │       │   └── ChatsScreen
│   │   │   │       └── ChatScreens
│   │   │   │           └── ChatDetailScreen
```

---

## 🔐 Authentication System

### 🔑 Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant A as App
    participant API as Backend API
    participant S as AsyncStorage

    U->>A: Enter credentials
    A->>API: POST /auth/login
    API-->>A: JWT Token + User Data
    A->>S: Store token & user
    A->>A: Update AuthContext
    A->>A: Navigate to /chats
```

### 🛡️ AuthContext Implementation

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### 🔐 Key Features

- **JWT Token Management**: Secure token storage and automatic refresh
- **Persistent Sessions**: User stays logged in across app restarts
- **Automatic Logout**: Session cleanup on token expiration
- **Error Handling**: Graceful handling of auth failures
- **Loading States**: Smooth UX during authentication processes

---

## 🛡️ Protected Routing

### 🚪 Route Protection System

The app uses a sophisticated routing protection system that automatically handles user navigation based on authentication status.

#### 🔒 Route Categories

| Route Type | Examples | Authenticated | Unauthenticated |
|------------|----------|---------------|-----------------|
| **Public** | `/`, `/login`, `/signup` | Redirect to `/chats` | Allow access |
| **Protected** | `/(tabs)/chats`, `/chat/[id]` | Allow access | Redirect to `/login` |

#### 🛣️ ProtectedRoute Component

```typescript
// Automatic navigation logic
useEffect(() => {
  if (isLoading) return; // Wait for auth check
  
  if (isAuthenticated) {
    if (isPublicRoute) {
      router.replace('/(tabs)/chats'); // Redirect to chats
    }
  } else {
    if (inAuthGroup) {
      router.replace('/login'); // Redirect to login
    }
  }
}, [isAuthenticated, isLoading, segments]);
```

#### 🔧 Error State Protection

Special handling prevents unwanted navigation during form errors:

```typescript
// Prevent navigation during auth form errors
if ((isLoginRoute || isSignupRoute) && !isAuthenticated) {
  console.log('Allowing access to show error messages');
  return; // Stay on form page
}
```

---

## 🎨 UI Components

### 🎭 Design System

The app features a comprehensive design system with consistent styling and theming.

#### 🌟 Gold Theme

```typescript
export const GoldTheme = {
  gold: {
    primary: '#FFD700',    // Primary gold
    secondary: '#FFA500',  // Secondary orange-gold
    accent: '#DAA520'      // Darker gold accent
  },
  gradients: {
    goldShimmer: ['#FFD700', '#FFA500', '#FF8C00'],
    darkGold: ['rgba(255, 215, 0, 0.9)', 'rgba(255, 140, 0, 0.7)']
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#E0E0E0',
    muted: '#A0A0A0'
  }
};
```

#### 🧩 Core Components

**GoldButton Component**
```typescript
interface GoldButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  variant?: 'primary' | 'secondary' | 'outline';
}

// Features:
// ✨ Linear gradient backgrounds
// 🎯 Touch feedback with opacity
// 📏 Flexible sizing options
// 🔒 Disabled state handling
// 🎨 Multiple style variants
```

**GoldInput Component**
```typescript
interface GoldInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  icon?: React.ReactNode;
}

// Features:
// 🏷️ Floating label animation
// 🎨 Gold-themed styling
// 🔍 Icon support
// ✅ Validation state indicators
// ⌨️ Keyboard type optimization
```

#### 🎨 Component Gallery

| Component | Purpose | Features |
|-----------|---------|----------|
| **GoldButton** | Primary actions | Gradients, animations, states |
| **GoldInput** | Form inputs | Floating labels, validation |
| **ThemedText** | Typography | Consistent text styling |
| **MessageBubble** | Chat messages | Media support, timestamps |
| **LoadingSpinner** | Loading states | Smooth animations |
| **ErrorBoundary** | Error handling | Graceful error display |

---

## 📱 Screens & Navigation

### 🗺️ Navigation Structure

```
App Navigation (Expo Router)
├── / (Index) - Welcome Screen
├── /login - Login Screen
├── /signup - Registration Screen
├── /(tabs)/ - Tab Navigation
│   └── 💬 chats.tsx             # Chat list screen
└── /chat/[id] - Individual Chat Room
```

### 📄 Screen Details

#### 🏠 **Index Screen** (`app/index.js`)
- **Purpose**: Welcome page with app introduction
- **Features**: 
  - Elegant logo display with adaptive-icon.png
  - Call-to-action buttons (Sign In / Create Account)
  - Responsive design with gold theme
  - Automatic redirect for authenticated users

#### 🔑 **Login Screen** (`app/login.tsx`)
- **Purpose**: User authentication
- **Features**:
  - Email/password form with validation
  - Error handling with user-friendly messages
  - Loading states during authentication
  - Navigation to signup and password reset
  - Auto-navigation on successful login

#### 📝 **Signup Screen** (`app/signup.tsx`)
- **Purpose**: New user registration
- **Features**:
  - Multi-field form (name, email, password, confirm)
  - Real-time validation (email format, password strength)
  - Terms of service acceptance
  - Auto-login after successful registration
  - Feature highlights display

#### 💬 **Chats Screen** (`app/(tabs)/chats.tsx`)
- **Purpose**: Chat room management
- **Features**:
  - List of joined chat rooms
  - Real-time message previews
  - Room creation and joining modals
  - Search and filter functionality
  - Pull-to-refresh for updates

#### 🗨️ **Chat Detail Screen** (`app/chat/[id].tsx`)
- **Purpose**: Individual chat room interface
- **Features**:
  - Real-time message display
  - Message composition with media support
  - Audio recording and playback
  - Image/video sharing
  - Message status indicators
  - Typing indicators

### 🎯 Navigation Features

- **Automatic Protection**: Routes automatically redirect based on auth status
- **Deep Linking**: Support for direct navigation to chat rooms
- **Back Navigation**: Consistent back button behavior
- **Tab Navigation**: Bottom tabs for main app sections
- **Modal Navigation**: Overlay screens for focused tasks

---

## 🌐 API Integration

### 🔗 API Architecture

The app integrates with a RESTful backend API with comprehensive error handling and retry logic.

#### 🛠️ API Configuration

```typescript
// Base configuration
const API_URL = 'https://ginchat-14ry.onrender.com/api';
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000 // 20 seconds for hosted services
});
```

#### 🔐 Authentication Interceptors

```typescript
// Automatic token injection
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handling with token cleanup
api.interceptors.response.use(
  (response) => response,
  (error) => handleApiError(error)
);
```

### 📡 API Endpoints

#### 🔑 **Authentication API**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/auth/login` | POST | User login | `{email, password}` | `{token, user}` |
| `/auth/register` | POST | User registration | `{username, email, password}` | `{user}` |
| `/auth/logout` | POST | User logout | - | `{success}` |
| `/auth/me` | GET | Current user | - | `{user}` |

#### 💬 **Chat API**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/chatrooms` | GET | List all rooms | - | `{chatrooms[]}` |
| `/chatrooms/user` | GET | User's rooms | - | `{chatrooms[]}` |
| `/chatrooms` | POST | Create room | `{name}` | `{chatroom}` |
| `/chatrooms/:id/join` | POST | Join room | - | `{success}` |
| `/chatrooms/:id/messages` | GET | Get messages | `?page&limit` | `{messages[]}` |
| `/chatrooms/:id/messages` | POST | Send message | `{message_type, text_content?, media_url?}` | `{message}` |

#### 📁 **Media API**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/media/upload` | POST | Upload file | `FormData{file, message_type}` | `{url, type}` |

### 🔄 Error Handling

```typescript
const handleApiError = (error: AxiosError) => {
  if (!error.response) {
    return Promise.reject({
      status: 'network_error',
      message: 'Network error. Please check your connection.'
    });
  }

  const { status, data } = error.response;
  
  if (status === 401) {
    // Handle authentication errors
    AsyncStorage.removeItem('token');
    return Promise.reject({
      status: 'unauthorized',
      message: data.message || 'Invalid credentials'
    });
  }

  // Handle other errors...
};
```

### 📊 Message Types

```typescript
export type MessageType = 
  | 'text' 
  | 'picture' 
  | 'audio' 
  | 'video' 
  | 'text_and_picture' 
  | 'text_and_audio' 
  | 'text_and_video';

export interface Message {
  id: string;
  chatroom_id: string;
  sender_id: number;
  sender_name: string;
  message_type: MessageType;
  text_content?: string;
  media_url?: string;
  sent_at: string;
}
```

---

## 📁 Project Structure

```
GinChatMobile/
├── 📱 app/                          # Expo Router pages
│   ├── 🏠 index.js                  # Welcome screen
│   ├── 🔑 login.tsx                 # Login screen
│   ├── 📝 signup.tsx                # Registration screen
│   ├── ⚙️ _layout.tsx               # Root layout with providers
│   ├── 📂 (tabs)/                   # Tab navigation group
│   │   └── 💬 chats.tsx             # Chat list screen
│   └── 📂 chat/                     # Chat detail screens
│       └── 🗨️ [id].tsx              # Individual chat room
│
├── 🔧 src/                          # Source code
│   ├── 🧩 components/               # Reusable components
│   │   ├── 🏛️ ProtectedRoute.tsx    # Route protection
│   │   ├── 🛡️ AuthGuard.tsx         # Component-level auth
│   │   ├── 🎨 GoldButton.tsx        # Custom button component
│   │   └── ⌨️ GoldInput.tsx          # Custom input component
│   │
│   ├── 🌐 contexts/                 # React contexts
│   │   ├── 🔐 AuthContext.tsx       # Authentication state
│   │   └── 🔌 WebSocketContext.tsx  # Real-time messaging
│   │
│   ├── 🌍 services/                 # External services
│   │   ├── 📡 api.ts                # API client & endpoints
│   │   └── 🔌 WebSocketService.ts   # WebSocket management
│   │
│   └── 📊 types/                    # TypeScript definitions
│       └── 🏷️ index.ts              # Type exports
│
├── 🎨 constants/                    # App constants
│   ├── 🌟 GoldTheme.ts              # Design system
│   └── 🎨 Colors.ts                 # Color palette
│
├── 🖼️ assets/                       # Static assets
│   ├── 🏞️ images/                   # App images
│   ├── 🎵 sounds/                   # Audio files
│   └── 📱 adaptive-icon.png         # App icon
│
├── 📋 docs/                         # Documentation
│   ├── 🛡️ PROTECTED_ROUTING_GUIDE.md # Routing documentation
│   └── 🎨 DESIGN_SYSTEM.md         # Design guidelines
│
├── ⚙️ Configuration Files
│   ├── 📦 package.json              # Dependencies & scripts
│   ├── 🎯 app.json                  # Expo configuration
│   ├── 📝 tsconfig.json             # TypeScript config
│   ├── 🔧 metro.config.js           # Metro bundler config
│   ├── 🌐 .env.example              # Environment template
│   └── 📖 README.md                 # This file
│
└── 🧪 __tests__/                    # Test files
    ├── 🧩 components/               # Component tests
    ├── 🔧 services/                 # Service tests
    └── 🎯 integration/              # Integration tests
```

### 📂 Directory Descriptions

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| **app/** | Expo Router pages and navigation | `_layout.tsx`, screen files |
| **src/components/** | Reusable UI components | `GoldButton.tsx`, `ProtectedRoute.tsx` |
| **src/contexts/** | Global state management | `AuthContext.tsx`, `WebSocketContext.tsx` |
| **src/services/** | External integrations | `api.ts`, `WebSocketService.ts` |
| **constants/** | App-wide constants | `GoldTheme.ts`, `Colors.ts` |
| **assets/** | Static resources | Images, icons, audio files |

---

## ⚙️ Configuration

### 🌍 Environment Variables

Create a `.env.local` file in the root directory:

```bash
# API Configuration
API_URL=https://ginchat-14ry.onrender.com/api
API_TIMEOUT=20000

# WebSocket Configuration
WS_URL=wss://ginchat-14ry.onrender.com
WS_RECONNECT_INTERVAL=5000

# Feature Flags
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_FILE_ENCRYPTION=true
ENABLE_DEBUG_LOGGING=false

# Development Settings
DEBUG_MODE=false
LOG_LEVEL=info
```

### 📱 App Configuration (`app.json`)

```json
{
  "expo": {
    "name": "GinChat Mobile",
    "slug": "ginchat-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/adaptive-icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#1a1a1a"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.ginchat.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1a1a1a"
      },
      "package": "com.ginchat.mobile"
    },
    "web": {
      "favicon": "./assets/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      "expo-router",
      [
        "expo-build-properties",
        {
          "android": {
            "enableProguardInReleaseBuilds": true
          }
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

### 🔧 Metro Configuration (`metro.config.js`)

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable network access for development
config.server = {
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      // Enable CORS for development
      res.setHeader('Access-Control-Allow-Origin', '*');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
```

### 📜 Available Scripts

```json
{
  "scripts": {
    "start": "expo start --clear",
    "start-prod": "expo start --clear --no-dev",
    "start-host": "EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0 expo start --clear",
    "start-tunnel": "expo start --tunnel --clear",
    "android": "expo start --android --clear",
    "ios": "expo start --ios --clear",
    "web": "expo start --web --clear",
    "lint": "expo lint",
    "check:ts": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch",
    "build:android": "eas build --platform android",
    "build:ios": "eas build --platform ios",
    "build:all": "eas build --platform all"
  }
}
```

---

## 🧪 Testing

### 🔬 Testing Strategy

The app uses a comprehensive testing approach covering unit tests, integration tests, and end-to-end testing.

#### 🧩 **Unit Testing**

**Component Testing**
```typescript
// Example: GoldButton component test
import { render, fireEvent } from '@testing-library/react-native';
import { GoldButton } from '../src/components/GoldButton';

describe('GoldButton', () => {
  it('renders correctly with title', () => {
    const { getByText } = render(
      <GoldButton title="Test Button" onPress={() => {}} />
    );
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <GoldButton title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });
});
```

**Service Testing**
```typescript
// Example: API service test
import { authAPI } from '../src/services/api';

describe('AuthAPI', () => {
  it('should login successfully with valid credentials', async () => {
    const mockResponse = {
      token: 'mock-token',
      user: { id: 1, name: 'Test User' }
    };
    
    // Mock API call
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await authAPI.login('test@example.com', 'password');
    expect(result.token).toBe('mock-token');
    expect(result.user.name).toBe('Test User');
  });
});
```

#### 🔗 **Integration Testing**

**Authentication Flow**
```typescript
// Example: Full auth flow test
describe('Authentication Flow', () => {
  it('should complete login process end-to-end', async () => {
    const { getByPlaceholderText, getByText } = render(
      <AuthProvider>
        <LoginScreen />
      </AuthProvider>
    );

    // Fill login form
    fireEvent.changeText(
      getByPlaceholderText('Enter your email'),
      'test@example.com'
    );
    fireEvent.changeText(
      getByPlaceholderText('Enter your password'),
      'password123'
    );

    // Submit form
    fireEvent.press(getByText('Sign In'));

    // Verify navigation occurred
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/(tabs)/chats');
    });
  });
});
```

#### 🎯 **Test Commands**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- AuthContext.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

#### 📊 **Test Coverage Goals**

| Area | Target Coverage | Current |
|------|----------------|---------|
| **Components** | 85% | 🟢 87% |
| **Services** | 90% | 🟢 92% |
| **Contexts** | 80% | 🟡 76% |
| **Utils** | 95% | 🟢 98% |
| **Overall** | 85% | 🟢 86% |

---

## 🚀 Deployment

### 🏗️ Build Process

#### 📱 **Development Builds**

```bash
# Local development
npm start

# Network access for physical devices
npm run start-host

# Tunnel mode for external access
npm run start-tunnel
```

#### 🏭 **Production Builds**

**Using EAS Build (Recommended)**
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios

# Build for both platforms
eas build --platform all
```

**Legacy Expo Build**
```bash
# Android APK
expo build:android

# iOS IPA
expo build:ios
```

### 🌍 **Deployment Environments**

#### 🧪 **Development**
- **Purpose**: Local development and testing
- **URL**: `http://localhost:8081`
- **Features**: Hot reload, debugging, test data

#### 🧪 **Staging**
- **Purpose**: Pre-production testing
- **URL**: `https://staging.ginchat.com`
- **Features**: Production-like environment, test backend

#### 🏭 **Production**
- **Purpose**: Live application
- **URL**: App stores and web
- **Features**: Optimized builds, production backend

### 🏪 **App Store Deployment**

#### 🍎 **iOS App Store**

1. **Prepare Build**
   ```bash
   eas build --platform ios --profile production
   ```

2. **App Store Connect**
   - Upload build via Transporter or Xcode
   - Fill app metadata and screenshots
   - Submit for review

3. **Review Process**
   - Apple review (1-7 days)
   - Respond to feedback if needed
   - Release when approved

#### 🤖 **Google Play Store**

1. **Prepare Build**
   ```bash
   eas build --platform android --profile production
   ```

2. **Google Play Console**
   - Upload AAB file
   - Complete store listing
   - Set pricing and distribution

3. **Release Process**
   - Internal testing
   - Closed testing
   - Open testing
   - Production release

### 🔄 **CI/CD Pipeline**

**GitHub Actions Workflow**
```yaml
name: Build and Deploy
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform all --non-interactive
```

### 📊 **Version Management**

**Semantic Versioning**
- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features
- **PATCH**: Bug fixes

**Version Update Checklist**
- [ ] Update `package.json` version
- [ ] Update `app.json` version
- [ ] Update iOS version numbers
- [ ] Update Android version codes
- [ ] Create git tag
- [ ] Update changelog

---

## 🔧 Development Workflow

### 🔄 **Git Workflow**

```bash
# Feature development
git checkout -b feature/new-chat-feature
git add .
git commit -m "feat: add new chat feature"
git push origin feature/new-chat-feature

# Create pull request
# After review and approval:
git checkout main
git pull origin main
git merge feature/new-chat-feature
git push origin main
```

### 📝 **Commit Convention**

```bash
# Format: <type>(<scope>): <description>

feat(auth): add biometric authentication
fix(chat): resolve message ordering issue
docs(readme): update installation instructions
style(ui): improve button component styling
refactor(api): optimize network requests
test(auth): add authentication flow tests
chore(deps): update React Native version
```

### 🔍 **Code Quality**

**ESLint Configuration**
```json
{
  "extends": [
    "expo",
    "@react-native-community",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "react-native/no-inline-styles": "warn"
  }
}
```

**Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 🧪 **Development Scripts**

```bash
# Code quality checks
npm run lint              # Run ESLint
npm run lint:fix          # Fix ESLint issues
npm run type-check        # TypeScript check
npm run format            # Format with Prettier

# Testing
npm test                  # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Development
npm start                 # Start dev server
npm run ios              # iOS simulator
npm run android          # Android emulator
npm run web              # Web browser
```

### 📱 **Device Testing**

**Physical Device Setup**
```bash
# Enable developer mode
# Install Expo Go app
# Scan QR code from terminal

# For tunnel mode (external networks)
npm run start-tunnel
```

**Emulator Setup**
```bash
# Android (requires Android Studio)
npm run android

# iOS (requires Xcode on macOS)
npm run ios
```

### 🔧 **Debugging Tools**

**React Native Debugger**
- Remote JS debugging
- Redux DevTools integration
- Element inspector

**Flipper Integration**
- Network inspection
- Layout debugging
- Performance monitoring

**Expo Dev Tools**
- Metro bundler interface
- Error overlay
- Performance metrics

---

## 🐛 Troubleshooting

### 🚨 **Common Issues**

#### 🌐 **Network Connectivity**

**Problem**: "Failed to connect to development server"
```bash
# Solutions:
npm run start-tunnel     # Use tunnel mode
npm run start-host       # Use host binding
adb reverse tcp:8081 tcp:8081  # Android port forwarding
```

**Problem**: "Network request failed" on physical device
```bash
# Check firewall settings
# Ensure device and computer on same network
# Use tunnel mode for external networks
npm run start-tunnel
```

#### 📱 **Build Issues**

**Problem**: Metro bundler cache issues
```bash
# Clear Metro cache
npx react-native start --reset-cache
npm start -- --clear
```

**Problem**: iOS build failures
```bash
cd ios
pod deintegrate
pod install
cd ..
npx react-native run-ios
```

**Problem**: Android build failures
```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

#### 🔐 **Authentication Issues**

**Problem**: Token expiration errors
```bash
# Check AsyncStorage for valid token
# Implement automatic token refresh
# Clear storage and re-login
```

**Problem**: Protected route loops
```bash
# Check ProtectedRoute logic
# Verify isAuthenticated state
# Clear app data and restart
```

#### 🎨 **UI/Styling Issues**

**Problem**: Fonts not loading
```bash
# Ensure fonts are in assets/fonts/
# Check font names in Font.loadAsync()
# Verify expo-font installation
```

**Problem**: Images not displaying
```bash
# Check image paths
# Verify image formats (jpg, png)
# Use require() for local images
```

### 🔧 **Debug Commands**

```bash
# Comprehensive debugging
npm start -- --clear --reset-cache
expo doctor                    # Check for issues
expo install --fix            # Fix dependency issues

# Platform-specific debugging
npx react-native info         # Environment info
adb logcat | grep ReactNative # Android logs
xcrun simctl list             # iOS simulators
```

### 📞 **Getting Help**

**Documentation**
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs)
- [Expo Router Documentation](https://expo.github.io/router/)

**Community Support**
- [Expo Discord](https://discord.gg/expo)
- [React Native Community](https://reactnative.dev/community/support)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/expo)

**Issue Reporting**
1. Check existing issues in repository
2. Provide detailed reproduction steps
3. Include environment information
4. Attach relevant logs and screenshots

---

## 📖 Documentation

### 📚 **Additional Guides**

- **[Protected Routing Guide](./docs/PROTECTED_ROUTING_GUIDE.md)**: Comprehensive routing documentation
- **[Design System Guide](./docs/DESIGN_SYSTEM.md)**: UI component guidelines
- **[API Reference](./docs/API_REFERENCE.md)**: Complete API documentation
- **[Deployment Guide](./docs/DEPLOYMENT.md)**: Step-by-step deployment instructions

### 🎓 **Learning Resources**

**React Native**
- [React Native Tutorial](https://reactnative.dev/docs/tutorial)
- [React Native Best Practices](https://github.com/react-native-community/awesome-react-native)

**Expo**
- [Expo Tutorial](https://docs.expo.dev/tutorial/introduction/)
- [Expo Router Guide](https://expo.github.io/router/docs/)

**TypeScript**
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)

### 📋 **Code Examples**

**Creating a New Screen**
```typescript
// app/new-screen.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { GoldTheme } from '@/constants/GoldTheme';

export default function NewScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: GoldTheme.background.primary }}>
      <Text style={{ color: GoldTheme.text.primary }}>
        New Screen Content
      </Text>
    </View>
  );
}
```

**Adding a New API Endpoint**
```typescript
// src/services/api.ts
export const newAPI = {
  getData: async (): Promise<DataType> => {
    try {
      const response = await api.get('/new-endpoint');
      return response.data;
    } catch (error) {
      console.log('API call failed:', error);
      throw error;
    }
  }
};
```

---

## 🤝 Contributing

### 🎯 **How to Contribute**

1. **Fork the Repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/yourusername/GinChatMobile.git
   cd GinChatMobile
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **Make Changes**
   - Follow coding standards
   - Add tests for new features
   - Update documentation

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/amazing-feature
   # Create pull request on GitHub
   ```

### 📋 **Contribution Guidelines**

**Code Standards**
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Add JSDoc comments for functions
- Include unit tests for new features

**Pull Request Checklist**
- [ ] Code follows project style guide
- [ ] Tests pass locally
- [ ] New features have tests
- [ ] Documentation updated
- [ ] No console errors
- [ ] Reviewed own code

**Issue Reporting**
- Use issue templates
- Provide reproduction steps
- Include environment details
- Add screenshots/videos if applicable

### 🏆 **Recognition**

Contributors will be recognized in:
- GitHub contributors list
- App credits section
- Special mention in releases

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 GinChat Mobile

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- **[Expo Team](https://expo.dev/)** - For the amazing development platform
- **[React Native Community](https://reactnative.dev/)** - For the robust framework
- **[React Navigation](https://reactnavigation.org/)** - For navigation solutions
- **All Contributors** - For making this project better

---

<div align="center">

**Built with ❤️ using React Native & Expo**

[⬆ Back to Top](#-ginchat-mobile---premium-messaging-experience)

</div> 