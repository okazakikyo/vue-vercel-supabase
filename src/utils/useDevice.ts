export function getDeviceState() {
    return {
        isMobile: window.innerWidth <= 768,
        isDesktop: window.innerWidth > 768,
    }
}