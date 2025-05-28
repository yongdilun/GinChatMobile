const fs = require('fs');
const path = require('path');
require('dotenv').config();

const googleServicesTemplate = {
  "project_info": {
    "project_number": "${FIREBASE_PROJECT_NUMBER}",
    "project_id": "${FIREBASE_PROJECT_ID}",
    "storage_bucket": "${FIREBASE_STORAGE_BUCKET}"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "${FIREBASE_APP_ID}",
        "android_client_info": {
          "package_name": "com.yongdidi.GinChatMobile"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "${FIREBASE_API_KEY}"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ],
  "configuration_version": "1"
};

// Replace environment variables in the template
const replaceEnvVariables = (obj) => {
  const str = JSON.stringify(obj);
  const replaced = str.replace(/\${([^}]+)}/g, (match, key) => {
    const value = process.env[key];
    if (!value) {
      console.error(`Warning: Environment variable ${key} is not set`);
      return match;
    }
    return value;
  });
  return JSON.parse(replaced);
};

// Generate the file
const googleServicesJson = replaceEnvVariables(googleServicesTemplate);
const outputPath = path.join(__dirname, '..', 'google-services.json');

fs.writeFileSync(outputPath, JSON.stringify(googleServicesJson, null, 2));
console.log('Generated google-services.json with environment variables'); 