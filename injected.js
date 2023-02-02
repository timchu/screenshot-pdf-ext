console.log("Injecting")
chrome.tabs.sendMessage(tabs[0].id, ["Hello"])
