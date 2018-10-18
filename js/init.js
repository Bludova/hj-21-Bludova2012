'use strict';
window.addEventListener('load', createInputForDownloadImg);
window.addEventListener('resize', adjustmentMenuPosition);
window.addEventListener('resize', canvasResize);
window.addEventListener('load', init);

window.addEventListener('resize', commentsReposition);

function commentsReposition() {
  let coord = currentImage.getBoundingClientRect();
  const forms = document.querySelectorAll('.comments__form');

  if (forms[0] === undefined || previousCurrentImageCoords === undefined) {
    return;
  }

  forms.forEach(form => {
    const styleLeft = parseFloat(form.style.left);
    const styleTop = parseFloat(form.style.top);

    form.style.left = `${styleLeft + (coord.left - previousCurrentImageCoords.left)}px`;
    form.style.top = `${styleTop + (coord.top - previousCurrentImageCoords.top)}px`;
  });

  previousCurrentImageCoords = currentImage.getBoundingClientRect();
}

function init() {
  checkHrefAndLoadInfo();
}

function canvasResize(event) {
  const imgCoords = currentImage.getBoundingClientRect();
  canvas.style.top = `${imgCoords.top}px`;
  canvas.style.left = `${imgCoords.left}px`;
}

function adjustmentMenuPosition(event) {
  menuResize(event);
}

function checkHrefAndLoadInfo() {
  const regexp = /id=?/;
  let id;

  if (regexp.test(window.location.href)) {
    id = window.location.href.split(regexp).pop();
    menuUrl.value = sessionStorage.linkShare ? sessionStorage.linkShare : getClearHrefWhitoutIdInfo() + '?id=' + window.location.href.split(regexp).pop();

    getInfoAboutImg(id)
      .then(checkStatusAboutGIAI)
      .then(rspnsJSN)
      .then(processingData)
  } else if (sessionStorage.currentDataId){
    primeryImgValues();
    primeryMenuPosition();
    primeryStatusApp();
    openWebSocket();
  } else {
    primeryImgValues();
    primeryMenuPosition();
    primeryStatusApp();
  }
}

function getInfoAboutImg(id) {
  return fetch(`${urlApiNeto}/pic/${id}`)
}

function checkStatusAboutGIAI(response) {
  if (response.status === 200) {
    return response;
  } else {
    throw `${response.message}`;
  }
}

function processingData(data) {
  return new Promise(resolve => {
    installImg(data)
      .then(setCanvas);
    onComments();
    menuResize();
    openWebSocket();
  })
}

function primeryImgValues() {
  currentImage.src = sessionStorage.currentSrcImg ? sessionStorage.currentSrcImg : '';
  currentImage.dataset.id = sessionStorage.currentDataId ? sessionStorage.currentDataId : '';
  currentImage.dataset.disabled = sessionStorage.disabled ?  sessionStorage.disabled : false;
  currentImage.setAttribute('alt', sessionStorage.currentTitle ? sessionStorage.currentTitle : '');
}

function primeryMenuPosition() {
  if (sessionStorage.startingMenuPositionY && sessionStorage.startingMenuPositionX) {
    menu.style.top = sessionStorage.startingMenuPositionY;
    menu.style.left = sessionStorage.startingMenuPositionX;
  }
}

function primeryStatusApp() {
  if (typeof currentImage.dataset.id !== 'undefined' && currentImage.dataset.id !== '') {
    onShare();
    menuResize();
    setCanvas();
    menuUrl.value = sessionStorage.linkShare ? sessionStorage.linkShare : 'http://2mlfg4vp';
  } else {
    initials();
    menuResize();
  }
}
