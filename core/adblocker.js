const { ElectronBlocker } = require('@cliqz/adblocker-electron');
async function initializeAdBlocker(fetch, session) {
    const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
    blocker.enableBlockingInSession(session.defaultSession);
}
module.exports = initializeAdBlocker;