/**
 * device-utils.js
 * Device detection and control mode recommendation
 */

export function detectDevice() {
    // Check for touch support
    const isTouchDevice = (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0)
    );

    // Check user agent for mobile
    const isMobileUA = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check user agent for tablet
    const isTabletUA = /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(navigator.userAgent);

    // Determine device type
    const isMobile = isMobileUA && !isTabletUA;
    const isTablet = isTabletUA;
    const isDesktop = !isMobileUA && !isTabletUA;

    // Get screen size info
    const screenWidth = window.screen.width;
    const screenHeight = window.screen.height;
    const isSmallScreen = screenWidth < 768;

    return {
        isMobile,
        isTablet,
        isDesktop,
        hasTouch: isTouchDevice,
        deviceType: isMobile ? 'mobile' : (isTablet ? 'tablet' : 'desktop'),
        screenWidth,
        screenHeight,
        isSmallScreen
    };
}

export function getDefaultControlMode(device) {
    // Desktop without touch = tap (click) controls
    if (device.isDesktop && !device.hasTouch) {
        return 'tap';
    }

    // Mobile = tap left/right by default
    if (device.isMobile) {
        return 'tap';
    }

    // Tablet with touch = tap
    if (device.isTablet && device.hasTouch) {
        return 'tap';
    }

    // Default to tap for all other cases
    return 'tap';
}

export function shouldShowTiltControls(device) {
    // Only show tilt option on mobile/tablet with accelerometer
    return (device.isMobile || device.isTablet) && device.hasTouch;
}

export function getDeviceInfo() {
    const device = detectDevice();

    console.log('📱 Device Detection:');
    console.log(`  Type: ${device.deviceType}`);
    console.log(`  Touch: ${device.hasTouch ? 'Yes' : 'No'}`);
    console.log(`  Screen: ${device.screenWidth}x${device.screenHeight}`);
    console.log(`  Recommended Control: ${getDefaultControlMode(device)}`);

    return device;
}
