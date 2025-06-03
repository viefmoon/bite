#!/bin/bash

# Fix Expo package compatibility issues

cd /home/leo/bite/app

echo "Updating Expo packages to compatible versions..."

# Update packages to match Expo SDK requirements
npx expo install --fix

# The above command should handle most updates, but if specific versions are needed:
# npm install @shopify/flash-list@1.7.3
# npm install expo@~52.0.46
# npm install expo-build-properties@~0.13.3
# npm install expo-dev-client@~5.0.20
# npm install expo-font@~13.0.4
# npm install expo-splash-screen@~0.29.24
# npm install expo-system-ui@~4.0.9
# npm install react-native@0.76.9
# npm install jest-expo@~52.0.6 --save-dev

echo -e "\nPackage updates complete!"
echo "Run 'npx expo-doctor' again to verify all issues are resolved."