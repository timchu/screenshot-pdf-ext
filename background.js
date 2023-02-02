console.log("Background loaded")
chrome.action.onClicked.addListener(async (tabInfo) => {
    console.log("Clicked!")
    console.log(await getCurrentTab());
});
async function getCurrentTabUrl() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab.url;
}
// JSON format for activeness; 
// {ActiveURLs: {[url]: true}}
// or
// {ActiveURLs [List of active URLs]}
// How to find if URL in a JSON object?
