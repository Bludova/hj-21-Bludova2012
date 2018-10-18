'use strict';

document.addEventListener('click', sendComment);
document.addEventListener('click', closeComment);
document.addEventListener('click', createComments);
toggleBg.addEventListener('click', isCommentsVisibility);
document.addEventListener('click', activeFormLogic);

let previousCurrentImageCoords;
currentImage.addEventListener('load', () => {
  previousCurrentImageCoords = currentImage.getBoundingClientRect();
});

function createComments(event) {
  if (
    event.target.classList.contains('comments__marker-checkbox') ||
    menu.dataset.active !== 'comments' ||
    event.target.closest('.menu') === menu ||
    event.target.closest('form') ||
    event.target.dataset.type === 'new-form' ||
    event.target.tagName !== 'CANVAS'
  ) {
    return;
  }

  deleteFormWithoutMessage();
  deleteActiveClass();

  const newComment = createElmts(createCommentsFormNode(event));
  newComment.dataset.type = 'new-form';
  newComment.classList.add('active-form');
  newComment.querySelector('.comments__marker-checkbox').checked = true;
  const commentMarker = newComment.getElementsByClassName('comments__marker')[0];

  wrap.appendChild(newComment);

  const newCommentCSSStyle = window.getComputedStyle(commentMarker);
  newComment.style.top = `${parseFloat(newComment.style.top) - (commentMarker.offsetHeight / 2)}px`;
  newComment.style.left = `${parseFloat(newComment.style.left) - (commentMarker.offsetWidth / 2) - (parseFloat(newCommentCSSStyle.left))}px`;
}

function deleteFormWithoutMessage() {
  const commentsForm = document.querySelectorAll('.comments__form');
  commentsForm.forEach(commentForm => {
    if (!isComment(commentForm) || commentForm.dataset.type === 'new-form' ) {
      commentForm.parentElement.removeChild(commentForm);
    }
  });
}

function isComment(cmt) {
  const msg = cmt.querySelector('[data-type="message"]');
  if (msg) {
    return true
  }
}

function closeComment(event) {
  if (event.target.classList.contains('comments__close')) {
    const formTag = event.target.closest('form').querySelector('.comments__marker-checkbox');
    formTag.checked = false;
    deleteFormWithoutMessage();
  }
}

function sendComment(event) {
  const target = event.target;
  const currentImageCoordsData = currentImage.getBoundingClientRect();

  if (target.classList.contains('comments__submit')) {
    event.preventDefault();

    const formTag = target.closest('form');
    const commentInput = formTag.querySelector('.comments__input');

    if (commentInput.value.trim() === '' || typeof commentInput.value === 'undefined') {
      return;
    }

    lastActiveForm = formTag;

    const sendStr = `message=${encodeURIComponent(formTag.querySelector('.comments__input').value)}&top=${parseFloat(formTag.style.top) - currentImageCoordsData.top}&left=${parseFloat(formTag.style.left) - currentImageCoordsData.left}`;
    loaderOn(formTag);
    transferCommentData(sendStr)
      .then((res) => {
        if (res.status === 200 ) {
          loaderOff(formTag);
          clearTextarea(formTag);
          return res;
        } else {
          throw 'Не удалось отправить сообщение'
        }
      })
      .then(rspnsJSN)
      .then(setLastFormStateActive)
      .then(deleteFormWithoutMessage)
  }
}

function loaderOn(form) {
  const loader = form.querySelector('.loader');
  loader.classList.add('on');
}

function loaderOff(form) {
  const loader = form.querySelector('.loader');
  loader.classList.remove('on');
}

function clearTextarea(form) {
  const commentInput = form.querySelector('.comments__input');
  commentInput.value = '';
}

function transferCommentData(data) {
  return fetch(`${urlApiNeto}/pic/${currentImage.dataset.id}/comments`, {
    body: data,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
}

function createCommentNode(cmntData) {
  return {
    tag: 'div',
    cls: 'comment',
    dataAtr: {
      type: 'message'
    },
    id: cmntData.id,
    content: [
      {
        tag: 'p',
        cls: 'comment__time',
        content: `${new Date(cmntData.timestamp).toLocaleDateString()} ${new Date(cmntData.timestamp).toLocaleTimeString()}`
      },
      {
        tag: 'p',
        cls: 'comment__message',
        content: cmntData.message
      }
    ]
  }
}

function isCommentsVisibility(event) {
  if (event.target.value === 'off') {
    document.querySelectorAll('.comments__form').forEach(comment => {
      comment.classList.add('comments-hidden');
    })
  } else {
    document.querySelectorAll('.comments__form').forEach(comment => {
      comment.classList.remove('comments-hidden');
    })
  }
}

function commentVisibilityStatus() {
  const menuToggleOn = document.getElementById('comments-off');

  if (menuToggleOn.checked === true) {
    return 'comments-hidden';
  } else {
    return '';
  }
}

function conversionJsonCmmnt(obj) {
  if (obj.event === 'pic') {
    const data = obj.pic.comments;

    let keys = Object.keys(data);
    return keys.map(key => {
      data[key].id = key;
      return data[key];
    });
  } else if (obj.comments){

    const data = obj.comments;

    let keys = Object.keys(data);
    return keys.map(key => {
      data[key].id = key;
      return data[key];
    });
  } else {
    return obj.comment;
  }
}


function addComments(element, objData) {
  const msg = createElmts(createCommentNode(objData));
  const cmtsBody = element.querySelector('.comments__body');
  const postElement = cmtsBody.querySelector('.loader').parentElement;

  cmtsBody.insertBefore(msg, postElement);
}

function setComments(response) {
  const newCmnts = conversionJsonCmmnt(response);

  const fragment = [].concat(newCmnts).reduce((f, cmt) => {
    if (isWrapAppSameComment(cmt)) {
      const element = isWrapAppSameComment(cmt);
      if (isThereSameComment(element, cmt)) {
        addComments(isThereSameComment(isWrapAppSameComment(cmt), cmt), cmt);
      }

      return f;
    }

    if (isInFragmentSameComment(cmt, f) && typeof f !== 'undefined') {
      addComments(isInFragmentSameComment(cmt, f), cmt);

      return f;
    }

    const newForm = createElmts(createCommentsFormFromWS(cmt));

    addComments(newForm, cmt);
    f.appendChild(newForm);

    return f;
  }, document.createDocumentFragment());

  wrap.appendChild(fragment);
}

function isWrapAppSameComment(data) {
  const element = document.querySelector(`[style="top: ${data.top + previousCurrentImageCoords.top}px; left: ${data.left + previousCurrentImageCoords.left}px;"]`);
  const message = element ? element.querySelector('[data-type="message"]') : null;

  if (element && message) {
    return element;
  } else {
    return false;
  }
}

function isInFragmentSameComment(data, fragment) {
  const element = fragment.querySelector(`[style="top: ${data.top + previousCurrentImageCoords.top}px; left: ${data.left + previousCurrentImageCoords.left}px;"]`);
  if (element && element !== null) {
    return element;
  } else {
    return false;
  }
}

function isThereSameComment(element, data) {
  if (element) {
    if (Array.from(element.querySelectorAll('[data-type="message"]')).some(comment => comment.id === data.id)) {
      return false;
    }

    return element;
  }
}

function setLastFormStateActive() {
  deleteActiveClass();
  removeCheckedStatusForms();

  if (lastActiveForm.dataset.type === 'new-form') {
    const lastForm = Array.from(document.querySelectorAll('.comments__form')).pop();
    lastForm.querySelector('.comments__marker-checkbox').checked = true;
    lastForm.classList.add('active-form');
  } else {
    lastActiveForm.querySelector('.comments__marker-checkbox').checked = true;
    lastActiveForm.classList.add('active-form');
  }
}

function activeFormLogic(event) {
  const target = event.target;

  if (target.classList.contains('comments__marker-checkbox')) {
    const form = target.closest('form');
    const input = form.querySelector('.comments__marker-checkbox');

    if (form.dataset.type === 'new-form') {
      event.preventDefault();
      return;
    }

    if (target.checked === true) {
      deleteFormWithoutMessage();
      removeCheckedStatusForms();
      deleteActiveClass();
      input.checked = true;
      form.classList.add('active-form');
      goScroll(form, 'top');
    } else {
      deleteActiveClass();
    }
  }
}

function goScroll(form, str) {
  const cmntBody = form.querySelector('.comments__body');
  if (str === 'top') {
    cmntBody.scrollTop = 0;
  } else {
    cmntBody.scrollTop = cmntBody.scrollHeight;
  }
}

function removeCheckedStatusForms () {
  document.querySelectorAll('.comments__marker-checkbox').forEach(input => {
    input.checked = false;
    input.classList.remove('active-form');
  })
}

function deleteActiveClass() {
  document.querySelectorAll('form.active-form').forEach(form => {
    setCheckedState(form, false);
    form.classList.remove('active-form');
  })
}

function setCheckedState(el, boolean) {
  el.querySelector('.comments__marker-checkbox').checked = boolean;
}

function createCommentsFormNode(mouseEvent) {
  return {
    tag: 'form',
    cls: `comments__form`,
    style: {
      top: `${mouseEvent.clientY}px`,
      left: `${mouseEvent.clientX}px`,
    },
    content: [
      {
        tag: 'span',
        cls: 'comments__marker'
      },
      {
        tag: 'input',
        cls: 'comments__marker-checkbox',
        props: { type: 'checkbox'}
      },
      {
        tag: 'div',
        cls: 'comments__body',
        content: [
          {
            tag: 'div',
            cls: 'comment',
            content: [
              {
                tag: 'div',
                cls: 'loader',
                content: [
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  }
                ]
              }
            ]
          },
          {
            tag: 'textarea',
            cls: 'comments__input',
            props: {
              type: "text",
              placeholder: "Напишите ответ..."
            }
          },
          {
            tag: 'input',
            cls: 'comments__close',
            props: {
              type: "button",
              value: "Закрыть"
            }
          },
          {
            tag: 'input',
            cls: 'comments__submit',
            props: {
              type: "submit",
              value: "Отправить"
            }
          }
        ]
      }
    ]
  }
}

function createCommentsFormFromWS(data) {
  const currentImageCoordsData = currentImage.getBoundingClientRect();
  return {
    tag: 'form',
    cls: `comments__form ${commentVisibilityStatus()}`,
    style: {
      top: `${data.top + currentImageCoordsData.top}px`,
      left: `${data.left + currentImageCoordsData.left}px`,
    },
    content: [
      {
        tag: 'span',
        cls: 'comments__marker'
      },
      {
        tag: 'input',
        cls: 'comments__marker-checkbox',
        props: { type: 'checkbox'}
      },
      {
        tag: 'div',
        cls: 'comments__body',
        content: [
          {
            tag: 'div',
            cls: 'comment',
            content: [
              {
                tag: 'div',
                cls: 'loader',
                content: [
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  },
                  {
                    tag: 'span'
                  }
                ]
              }
            ]
          },
          {
            tag: 'textarea',
            cls: 'comments__input',
            props: {
              type: "text",
              placeholder: "Напишите ответ..."
            }
          },
          {
            tag: 'input',
            cls: 'comments__close',
            props: {
              type: "button",
              value: "Закрыть"
            }
          },
          {
            tag: 'input',
            cls: 'comments__submit',
            props: {
              type: "submit",
              value: "Отправить"
            }
          }
        ]
      }
    ]
  }
}
