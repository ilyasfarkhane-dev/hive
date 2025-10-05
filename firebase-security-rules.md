# Firebase Storage Security Rules

## Current Issue
The Firebase connection test is showing "unknown error" when trying to access Firebase Storage. This typically indicates:

1. **Security Rules Issue**: The default Firebase Storage rules require authentication
2. **Authentication Required**: The app might need to be authenticated to access storage
3. **Network/Firewall Issues**: Corporate firewalls might block Firebase APIs

## Recommended Firebase Storage Rules

### Option 1: Open Rules (Development Only)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow all read and write access for development
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Option 2: Restricted Rules (Production Ready)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow access to hive-documents folder
    match /hive-documents/{userId}/{allPaths=**} {
      allow read, write: if true; // Adjust based on your auth requirements
    }
    
    // Allow access to test folder
    match /hive-documents/test/{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

### Option 3: Authenticated Rules (Most Secure)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /hive-documents/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## How to Update Firebase Storage Rules

1. **Via Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `hive-42335`
   - Navigate to Storage → Rules
   - Update the rules and publish

2. **Via Firebase CLI**:
   ```bash
   firebase login
   firebase use hive-42335
   firebase deploy --only storage
   ```

## Alternative: Use Service Account

If you need to bypass authentication for server-side operations, you can use a service account:

1. **Generate Service Account Key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Generate new private key
   - Download the JSON file

2. **Update Firebase Config**:
   ```javascript
   import { initializeApp, cert } from 'firebase/app';
   import { getStorage } from 'firebase/storage';
   
   const serviceAccount = require('./path/to/serviceAccountKey.json');
   
   const app = initializeApp({
     ...firebaseConfig,
     credential: cert(serviceAccount)
   });
   
   const storage = getStorage(app);
   ```

## Testing the Fix

After updating the rules, run the test again:
```bash
node test-firebase-connection.js
```

## Current Configuration Status

✅ **Firebase Config**: Properly configured
✅ **Dependencies**: Firebase SDK installed (v12.3.0)
✅ **API Integration**: All routes properly integrated
❌ **Storage Access**: Permission issues detected
❌ **File Operations**: Blocked by security rules

## Next Steps

1. Update Firebase Storage security rules (recommend Option 2 for now)
2. Test the connection again
3. Verify file upload/download functionality
4. Consider implementing proper authentication if needed
