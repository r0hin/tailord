chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension Installed?")
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Scrape request
  if (request.message === "scrape") {
    console.log("Scrape request received");
    sendResponse({ message: "response test" });
  }
});