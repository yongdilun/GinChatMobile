#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import environment variables
const {
  FIREBASE_PROJECT_NUMBER,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_DATABASE_URL,
  FIREBASE_MOBILE_SDK_APP_ID,
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID
} = require('../.env');

// Check if all required variables are present
const requiredVars = [
  'FIREBASE_PROJECT_NUMBER',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MOBILE_SDK_APP_ID',
  'FIREBASE_API_KEY'
];

const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`  - ${varName}`));
  console.error('\n📝 Please copy .env.example to .env and fill in your Firebase credentials');
  process.exit(1);
}

// Generate google-services.json
const googleServicesConfig = {
  "project_info": {
    "project_number": FIREBASE_PROJECT_NUMBER,
    "firebase_url": FIREBASE_DATABASE_URL || `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`,
    "project_id": FIREBASE_PROJECT_ID,
    "storage_bucket": FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.appspot.com`
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": FIREBASE_MOBILE_SDK_APP_ID,
        "android_client_info": {
          "package_name": "com.yongdidi.GinChatMobile"
        }
      },
      "oauth_client": [
        {
          "client_id": `${FIREBASE_PROJECT_NUMBER}-${FIREBASE_PROJECT_ID}.apps.googleusercontent.com`,
          "client_type": 3
        }
      ],
      "api_key": [
        {
          "current_key": FIREBASE_API_KEY
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": [
            {
              "client_id": `${FIREBASE_PROJECT_NUMBER}-${FIREBASE_PROJECT_ID}.apps.googleusercontent.com`,
              "client_type": 3
            }
          ]
        }
      }
    }
  ],
  "configuration_version": "1"
};

// Write the file
const outputPath = path.join(__dirname, '..', 'google-services.json');

try {
  fs.writeFileSync(outputPath, JSON.stringify(googleServicesConfig, null, 2));
  console.log('✅ google-services.json generated successfully');
  console.log(`📁 Location: ${outputPath}`);
} catch (error) {
  console.error('❌ Error writing google-services.json:', error.message);
  process.exit(1);
} 