#!/bin/bash
set -e

# Test Build Script
# Ověření, že build funguje s aktuální konfigurací

echo "🧪 Testing build configuration..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}📋${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if we're in the project root
if [ ! -f "package.json" ] || [ ! -f "android/build.gradle" ]; then
    print_error "Must run from project root directory"
    exit 1
fi

# Step 1: Check NDK version
print_info "Checking NDK version..."
NDK_VERSION=$(grep "ndkVersion" android/build.gradle | sed 's/.*"\(.*\)".*/\1/' || echo "NOT FOUND")
if [ "$NDK_VERSION" != "NOT FOUND" ]; then
    print_success "NDK Version: $NDK_VERSION"
    
    # Check if it's r26 or r28
    if [[ "$NDK_VERSION" == *"26"* ]]; then
        print_warning "NDK r26 detected - částečná 16 KB compliance"
    elif [[ "$NDK_VERSION" == *"28"* ]]; then
        print_success "NDK r28 detected - plná 16 KB compliance"
    fi
else
    print_error "Could not find NDK version in android/build.gradle"
    exit 1
fi

# Step 2: Check AGP version
print_info "Checking Android Gradle Plugin version..."
AGP_VERSION=$(grep "com.android.tools.build:gradle:" android/build.gradle | sed 's/.*gradle:\([0-9.]*\).*/\1/' || echo "NOT FOUND")
if [ "$AGP_VERSION" != "NOT FOUND" ]; then
    print_success "AGP Version: $AGP_VERSION"
    
    # Check if AGP is 8.5.1 or higher
    AGP_MAJOR=$(echo "$AGP_VERSION" | cut -d. -f1)
    AGP_MINOR=$(echo "$AGP_VERSION" | cut -d. -f2)
    AGP_PATCH=$(echo "$AGP_VERSION" | cut -d. -f3)
    
    if [ "$AGP_MAJOR" -eq 8 ] && [ "$AGP_MINOR" -ge 5 ]; then
        print_success "AGP 8.5.1+ detected - podporuje 16 KB ZIP alignment"
    elif [ "$AGP_MAJOR" -eq 8 ] && [ "$AGP_MINOR" -ge 5 ]; then
        print_warning "AGP verze může být zastaralá pro plnou 16 KB compliance"
    fi
else
    print_warning "Could not find AGP version"
fi

# Step 3: Check Android SDK configuration
print_info "Checking Android SDK configuration..."
COMPILE_SDK=$(grep "compileSdkVersion" android/build.gradle | sed 's/.*compileSdkVersion.*\([0-9]\+\).*/\1/' | head -1 || echo "NOT FOUND")
TARGET_SDK=$(grep "targetSdkVersion" android/build.gradle | sed 's/.*targetSdkVersion.*\([0-9]\+\).*/\1/' | head -1 || echo "NOT FOUND")
MIN_SDK=$(grep "minSdkVersion" android/build.gradle | sed 's/.*minSdkVersion.*\([0-9]\+\).*/\1/' | head -1 || echo "NOT FOUND")

if [ "$COMPILE_SDK" != "NOT FOUND" ]; then
    print_success "Compile SDK: $COMPILE_SDK"
    if [ "$COMPILE_SDK" -ge 35 ]; then
        print_success "Compile SDK 35+ - splňuje požadavky"
    else
        print_warning "Compile SDK by měl být 35+"
    fi
fi

if [ "$TARGET_SDK" != "NOT FOUND" ]; then
    print_success "Target SDK: $TARGET_SDK"
    if [ "$TARGET_SDK" -ge 35 ]; then
        print_success "Target SDK 35+ - splňuje požadavky"
    else
        print_warning "Target SDK by měl být 35+"
    fi
fi

if [ "$MIN_SDK" != "NOT FOUND" ]; then
    print_success "Min SDK: $MIN_SDK"
fi

# Step 4: Check Expo and React Native versions
print_info "Checking Expo and React Native versions..."
if command -v node &> /dev/null; then
    EXPO_VERSION=$(node -e "console.log(require('./package.json').dependencies.expo || 'NOT FOUND')" 2>/dev/null | sed 's/[~^]//g' || echo "NOT FOUND")
    RN_VERSION=$(node -e "console.log(require('./package.json').dependencies['react-native'] || 'NOT FOUND')" 2>/dev/null | sed 's/[~^]//g' || echo "NOT FOUND")
    
    if [ "$EXPO_VERSION" != "NOT FOUND" ]; then
        print_success "Expo SDK: $EXPO_VERSION"
    fi
    
    if [ "$RN_VERSION" != "NOT FOUND" ]; then
        print_success "React Native: $RN_VERSION"
    fi
fi

echo ""
print_info "Build configuration check completed!"
echo ""

# Step 5: Ask if user wants to run clean build
read -p "🧹 Do you want to run a clean build? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Cleaning previous builds..."
    cd android
    ./gradlew clean
    cd ..
    print_success "Clean completed!"
    echo ""
fi

# Step 6: Ask if user wants to test local build
if command -v adb &> /dev/null && adb devices | grep -q "device"; then
    read -p "🔨 Do you want to test local build? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Building Android app (no install)..."
        npx expo run:android --no-install || {
            print_error "Build failed!"
            exit 1
        }
        print_success "Build completed successfully!"
    fi
else
    print_warning "No Android device/emulator detected or adb not available"
    print_info "To test build, use EAS Build:"
    echo "   eas build --profile development --platform android"
fi

echo ""
print_success "Test completed! ✅"
echo ""
print_info "Next steps:"
echo "   1. If NDK is r26: Consider upgrade to Expo SDK 52+ / RN 0.77+ for full 16 KB compliance"
echo "   2. If NDK is r28: Verify 16 KB compliance with bundletool (see docs/TEST_BUILD.md)"
echo "   3. Test app functionality after build"
