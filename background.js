const getSetting = () =>
  chrome.storage.local.get("disabled").then((result) => result.disabled);

const setIcon = (disabled) =>
  chrome.action.setIcon({
    path: disabled ? "icon-disabled.png" : "icon.png",
  });

// Initialize icon on install
chrome.runtime.onInstalled.addListener(() => {
  getSetting().then(setIcon);
});

// Handle icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  const disabled = await getSetting();
  const toggled = !disabled;
  await chrome.storage.local.set({ disabled: toggled });
  setIcon(toggled);
});
