url = document.URL
// This is a hack.... the iframe doesn't load or something, and doesn't take up the whole body???
// Next time, click the button to open the sidepanel as well.
frames = '<div style="float:left; width:60%"> <iframe id="mainframe" style="height:100vh" width="100%" src="' + url + '" style="-webkit-transform:scale(1);-moz-transform-scale(1);" title="W3Schools Free Online Web Tutorials"></iframe> </div>' + ' <div style="float:left; width:40%"> <iframe style="height:100vh" width="100%" src="' + chrome.runtime.getURL("side_panel.html") + '" style="-webkit-transform:scale(1);-moz-transform-scale(1);" title="W3Schools Free Online Web Tutorials"></iframe> </div>'
document.body.innerHTML = frames

async function message(t, m){
  await new Promise(r => setTimeout(r, t));
  console.log("Message sent");
    (async () => { const response = await chrome.runtime.sendMessage(m); 
    })();
}
// Catch all the links loaded by iframe
message(100, ["Hello"]);
