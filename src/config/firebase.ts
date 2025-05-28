import {
  FIREBASE_API_KEY,
  FIREBASE_APP_ID,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_PROJECT_NUMBER,
} from '@env';

export const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: `${FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_PROJECT_NUMBER,
  appId: FIREBASE_APP_ID,
};

// Function to generate google-services.json content
export const generateGoogleServicesJson = () => ({
  project_info: {
    project_number: FIREBASE_PROJECT_NUMBER,
    project_id: FIREBASE_PROJECT_ID,
    storage_bucket: FIREBASE_STORAGE_BUCKET,
  },
  client: [
    {
      client_info: {
        mobilesdk_app_id: FIREBASE_APP_ID,
        android_client_info: {
          package_name: 'com.yongdidi.GinChatMobile',
        },
      },
      oauth_client: [],
      api_key: [
        {
          current_key: FIREBASE_API_KEY,
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