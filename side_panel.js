// Where should this code live? It eats a message, spawns a window, passes the dataUrl to the window
// Which would otherwise require getting a new listener set up there, which is annoying. So perhaps
// controlling it from here is fine? At least it shouldn't live in sidepanel.js though.

function excludeRect(context, canvas, x, y, endx, endy){
    context.fillRect(0, 0, canvas.width, canvas.height);
    topx = Math.min(x, endx)
    botx = Math.max(x, endx)
    lefty = Math.min(y, endy)
    righty = Math.max(y, endy)
    context.clearRect(topx, lefty, botx-topx, righty-lefty)
}

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
// Reactivate this if you want this to fire on messages
function screenshot(sender){
    console.log("What up")
    chrome.tabs.captureVisibleTab(sender.tab.windowId, {}, function (dataUrl) {
      var newWindow = window.open('/screenshot.html')
      newWindow.onload = (event) => {
        var res_multiplier = 2
        var canvas = newWindow.document.getElementById('canvas')
        var context = canvas.getContext("2d")
        var width=newWindow.innerWidth
        var height=newWindow.innerHeight
        const img = new Image();
        img.onload=function(){
          // The below is a hack to make a high resolution canvas, as found here: https://stackoverflow.com/questions/67572294/canvas-drawimage-with-high-quality-javascript . Otherwise, the HTML image is blurry.
          canvas.height = height*res_multiplier
          canvas.width = width*res_multiplier
          canvas.style.width = "100%"
          context.drawImage(img, 0, 0, canvas.width, canvas.height)
        }
        img.src = dataUrl
        // Get the layering canvas which governs visual effects over existing image.
        var layer_canvas = newWindow.document.getElementById('layer')
        var layer_context = layer_canvas.getContext("2d")

        // Add mouse listeners.
        var x = 0, y = 0, endx = 0, endy = 0;
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
            console.log('moved and clicked')
            let screenshot_dataURL = save_image(canvas, res_multiplier*x, res_multiplier*y, res_multiplier*endx, res_multiplier*endy)
            screenshot_image = document.createElement("img")
            screenshot_image.onload=function(){
              document.body.appendChild(screenshot_image)
            }
            screenshot_image.style.maxWidth="100%"
            screenshot_image.src = screenshot_dataURL
            newWindow.close()
            
          }
          else{
            console.log('not moved-n-clicked')
          }
          // Reset clicked state if clicked was true for a single click.
          clicked = false
          x = endx; y = endy;
        }
        layer_canvas.addEventListener('mouseup', upListener);

        // Draw rectangle Animation
        function startAnimation(){
          newWindow.requestAnimationFrame(draw)
        }
        function draw(){
          layer_context.clearRect(0, 0, layer_canvas.width, layer_canvas.height);
          excludeRect(layer_context, layer_canvas, x, y, endx, endy);
          newWindow.requestAnimationFrame(draw)
        }
        layer_context.globalAlpha = 0.25;
        startAnimation()
      }
    });
}
function save_image(canvas, x, y, endx, endy){
  var hidden_canvas = document.createElement('canvas');
  var hidden_context = hidden_canvas.getContext('2d');
  hidden_canvas.width= endx - x
  hidden_canvas.height= endy - y
  hidden_canvas.style.width = canvas.style.width;
  hidden_context.drawImage(canvas, -x, -y, canvas.width, canvas.height);
  console.log(x, y, endx, endy)
  return hidden_canvas.toDataURL();
}
