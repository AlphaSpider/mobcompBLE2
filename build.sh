#!/usr/bin/sh
rm platforms/android/build/outputs/apk/android-debug.apk
rm platforms/android/build/outputs/apk/android-release-unsigned.apk
phonegap build android
cd platforms/android/cordova/
./build --release
cd ..
cd build/outputs/apk
adb install android-debug.apk
