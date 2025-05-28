// Firebase configuration for web platform only
// Mobile apps use Expo push notifications instead

export const firebaseConfig = {
  // These will be used only for web platform when needed
  apiKey: process.env.FIREBASE_API_KEY || '',
  authDomain: `${process.env.FIREBASE_PROJECT_ID || ''}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.FIREBASE_PROJECT_NUMBER || '',
  appId: process.env.FIREBASE_APP_ID || '',
};

// Expo push notification configuration
export const expoPushConfig = {
  projectId: 'ed9112c0-dcb5-44d5-abf9-2f85fc7baf6c',
};

// Function to generate google-services.json content
export const generateGoogleServicesJson = () => ({
  project_info: {
    project_number: process.env.FIREBASE_PROJECT_NUMBER || '',
    project_id: process.env.FIREBASE_PROJECT_ID || '',
    storage_bucket: process.env.FIREBASE_STORAGE_BUCKET || '',
  },
  client: [
    {
      client_info: {
        mobilesdk_app_id: process.env.FIREBASE_APP_ID || '',
        android_client_info: {
          package_name: 'com.yongdidi.GinChatMobile',
        },
      },
      oauth_client: [],
      api_key: [
        {
          current_key: process.env.FIREBASE_API_KEY || '',
        },
      ],
      services: {
        appinvite_service: {
          other_platform_oauth_client: [],
        },
      },
    },
  ],
  configuration_version: '1',
}); 