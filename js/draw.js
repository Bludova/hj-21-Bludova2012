'use strict';
function getColorFromDrawTools() {
  const colors = drawTools.querySelectorAll('.menu__color');
  let colorValue;
  colors.forEach(color => {
    if (color.checked) {
      colorValue = color.value;
    }
  });

  return colorValue;
}

function createCanvas() {
  canvas.id = 'canvas';
  canvas.width = `${currentImage.offsetWidth}`;
  canvas.height = `${currentImage.offsetHeight}`;

  const currImgBound = currentImage.getBoundingClientRect();
  canvas.style.top = `${currImgBound.top}px`;
  canvas.style.left = `${currImgBound.left}px`;
  wrap.appendChild(canvas);

  canvas.addEventListener('mousedown', (event) => {
    event.preventDefault();

    globalDrawingStatus = hasMenuActive();
    if (globalDrawingStatus) {
      drawing = true;
      const curve = [];

      curve.push(makePoint(event.offsetX, event.offsetY));
      curves.push(curve);
      needsRepaint = true;
    }
  });

  canvas.addEventListener('mousemove', onDrawing);
  canvas.addEventListener('mousemove', (event) => {
    if (drawing === true) {
      debounceSendMask();
    }
  });

  canvas.addEventListener('mouseup', (event) => {
    event.preventDefault();
    drawing = false;
  });
}

function onDrawing(event) {
  if (drawing) {
    const point = makePoint(event.offsetX, event.offsetY);
    curves[curves.length - 1].push(point);
    needsRepaint = true;
  }
}

function circle(point) {
  ctx.beginPath();
  ctx.fillStyle = point.hue;

  ctx.arc(...point, BRUSH_RADIUS / 2, 0, 2 * Math.PI);
  ctx.fill();
}

function smoothCurveBetween (p1, p2) {
  ctx.strokeStyle = p2.hue;
  const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
  ctx.quadraticCurveTo(...p1, ...cp);

  ctx.stroke();
}

function smoothCurve(points) {
  ctx.beginPath();
  ctx.lineWidth = BRUSH_RADIUS;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.moveTo(...points[0]);

  for(let i = 1; i < points.length - 1; i++) {
    smoothCurveBetween(points[i], points[i + 1]);
  }

  ctx.stroke();
}


function makePoint(x, y) {
  const point = [x, y];
  point.hue = getColorFromDrawTools();
  return point;
}


function repaint () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  curves
    .forEach((curve) => {
      circle(curve[0]);
      smoothCurve(curve);
    });
}

function tick () {
  if(needsRepaint) {
    repaint();
    needsRepaint = false;
  }

  window.requestAnimationFrame(tick);
}

tick();

function hasMenuActive() {
  if (menu.dataset.active === 'draw') {
    return true;
  } else {
    return false;
  }
}

function setCanvas() {
  currentImage.addEventListener('load', createCanvas);
  currentImage.addEventListener('load', () => {
    setParamForSendCanvasData(sendCanvasData);
  });
}

function sendCanvasImageData() {
  if (!isClearCanvas(canvas)) {

    transferCanvasInfoToCanvasData()
      .then(sendMask)
      .then(setOverCanvasImage);
  }
}

// изображение, связанное с отправкой
function setOverCanvasImage() {
  return new Promise((res, rej) => {
    let img;
    if (isCreateOverImage()) {
      img = document.querySelector('.over-canvas');
      img.src = sendCanvasData.toDataURL();
      clearCanvas(canvas, ctx);
      curves = [];
      res(img);
    } else {
      img = createElmts(createImageOverCanvas());
      img.src = sendCanvasData.toDataURL();
      img.addEventListener('load', () => {
        insertImage(img, error);
        clearCanvas(canvas, ctx);
        curves = [];
        res(img);
      });
    }
  })
}

function isCreateOverImage() {
  const overImage = document.querySelector('.over-canvas');
  if (overImage) {
    return true;
  }
}

function insertImage(img, beforeInsertingObj) {
  wrap.insertBefore(img, beforeInsertingObj);
}

function transferCanvasInfoToCanvasData() {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const url = canvas.toDataURL();
    img.src = url;
    img.addEventListener('load', () => {
      ctxSendCanvas.drawImage(img, 0, 0);
      resolve(img);
    });
  })
}

function setImageMask(url) {
  let img;

  if (isCreateImageMask()) {
    img = document.querySelector('.image-mask');
    img.src = url;
  } else {
    img = createElmts(createImageMask());
    insertImage(img, error);
    img.src = url;
  }
}

function isCreateImageMask() {
  const overImage = document.querySelector('.image-mask');
  if (overImage) {
    return true;
  }
}

function sendMask() {
  return new Promise((res, rej) => {
    canvas.toBlob(blob => ws.send(blob));
    res();
  });
}

function isClearCanvas(canvas) {
  const blank = document.createElement('canvas');
  blank.width = currentImage.offsetWidth;
  blank.height = currentImage.offsetHeight;

  return canvas.toDataURL() == blank.toDataURL();
}

function debounce(callback, delay = 0) {
  let timeout;
  return () => {
    clearTimeout(timeout);
    timeout = setTimeout(function () {
      timeout = null;
      callback();
    }, delay);
  };
}

const debounceSendMask = debounce(sendCanvasImageData, 1000);

function clearCanvas(canvas, context) {
  context.clearRect(0, 0, canvas.width, canvas.height);
}

function createImageOverCanvas() {
  return {
    tag: 'img',
    cls: 'over-canvas',
    props: {
      width: currentImage.offsetWidth,
      height: currentImage.offsetHeight
    }
  }
}

function createImageMask() {
  return {
    tag: 'img',
    cls: 'image-mask',
    props: {
      width: currentImage.offsetWidth,
      height: currentImage.offsetHeight
    }
  }
}

function setParamForSendCanvasData(canvas) {
  canvas.width = `${currentImage.offsetWidth}`;
  canvas.height = `${currentImage.offsetHeight}`;
}
