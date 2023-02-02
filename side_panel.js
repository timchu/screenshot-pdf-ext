// Where should this code live? It eats a message, spawns a window, passes the dataUrl to the window
// Which would otherwise require getting a new listener set up there, which is annoying. So perhaps
// controlling it from here is fine? At least it shouldn't live in sidepanel.js though.

document.body.style.backgroundColor="white"

// Code to exclude a white rectangle from a black overlay on the canvas. The black overlay can be made gray by changing the context's globalAlpha before this code is called.
function excludeRect(context, canvas, x, y, endx, endy){
    context.fillRect(0, 0, canvas.width, canvas.height);
    topx = Math.min(x, endx)
    botx = Math.max(x, endx)
    lefty = Math.min(y, endy)
    righty = Math.max(y, endy)
    context.clearRect(topx, lefty, botx-topx, righty-lefty)
}

// Adds screenshot functionality to the scissors icon.
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.length > 0 && message[0] == "Hello") {
    screenshot_icon = document.getElementById('screenshot_icon')
    console.log(screenshot_icon);
    screenshot_icon.addEventListener('click', function() {
        screenshot(sender)
    });
    console.log("Message")
    console.log(message)
  }
  sendResponse(["Received!"]);
return true;
});
function screenshot(sender){
    chrome.tabs.captureVisibleTab(sender.tab.windowId, {}, function (dataUrl) {
      var screenshot_window = window.open('/screenshot.html')
      screenshot_window.onload = (event) => {
        var canvas = screenshot_window.document.getElementById('canvas')
        var context = canvas.getContext("2d")
        var width=screenshot_window.innerWidth
        var height=screenshot_window.innerHeight
        const img = new Image();
          // res_multiplier is needed as a hack to make the image quality of the canvas higher (and not blurry). Context: https://stackoverflow.com/questions/67572294/canvas-drawimage-with-high-quality-javascript . 
        var res_multiplier = 2
        img.onload=function(){
          canvas.height = height*res_multiplier
          canvas.width = width*res_multiplier
          canvas.style.width = "100%"
          context.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = dataUrl

        // Get the layering canvas element, which governs visual effects over existing image.
        var layer_canvas = screenshot_window.document.getElementById('layer')
        var layer_context = layer_canvas.getContext("2d")

        // Add mouse listeners for dragging the screenshot window.
        var x = 0, y = 0, endx = 0, endy = 0;
        // Moved is needed to distinguish drags and clicks. Context: https://stackoverflow.com/questions/6042202/how-to-distinguish-mouse-click-and-drag . Click is needed because move fires even if you aren't holding click down.k
        let moved, clicked = false
        function downListener(event) {
          moved = false
          clicked = true
          x = event.clientX
          y = event.clientY
        }
        layer_canvas.addEventListener('mousedown', downListener);
        function moveListener(event) {
          moved = true
          if (clicked){
            endx = event.clientX
            endy = event.clientY
          }
        }
        layer_canvas.addEventListener('mousemove', moveListener);
        function upListener(event) {
          if(moved && clicked) {
            //res_multiplier is needed here to access the proper coordinates in the underlying canvas. This is a bit of a hack and should be done away with eventually. 
            let screenshot_dataURL = get_dataURL(canvas, res_multiplier*x, res_multiplier*y, res_multiplier*endx, res_multiplier*endy)
            screenshot_image = document.createElement("img")
            screenshot_image.onload=function(){
              document.body.appendChild(screenshot_image)
              //Spacer needed since otherwise, small images will go side-by-side in hte sidepanel.
              spacer = document.createElement("p") 
              document.body.appendChild(spacer)
            }
            screenshot_image.style.maxWidth="100%"
            screenshot_image.src = screenshot_dataURL
            screenshot_window.close()
            
          }
          else{
            //console.log('not moved-n-clicked')
          }
          // Reset clicked state after click is lifted, reset x and y. Resetting x and y isn't necessary for our current functionality, but it may be helpful later.
          clicked = false
          x = endx; y = endy;
        }
        layer_canvas.addEventListener('mouseup', upListener);

        // Draw the "excluded rectangle" Animation in the screenshot window.
        function startAnimation(){
          screenshot_window.requestAnimationFrame(draw)
        }
        function draw(){
          layer_context.clearRect(0, 0, layer_canvas.width, layer_canvas.height);
          excludeRect(layer_context, layer_canvas, x, y, endx, endy);
          screenshot_window.requestAnimationFrame(draw)
        }
        layer_context.globalAlpha = 0.25;
        startAnimation()
      }
    });
}
// Returns data URL for an image from a canvas and endx, endy.
function get_dataURL(canvas, x, y, endx, endy){
  var hidden_canvas = document.createElement('canvas');
  var hidden_context = hidden_canvas.getContext('2d');
  hidden_canvas.width= endx - x
  hidden_canvas.height= endy - y
  hidden_canvas.style.width = canvas.style.width;
  hidden_context.drawImage(canvas, -x, -y, canvas.width, canvas.height);
  console.log(x, y, endx, endy)
  return hidden_canvas.toDataURL();
}
