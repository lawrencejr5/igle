module.exports = {
  expo: {
    name: "Igle",
    slug: "igle",
    scheme: "com.lawrencejr.igle",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    userInterfaceStyle: "dark",
    plugins: [
      "expo-dev-client",
      "expo-web-browser",
      "expo-router",
      "expo-apple-authentication",
      [
        "react-native-maps",
        {
          "iosGoogleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API,
          "androidGoogleMapsApiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API
        }
      ],
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Igle to use your location to find nearby rides and track your driver.",
          "locationAlwaysPermission": "Allow Igle to use your location to find nearby rides and track your driver.",
          "isIosBackgroundLocationEnabled": true
        }
      ],
      [
        "expo-notifications",
        {
          "icon": "./assets/images/icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    splash: {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#121212"
    },
    ios: {
      "supportsTablet": false,
      "bundleIdentifier": "com.lawrencejr.igle",
      "usesAppleSignIn": true,
      "infoPlist": {
        "UIBackgroundModes": [
          "location",
          "fetch",
          "remote-notification"
        ],
        "ITSAppUsesNonExemptEncryption": false,
        "NSLocationWhenInUseUsageDescription": "Igle needs your location to accurately match you with drivers and provide route navigation.",
        "NSLocationAlwaysAndWhenInUseUsageDescription": "Igle needs your location to accurately match you with drivers and provide route navigation."
      }
    },
    android: {
      "googleServicesFile": "./google-services.json",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.lawrencejr.igle"
    },
    web: {
      "favicon": "./assets/images/favicon.png"
    },
    extra: {
      eas: {
        "projectId": "19685ce9-a6ad-485b-bc81-e4654431869e"
      }
    }
  }
};