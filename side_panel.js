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
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  chrome.tabs.captureVisibleTab(sender.tab.windowId, {}, function (dataUrl) {
    sendResponse({ imgSrc: dataUrl });
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
      var x = 500, y = 500, endx = 900, endy = 900;
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
        x = endx; y = endy;
        clicked = false
        if(moved) {
          console.log('moved')
        }
        else{
          console.log('not moved')
        }
      }
      layer_canvas.addEventListener('mouseup', upListener);
      // Draw rectangle Animation
      function init(){
        newWindow.requestAnimationFrame(draw)
      }
      function draw(){
        layer_context.clearRect(0, 0, layer_canvas.width, layer_canvas.height);
        excludeRect(layer_context, layer_canvas, x, y, endx, endy);
        newWindow.requestAnimationFrame(draw)
      }
      layer_context.globalAlpha = 0.25;
      init()
    }
  });
  return true;
});
