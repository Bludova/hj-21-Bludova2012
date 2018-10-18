'use strict';
const menuDrag = document.querySelector('.menu__item.drag');
const appmenu = document.querySelector('.menu');
const maxMenuHeight = appmenu.getBoundingClientRect().height;

let menuCoords, menuDragCoord;

let deltaPosition = {};
let isMoving = false;

menuDrag.addEventListener('mousedown', onClickDown);
document.addEventListener('mousemove',onMove);
document.addEventListener('mouseup', onClickUp);

function onClickDown(event) {
  event.preventDefault();

  isMoving = true;
  deltaPosition.x = event.clientX - menuDragCoord.left + 1; // +1 для того, чтобы при клике на драг не было смещение на единицу
  deltaPosition.y = event.clientY - menuDragCoord.top + 1;

  event.stopPropagation();
}

function onMove(event) {
  event.preventDefault();
  refrashBoundingClientRect();

  if (isMoving) {
    restrict(event);
  }
}

function onClickUp() {
  event.preventDefault();
  isMoving = false;
}

function refrashBoundingClientRect() {
  menuCoords = appmenu.getBoundingClientRect();
  menuDragCoord = menuDrag.getBoundingClientRect();
}

function restrict(event) {
  let top = Math.max(0, Math.min(event.clientY - deltaPosition.y, html.offsetHeight - menuCoords.height));
  let left = Math.max(0, Math.min(event.clientX - deltaPosition.x, html.offsetWidth - menuCoords.width));

  appmenu.style.setProperty('top', `${top}px`);
  appmenu.style.setProperty('left', `${left}px`);

  sessionStorage.startingMenuPositionX = `${left}px`;
  sessionStorage.startingMenuPositionY = `${top}px`;
}