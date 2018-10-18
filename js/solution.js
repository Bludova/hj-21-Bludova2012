'use strict';
const urlApiNeto = 'https://neto-api.herokuapp.com';
const urlWssNeto = 'wss://neto-api.herokuapp.com/pic';

const menu = document.querySelector('.menu');
const burger = document.querySelector('.burger');
const menuNewPic = document.querySelector('.new');
const html = document.querySelector('html');
const wrap = document.querySelector('.wrap.app');
const error = document.querySelector('.error');
const comments = document.querySelector('.comments');
const draw = document.querySelector('.draw');

const currentImage = document.querySelector('.current-image');


const share = document.querySelector('.share');
const shareTools = document.querySelector('.share-tools');
const menuUrl = shareTools.querySelector('.menu__url');
const shareMenuCopy = document.querySelector('.menu_copy');

const imageLoader = document.querySelector('.image-loader');


const errorFileType = 'Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.';
const errorMoreDrag = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом ';

// comments
const toggleBg = document.querySelector('.menu__toggle-bg');
let lastActiveForm;


let ws;
// canvas
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
const sendCanvasData = document.createElement('canvas');
const ctxSendCanvas = sendCanvasData.getContext('2d');

const drawTools = document.querySelector('.draw-tools');
const BRUSH_RADIUS = 4;

let curves = [];
let drawing = false;
let needsRepaint = false;
let globalDrawingStatus = false;
//

burger.addEventListener('click', onBurger);
comments.addEventListener('click', onComments);
draw.addEventListener('click', onDraw);
share.addEventListener('click', onShare);
menu.addEventListener('click', forMenuResize);
menu.addEventListener('click', (event) => {
  errorsOff();
  removeIllumClasFromNew();
});
shareMenuCopy.addEventListener('click', hrefCopy);

wrap.addEventListener('drop', onDropImg);
wrap.addEventListener('dragover', (event) => {event.preventDefault()});

function initials() {
  document.querySelector('.menu').dataset.state = 'initial';
  menuResize();
}

function defaults() {
  document.querySelector('.menu').dataset.state = 'default';
  menuResize();
}

function selecteds() {
  document.querySelector('.menu').dataset.state = 'selected';
  menuResize();
}

function onDropImg(event) {
  event.preventDefault();

  clearDataStatus();
  setOrRemoveDisabled();

  if ((event.dataTransfer.files[0].type !== 'image/jpeg') && (event.dataTransfer.files[0].type !== 'image/png')) {
    errorsOn('incorrect-format');
    return;
  }

  if (currentImage.dataset.disabled === false || currentImage.dataset.disabled === 'false') {
    sendFile(event.dataTransfer, 1);
  } else {
    errorsOn('to-download');
  }

}

function setOrRemoveDisabled() {
  if (typeof currentImage.dataset.id !== 'undefined' && currentImage.dataset.id !== '') {
    currentImage.dataset.disabled = true;
  } else {
    currentImage.dataset.disabled = false;
  }
}

function onBurger(event) {
  clearDataStatus();
  defaults();
  deleteFormWithoutMessage();
  menu.dataset.active = '';
}

//обработка размера меню
function forMenuResize(event) {
  if (menu.contains(event.target)) {
    menuResize();
  }
}

function menuResize(event) {
  let rate;
  const currentMenuRigth = menu.getBoundingClientRect().right;

  if (currentMenuRigth > html.offsetWidth) {
    const li = [...menu.querySelectorAll('li')];
    const size = li.reduce((fullSize, el) => {
      return fullSize + el.offsetWidth;
    }, 0);

    rate = Math.max(0, html.clientWidth - size - parseFloat(window.getComputedStyle(menu).borderWidth) * 2);

    menu.style.left = `${rate}px`;
  }
}

function onComments(event) {
  clearDataStatus();
  selecteds();
  menu.dataset.active = 'comments';
  if (!event) {
    comments.dataset.state = 'selected';
  } else {
    event.currentTarget.dataset.state = 'selected';
  }
}

function onDraw(event) {
  clearDataStatus();
  selecteds();
  menu.dataset.active = 'draw';
  event.currentTarget.dataset.state = 'selected';
}

function onShare(event) {
  clearDataStatus();
  selecteds();
  menu.dataset.active = 'share';
  if (!event) {
    share.dataset.state = 'selected';
  } else {
    event.currentTarget.dataset.state = 'selected';
  }
}

function removeInputInDwnldNewImg() {
  const input = menuNewPic.querySelector('input');
  if (input) {
    input.parentElement.removeChild(input);
  }
}

function publication() {
  clearDataStatus();
  document.querySelector('.menu').dataset.state = 'initial';
}

function clearDataStatus() {
  document.querySelectorAll('.menu [data-state]').forEach(el => {
    el.dataset.state = '';
  })
}

// Загрузка изображения
function installImg(data) {
  return new Promise((resolve, reject) => {
    currentImage.src = data.url;
    currentImage.dataset.id = data.id;
    currentImage.setAttribute('alt', data.title);

    sessionStorage.currentSrcImg = data.url;
    sessionStorage.currentDataId = data.id;
    sessionStorage.currentTitle = data.title;
    resolve(data);
  })
}

function createInputForDownloadImg(event) {
  if (menuNewPic.querySelector('input')) {
    return;
  }

  const link = createElmts(linkElement());
  link.addEventListener('change', onSendingRequest);

  menuNewPic.appendChild(link);
}

function onSendingRequest(event) {
  event.preventDefault();

  if (!event.target.files[0]) {
    return;
  }

  if (event.target.files[0] && (event.target.files[0].type !== 'image/jpeg') && (event.target.files[0].type !== 'image/png')) {
    errorsOn('incorrect-format');
    return;
  }

  sendFile(event.target, 2);
}

function sendFile(file) {
  errorOff();

  createFormData(file.files[0])
    .then(sendImg)
    .then((res, err) => {
      if (res) {
        if (res.status === 200) {
          imageLoaderOff();
          currentImage.classList.remove('image-hidden');
          currentImage.dataset.disabled = true;
          sessionStorage.disabled = true;
          return res;
        } else {
          throw `${res.status}`;
        }
      }
    })
    .then(rspnsJSN)
    .then(data => {
      installImg(data)
        .then((res) => {
          setCanvas();
        });
      onShare();
      menuResize();
      setShareHref();
      openWebSocket();
    })
    .catch(err => {
      errorsOn('none', err);
    })
}

function createFormData(data) {
  const reg = /(\.jpg|\.png)/;
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('title', `${data.name.split(reg)[0]}`);
    formData.append('image', data);

    resolve(formData)
  })
}

function sendImg(fd) {
  imageLoaderOn();
  return fetch(`${urlApiNeto}/pic`, {
    method: 'POST',
    body: fd
  })
  .catch((err) => {
    throw 'Не удалось загрузить изображение. Попробуйте загрузить позднее';
  })
}

function rspnsJSN(data) {
  return data.json();
}

function errorsOn(errorNum, data = {}) {
  const errorContent = document.querySelector('.error__message');

  if (errorNum === 'incorrect-format') {
    if (isInstalledImg()) {
      defaults();
      addIllumClassForNew();
    } else {
      initials();
    }

    errorContent.textContent = errorFileType;
  } else if (errorNum === 'to-download') {
    defaults();
    addIllumClassForNew();
    errorContent.textContent = `${errorMoreDrag} ${String.fromCharCode(171)}Загрузить новое${String.fromCharCode(187)} в меню.`;
  } else {
    errorContent.textContent = `${data}`;
  }

  imageLoaderOff();
  errorOn();
}

function isInstalledImg() {
  if (typeof currentImage.dataset.id !== 'undefined' && currentImage.dataset.id !== '') {
    return true;
  } else {
    return false;
  }
}

function errorsOff() {
  const errorContent = document.querySelector('.error__message');
  errorContent.textContent = '';
  errorOff();
}

function addIllumClassForNew() {
  if (menuNewPic.classList.contains('illumination')) {
    return;
  } else {
    menuNewPic.classList.add('illumination');
  }
}

function removeIllumClasFromNew() {
  menuNewPic.classList.remove('illumination');
}

function imageLoaderOn() {
  const loader = imageLoader.querySelector('.loader');
  loader.classList.add('on');
  imageLoader.classList.add('on');
}

function imageLoaderOff() {
  const loader = imageLoader.querySelector('.loader');
  loader.classList.remove('on');
  imageLoader.classList.remove('on');
}

function errorOn() {
  error.classList.add('on');
}

function errorOff() {
  error.classList.remove('on');
}

function setShareHref() {
  const regexp = /id=?/;
  let link;

  if (regexp.test(window.location.href)) {
    link = getClearHrefWhitoutIdInfo() + '?id=' + currentImage.dataset.id;
  } else {
    link = window.location.href + '?id=' + currentImage.dataset.id;
  }

  menuUrl.value = link;
  sessionStorage.linkShare = link;
}

function getClearHrefWhitoutIdInfo() {
  const regexp = /id=?/;
  const indexStartIdInfo = window.location.href.indexOf('?id=');

  return window.location.href.slice(0, indexStartIdInfo);
}

function hrefCopy(event) {
  const url = document.querySelector('.menu__url').value;
  copyText(url);
}

function copyText(text) {
  const range = document.createRange();
  const tmpElem = document.createElement('div');
  tmpElem.style.position = 'absolute';
  tmpElem.left = '-1000px';
  tmpElem.top = '-1000px';
  tmpElem.textContent = text;

  document.body.appendChild(tmpElem);
  range.selectNodeContents(tmpElem);

  let selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);

  document.execCommand('copy', false, null);

  tmpElem.remove();
}

function createElmts(node) {
  if ((typeof node === 'undefined') || (node === null) ||(node === false)) {
    return document.createTextNode('');
  }

  if ((typeof node === 'string') || (typeof node === 'number') || (node === true)) {
    return document.createTextNode(node);
  }

  if (Array.isArray(node)) {
    return node.reduce((f, el) => {
      f.appendChild(createElmts(el));
      return f;
    }, document.createDocumentFragment())
  }

  const element = document.createElement(node.tag);

  if (node.cls) {
    [].concat(node.cls.split(" ")).filter(Boolean).forEach( className => {
      element.classList.add(className);
    });
  }

  if (node.id) {
    element.id = node.id;
  }

  if (node.dataAtr) {
    Object.keys(node.dataAtr).forEach(key => {
      element.dataset[key] = node.dataAtr[key];
    })
  }

  if (node.props) {
    Object.keys(node.props).forEach(key => {
      element.setAttribute(key, node.props[key]);
    });
  }

  if (node.style) {
    Object.keys(node.style).forEach(key => {
      element.style[key] = node.style[key]
    });
  }

  element.appendChild(createElmts(node.content));
  return element;
}

function linkElement() {
  return {
    tag: 'input',
    cls: 'for-file-img',
    props: {
      type: 'file',
      accept: 'image/jpeg, image/png',
      title: 'Загрузите изображение'
    },
    style: {
      width: `${window.getComputedStyle(menuNewPic).width}`,
      height: `${window.getComputedStyle(menuNewPic).height}`,
    }
  }
}

// WebSocket
function openWebSocket() {
  ws = new WebSocket(`${urlWssNeto}/${currentImage.dataset.id}`);
  ws.addEventListener('open', openWs);
  ws.addEventListener('message', messageWs);
  ws.addEventListener('error', errorWs);
  ws.addEventListener('close', (event) => {
    console.log(event, 'close');
  });
}

function openWs(event) {
  console.log(event, 'open');
}

function messageWs(event) {
  const data = JSON.parse(event.data);

  if (data.event === 'pic') {
    if (data.pic.comments) {
      setComments(data);
    }

    if (data.pic.mask) {
      setImageMask(data.pic.mask);
    }
  }

  if (data.event === 'mask') {
    setImageMask(data.url);
  }

  if (data.event === 'comment') {
    setComments(data);

    let currentForm;
    let currentInput;

    if (isWrapAppSameComment(data.comment)) {
      currentForm = isWrapAppSameComment(data.comment);
      currentInput = currentForm.querySelector('.comments__marker-checkbox');
    } else {
      const cmntFrms = document.querySelectorAll('.comments__form');
      const lastIndexCmntForm = cmntFrms.length - 1;

      currentForm = cmntFrms[lastIndexCmntForm];
      currentInput = currentForm.querySelector('.comments__marker-checkbox');
    }

    removeCheckedStatusForms();
    deleteActiveClass();

    currentForm.classList.add('active-form');
    currentInput.checked = true;
    goScroll(currentForm);
  }
}

function errorWs(event) {
  console.log(event, 'error');
}
