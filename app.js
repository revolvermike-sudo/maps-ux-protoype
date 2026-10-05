import { places } from './places.js?v=fun-section-1';
import { placeDetails } from './place-details.js';
import { googleTile, renderGoogleSections, googleSections } from './google-feed.js?v=fun-section-1';

const asset = file => 'public/assets/figma/' + file;
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const icon = (file, small = false) => '<img class="icon' + (small ? ' icon--16' : '') + '" src="' + asset(file) + '" alt="">';
const photo = (place, index = 0) => 'public/assets/places/' + place.id + '-' + (index % place.photos.length) + '.jpg';
const count = value => value ? new Intl.NumberFormat('ru-RU').format(value) : '';
const byId = id => places.find(place => place.id === id);
const categories = [
  { id: 'all', title: 'Для вас', emoji: '' },
  { id: 'summer', title: 'Продлить лето', emoji: '🌤' },
  { id: 'food', title: 'Поесть', emoji: '🥗' },
  { id: 'walk', title: 'Погулять', emoji: '🌳' },
  { id: 'kids', title: 'С детьми', emoji: '🧸' },
  { id: 'fun', title: 'Развлечься', emoji: '🎤' },
  { id: 'drink', title: 'Выпить', emoji: '🍷' }
];
const subtitles = {
  harvest: 'Сезонные овощи в центре внимания',
  happiness: 'Ресторан с видом на Исаакиевский собор',
  teplo: 'Домашняя кухня и тихий внутренний дворик',
  duo: 'Гастробар на Кирочной улице',
  tartarbar: 'Современная кухня на Виленском переулке',
  birch: 'Авторская кухня в центре Петербурга',
  'new-holland': 'Прогулки и события на острове',
  'summer-garden': 'Фонтаны, скульптуры и тенистые аллеи',
  sevkabel: 'Прогулка по набережной у залива',
  sight: 'Панорама Невы и центра города',
  coffe3: 'Кофе и завтраки в петербургском дворе',
  more: 'Кофейня на Петроградской стороне'
};
const screens = { map: document.querySelector('#map-screen'), feed: document.querySelector('#feed-screen'), place: document.querySelector('#place-screen') };
screens.discovery = document.querySelector('#discovery-screen');
const discoveryGrid = document.querySelector('#discovery-grid');
const discoverySheet = document.querySelector('.discovery-sheet');
const discoveryScroll = document.querySelector('.discovery-scroll');
const discoveryDrag = document.querySelector('#discovery-drag');
const discoverySearch = document.querySelector('.discovery-search input');
let discoveryPlaces = [];
let discoveryExpanded = false;
const feedScroll = document.querySelector('#feed-scroll');
const grid = document.querySelector('#tile-grid');
const intents = document.querySelector('#intents');
const search = document.querySelector('#search');
const savedButton = document.querySelector('#toggle-saved');
const header = document.querySelector('.feed-header');
const homePreview = document.querySelector('#home-preview');
const googleFeed = document.querySelector('#google-feed');
const googleHomePreview = document.querySelector('#google-home-preview');
let activeTest = '1';
let activeScreen = 'map';
let category = 'all';
let savedOnly = false;
let currentPlace = null;
let returnScreen = 'feed';
let toastTimer;
const tilePhotos = new Map();
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let suppressedTileClick = null;
let saved = new Set();
try { saved = new Set(JSON.parse(sessionStorage.getItem('saved-places') || '[]')); } catch {}

function resizeDevice() {
  document.documentElement.style.setProperty('--device-scale', String(Math.min(1, Math.max(.3, (innerHeight - 48) / 812))));
}
resizeDevice();
window.addEventListener('resize', resizeDevice);

function showScreen(name) {
  activeScreen = name;
  for (const [key, element] of Object.entries(screens)) {
    element.classList.toggle('is-hidden', key !== name);
    element.setAttribute('aria-hidden', String(key !== name));
    element.inert = key !== name;
  }
  document.querySelector('#toast').hidden = true;
}
function notify(message) {
  const node = document.querySelector('#toast');
  node.textContent = message;
  node.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { node.hidden = true; }, 2600);
}
function matchesCategory(place) {
  if (category === 'all') return true;
  if (category === 'summer') return ['new-holland', 'summer-garden', 'sevkabel', 'sight', 'teplo', 'happiness'].includes(place.id);
  if (category === 'kids') return ['new-holland', 'summer-garden', 'teplo', 'sevkabel'].includes(place.id);
  if (category === 'drink') return ['happiness', 'tartarbar', 'duo', 'birch'].includes(place.id);
  return place.tags.includes(category);
}
function renderIntents() {
  if (intents.children.length) {
    intents.querySelectorAll('[data-category]').forEach(button => {
      const selected = button.dataset.category === category;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    return;
  }
  const left = intents.scrollLeft;
  intents.innerHTML = categories.map(item => `<button type="button" class="intent ${item.id === category ? 'is-active' : ''}" role="tab" aria-selected="${item.id === category}" data-category="${item.id}">${item.emoji ? '<span class="intent-emoji" aria-hidden="true">' + item.emoji + '</span>' : ''}<span>${item.title}</span></button>`).join('');
  intents.scrollLeft = left;
}
function stepperDots(place, index) {
  const visible = Math.min(3, place.photos.length);
  const start = Math.max(0, Math.min(index - 1, place.photos.length - visible));
  return Array.from({length:visible}, (_,i) => '<i class="' + (start+i === index ? 'is-current' : '') + '"></i>').join('');
}
function tile(place, preview = false) {
  const index = tilePhotos.get(place.id) || 0;
  const rubric = place.tags.includes('coffee') ? '435e0.svg' : place.tags.includes('food') ? '61cfa.svg' : '61e71.svg';
  return `<article class="place-tile" data-tile-id="${place.id}" data-photo-index="${index}" data-figma-node="6039:33050">
    <button type="button" class="tile-link" data-place-id="${place.id}" aria-label="Открыть: ${esc(place.name)}"></button>
    <div class="tile-visual" data-component="Base">
      <div class="tile-photo-track" style="transform:translateX(-${index * 100}%)">${place.photos.map((_,i) => '<img class="tile-photo" src="' + photo(place,i) + '" alt="" draggable="false" loading="' + (preview && i === index ? 'eager' : 'lazy') + '">').join('')}</div>
      ${!preview && place.rating ? '<span class="tile-rating"><img src="' + asset(rubric) + '" alt="">' + esc(place.rating) + '</span>' : ''}
      ${!preview ? '<span class="tile-more"><img src="' + asset('bb003.svg') + '" alt=""></span>' : ''}
      <button type="button" class="tile-save" data-save="${place.id}" aria-label="${saved.has(place.id) ? 'Убрать из сохранённых: ' : 'Сохранить: '}${esc(place.name)}" aria-pressed="${saved.has(place.id)}">${icon(saved.has(place.id) ? '46093.svg' : '0b299.svg')}</button>
      <span class="tile-stepper" aria-hidden="true">${stepperDots(place,index)}</span>
    </div>
    <div class="tile-text" data-component="Text">
      <p class="tile-description">${esc(subtitles[place.id])}</p>
      <h2 class="tile-name">${esc(place.name)}</h2>
      <p class="tile-location"><span>${esc(place.metro ? 'м. ' + place.metro : place.address.replace('Санкт-Петербург, ', ''))}</span>${place.distance ? '<span>· ' + esc(place.distance) + '</span>' : ''}</p>
    </div>
  </article>`;
}
function filteredPlaces() {
  const query = search.value.trim().toLocaleLowerCase('ru');
  return places.filter(place => matchesCategory(place) && (!savedOnly || saved.has(place.id)) && (!query || [place.name, place.category, place.address].some(value => value.toLocaleLowerCase('ru').includes(query))));
}
function renderFeed(resetScroll = true) {
  const displayed = filteredPlaces();
  grid.innerHTML = displayed.length ? displayed.map(place => tile(place)).join('') : '<p class="empty-state">' + (savedOnly ? 'Здесь появятся сохранённые места' : 'Места не найдены. Попробуйте другой запрос.') + '</p>';
  renderIntents();
  savedButton.setAttribute('aria-pressed', String(savedOnly));
  if (resetScroll) feedScroll.scrollTop = 0;
  updateHeader();
}
function updateHeader() {
  const scrolling = feedScroll.scrollTop > 0;
  header.classList.toggle('is-scrolling', scrolling);
  header.dataset.figmaNode = activeTest === '2' ? (scrolling?'6028:28152':'6028:28121') : (scrolling ? '6049:33192' : '6049:33191');
}
function toggleSaved(id) {
  saved.has(id) ? saved.delete(id) : saved.add(id);
  try { sessionStorage.setItem('saved-places', JSON.stringify([...saved])); } catch {}
  renderFeed(false);
  homePreview.innerHTML = places.slice(0,3).map(place => tile(place, true)).join('');
  if (activeScreen === 'discovery') renderDiscoveryPlaces();
}
function renderDiscoveryPlaces() {
  const query = discoverySearch.value.trim().toLocaleLowerCase('ru');
  const items = discoveryPlaces.filter(place => !query || [place.name,place.category,place.address].some(value => value.toLocaleLowerCase('ru').includes(query)));
  discoveryGrid.innerHTML = items.length ? items.map(place => tile(place)).join('') : '<p class="empty-state">Места не найдены</p>';
}
function expandDiscovery(expanded) {
  discoveryExpanded = expanded;
  discoverySheet.classList.toggle('is-expanded', expanded);
  discoverySheet.style.removeProperty('transform');
  discoveryDrag.setAttribute('aria-expanded', String(expanded));
  discoveryDrag.setAttribute('aria-label', expanded ? 'Свернуть ленту на карте' : 'Развернуть ленту на карте');
}
function openDiscovery(sectionId = null) {
  if (sheetAnimating || sheetMotion) return;
  const id = sectionId || category;
  const title = sectionId ? googleSections.find(item => item.id === id)?.title : (savedOnly ? 'Сохранённые места' : categories.find(item => item.id === id)?.title);
  discoveryPlaces = sectionId ? places.filter(place => place.tags.includes(id)) : filteredPlaces();
  document.querySelector('#discovery-title').textContent = id === 'all' && !savedOnly ? 'Рекомендации для вас' : title || 'Кафе';
  const mapId = ({summer:'all',coffee:'food'})[id] || id;
  const map = screens.discovery.querySelector('.discovery-map');
  map.src = 'public/assets/discovery-' + (['all','food','walk','kids','fun','drink'].includes(mapId) ? mapId : 'all') + '.png';
  map.alt = 'Карта: ' + (title || 'Рекомендации для вас');
  screens.discovery.dataset.category = id;
  discoverySearch.value = '';
  discoverySearch.parentElement.hidden = true;
  document.querySelector('#discovery-search-toggle').setAttribute('aria-expanded','false');
  renderDiscoveryPlaces();
  // Begin at the full feed's position, then lower the same-sized sheet over the map.
  discoverySheet.classList.add('is-dragging');
  expandDiscovery(true);
  discoveryScroll.scrollTop = 0;
  showScreen('discovery');
  discoverySheet.getBoundingClientRect();
  discoverySheet.classList.remove('is-dragging');
  expandDiscovery(false);
  if (!reduceMotion()) map.animate([{opacity:.45},{opacity:1}], {duration:440,easing:'ease-out'});
}
function closeDiscovery() {
  category = 'all'; savedOnly = false; search.value = ''; intents.scrollLeft = 0;
  renderFeed();
  showScreen('map');
}
document.querySelector('#discovery-close').addEventListener('click', closeDiscovery);
document.querySelector('#discovery-title').addEventListener('click', () => expandDiscovery(!discoveryExpanded));
document.querySelector('#discovery-search-toggle').addEventListener('click', event => {
  const visible = discoverySearch.parentElement.hidden;
  discoverySearch.parentElement.hidden = !visible;
  event.currentTarget.setAttribute('aria-expanded',String(visible));
  if (visible) { expandDiscovery(true); discoverySearch.focus(); }
  else { discoverySearch.value = ''; renderDiscoveryPlaces(); }
});
discoverySearch.addEventListener('input', () => { renderDiscoveryPlaces(); discoveryScroll.scrollTop = 0; });
// The same draggable, keyboard-operable shutter in both research variants.
let discoveryGesture = null;
let discoverySuppressClick = false;
discoveryDrag.addEventListener('keydown', () => { discoverySuppressClick = false; });
discoveryDrag.addEventListener('click', () => {
  if (!discoverySuppressClick) expandDiscovery(!discoveryExpanded);
  discoverySuppressClick = false;
});
discoveryDrag.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  discoverySuppressClick = false;
  const bounds = screens.discovery.getBoundingClientRect();
  const scale = bounds.height/screens.discovery.clientHeight;
  const top = (discoverySheet.getBoundingClientRect().top-bounds.top)/scale;
  discoveryGesture = {y:event.clientY, top, scale, expanded:discoveryExpanded, moved:false};
  // Interrupt an in-flight transition at its visible position, without a jump.
  discoverySheet.classList.add('is-dragging');
  discoverySheet.style.transform = `translateY(${top-74}px)`;
  discoveryDrag.setPointerCapture(event.pointerId);
});
discoveryDrag.addEventListener('pointermove', event => {
  if (!discoveryGesture) return;
  const delta = (event.clientY-discoveryGesture.y)/discoveryGesture.scale;
  if (Math.abs(delta)>4) discoveryGesture.moved = true;
  if (!discoveryGesture.moved) return;
  discoverySheet.classList.add('is-dragging');
  discoverySheet.style.transform = `translateY(${Math.max(0, Math.min(screens.discovery.clientHeight-194, discoveryGesture.top+delta-74))}px)`;
});
function finishDiscoveryDrag(event) {
  if (!discoveryGesture) return;
  const delta = (event.clientY-discoveryGesture.y)/discoveryGesture.scale;
  discoverySheet.classList.remove('is-dragging');
  if (discoveryGesture.moved) {
    discoverySuppressClick = true;
    expandDiscovery(event.type === 'pointercancel' || Math.abs(delta)<32 ? discoveryGesture.expanded : delta<0);
  } else expandDiscovery(discoveryGesture.expanded);
  discoveryGesture = null;
}
discoveryDrag.addEventListener('pointerup',finishDiscoveryDrag);
discoveryDrag.addEventListener('pointercancel',finishDiscoveryDrag);
discoveryScroll.addEventListener('wheel', event => {
  if (!discoveryExpanded && event.deltaY>0) {event.preventDefault();expandDiscovery(true);}
},{passive:false});
function setCategory(id) {
  category = id;
  savedOnly = false;
  renderFeed();
  centerIntent(id);
}
function centerIntent(id) {
  const index = categories.findIndex(item => item.id === id);
  const button = intents.querySelector('[data-category="' + id + '"]');
  if (!button || !intents.clientWidth) return;
  const scale = intents.getBoundingClientRect().width / intents.clientWidth;
  const target = index < 2 ? 0 : intents.scrollLeft + (button.getBoundingClientRect().left - intents.getBoundingClientRect().left) / scale + button.offsetWidth / 2 - intents.clientWidth / 2;
  intents.scrollTo({left: target, behavior: reduceMotion() ? 'instant' : 'smooth'});
}
function hoursLabel(place) {
  if (!place.hours) return '';
  if (place.status.includes('круглосуточно')) return 'Круглосуточно';
  // A fixed Wednesday schedule keeps the two research variants reproducible.
  const intervals = place.hours[3];
  if (!intervals?.length) return 'Расписание работы';
  const pad = value => String(value).padStart(2, '0');
  return intervals.map(interval => pad(interval.from.hours) + ':' + pad(interval.from.minutes) + '–' + pad(interval.to.hours) + ':' + pad(interval.to.minutes)).join(', ');
}
function renderPlace(place) {
  currentPlace = place;
  const detail = placeDetails[place.id];
  const food = place.tags.includes('food') || place.tags.includes('coffee');
  const stars = Array.from({length: 5}, () => icon('a7fa7.svg', true)).join('');
  const tabs = [{id:'overview',label:'Обзор'}, ...(food ? [{id:'menu',label:'Меню'}] : []), {id:'photos',label:'Фото',count:place.photoCount}, {id:'reviews',label:'Отзывы'}, {id:'address',label:'Адрес'}];
  screens.place.innerHTML = `
    <div class="status-bar status-bar--light place-status" aria-hidden="true" style="--place-cover: url('${photo(place)}')"><span>9:41</span><img src="${asset('610a3.svg')}" alt=""></div>
    <div class="place-gallery" data-figma-node="6063:42161">
      <button class="place-gallery-main" data-photo="0" type="button" aria-label="Открыть фотографии ${esc(place.name)}"><img class="place-gallery-main" src="${photo(place)}" alt="${esc(place.name)}"></button>
      ${detail.logo ? '<img class="place-logo" src="public/assets/places/' + place.id + '-logo.jpg" alt="Логотип ' + esc(place.name) + '">' : ''}
      <div class="gallery-counter">${icon('fc0b0.svg')}${place.photoCount}</div>
      <div class="gallery-progress" aria-hidden="true">${Array.from({length:10},(_,i) => '<i class="' + (i === 0 ? 'is-current' : '') + '"></i>').join('')}</div>
    </div>
    <article class="place-content">
      <div class="card-shutter" data-figma-node="6063:42163">
        <img class="shutter-handle" src="${asset('8ccfd.svg')}" alt="">
        <div class="place-title-row"><h1 class="place-title">${esc(place.name)}</h1>
          <button type="button" data-share aria-label="Поделиться местом">${icon('2c9e3.svg')}</button>
          <button type="button" class="place-back" aria-label="Назад к ленте">${icon('8c3e3.svg')}</button>
        </div>
      </div>
      <p class="place-kind">${esc(place.category)}</p>
      <div class="place-rating-row" data-figma-node="6063:42164">
        ${place.rating ? '<span>' + icon('a7fa7.svg',true) + '<b>' + place.rating + '</b><span class="review-count">(' + count(place.reviews) + ')</span></span>' : '<span class="review-count">Достопримечательность</span>'}
        ${place.awards?.goodPlaceYear ? '<span>' + icon('52730.svg',true) + '<b>Хорошее место</b></span>' : ''}
      </div>
      <section class="place-summary" data-figma-node="6063:42165">
        <div class="place-summary-body"><h2>Коротко про место</h2><p>${esc(place.description)}</p>
          <img class="summary-image summary-image--back" src="${photo(place,2)}" alt="">
          <img class="summary-image" src="${photo(place,1)}" alt="">
        </div>
      </section>
      <div class="social-row" data-figma-node="6063:42175">${icon('a7fa7.svg')}<span>${place.reviews ? '<b>' + count(place.reviews) + '</b> оценок пользователей Карт' : 'Место для прогулок по Петербургу'}</span></div>
      <div class="hours-distance" data-figma-node="6063:42176"><span>${esc(hoursLabel(place) || 'Санкт-Петербург')}</span><span class="nearby">${esc(place.metro ? 'м. ' + place.metro : '')}</span></div>
      <nav class="card-tabs" aria-label="Разделы карточки" data-figma-node="6063:42177">${tabs.map((t,i)=>'<button type="button" class="card-tab ' + (i===0?'is-active':'') + '" data-card-tab="' + t.id + '">' + t.label + (t.count ? '<small>' + t.count + '</small>' : '') + '</button>').join('')}</nav>
      <div id="card-overview">
        ${food ? `<section class="reservation" data-figma-node="6063:42189"><div class="reservation-header"><h2>Бронь столика</h2><button data-reserve type="button">Сегодня, 2 гостя</button></div><div class="reservation-times">${['13:00','14:30','15:30','16:00','Все время'].map(time => '<button type="button" data-reserve>' + time + '</button>').join('')}</div></section>` : ''}
        <div class="stories" data-figma-node="6063:42191">${place.photos.map((_,i) => '<button type="button" class="story" data-photo="' + i + '"><span class="story-photo"><img src="' + photo(place,i) + '" alt=""></span><span>Фото ' + (i+1) + '</span></button>').join('')}</div>
      </div>
      ${food ? `<section id="card-menu" class="menu-section" data-figma-node="6063:42195"><h2>Меню</h2>${detail.menu.length ? '<div class="menu-carousel">' + detail.menu.map((item,i) => '<article class="menu-card"><div class="menu-photo">' + (item.photo ? '<img src="public/assets/places/' + place.id + '-menu-' + i + '.jpg" alt="' + esc(item.title) + '" loading="lazy">' : '<span>Без фото</span>') + '</div><div class="menu-text"><p>' + esc(item.title) + '</p><span>' + esc(item.price) + '</span></div></article>').join('') + '</div>' : '<p class="menu-unavailable">У этого места нет опубликованного меню в Картах.</p>'}</section>` : ''}
      <section id="card-address" class="place-section" data-figma-node="6063:42204">
        <h2 class="address-heading">${icon('d0302.svg')}Адрес</h2>
        <div class="address-body"><p>${esc(place.address)}</p><p><button type="button" data-back-map>На карте</button></p></div>
      </section>
      ${place.status ? '<section class="place-section"><h2>Время работы</h2><p>' + esc(place.status) + '</p></section>' : ''}
      <section id="card-photos" class="place-section"><h2>Фото</h2><div class="photos-row">${place.photos.map((_,i) => '<button type="button" data-photo="' + i + '" aria-label="Фото ' + (i+1) + '"><img src="' + photo(place,i) + '" alt="' + esc(place.name) + ', фото ' + (i+1) + '" loading="lazy"></button>').join('')}</div></section>
      <section id="card-reviews" class="place-section"><h2>Рейтинг и отзывы</h2>${place.rating ? '<div class="review-summary"><strong>' + place.rating + '</strong><div><div class="star-row">' + stars + '</div><p>' + count(place.reviews) + ' оценок</p></div></div>' : '<p>У этого места нет рейтинга организации.</p>'}</section>
    </article>`;
  screens.place.scrollTop = 0;
  screens.place.classList.remove('is-header-pinned');
}
// Keep the original header in the document: no duplicate controls or focus targets.
screens.place.addEventListener('scroll', () => {
  screens.place.classList.toggle('is-header-pinned', screens.place.scrollTop >= 174);
}, {passive:true});
function openPlace(id) {
  const place = byId(id);
  if (!place) return;
  returnScreen = activeScreen;
  renderPlace(place);
  showScreen('place');
  history.pushState({screen:'place'}, '');
}
function closePlace() {
  if (history.state?.screen === 'place') history.back();
  else showScreen(returnScreen);
}
function openPhotos(index) {
  document.querySelector('.photo-viewer')?.remove();
  const place = currentPlace;
  const viewer = document.createElement('section');
  viewer.className = 'photo-viewer';
  viewer.setAttribute('role','dialog');
  viewer.setAttribute('aria-label','Фотографии места');
  viewer.setAttribute('aria-modal','true');
  let current = index;
  function render() {
    viewer.innerHTML = `<header><span>${current+1} / ${place.photos.length}</span><button type="button" data-close-photos aria-label="Закрыть фотографии">${icon('8c3e3.svg')}</button></header><img class="photo-viewer-main" src="${photo(place,current)}" alt="${esc(place.name)}"><footer><button type="button" data-prev>Предыдущее</button><button type="button" data-next>Следующее</button></footer>`;
  }
  render();
  document.querySelector('.phone').append(viewer);
  screens.place.inert = true;
  viewer.querySelector('button').focus();
  viewer.addEventListener('click',event=>{
    if(event.target.closest('[data-close-photos]')) { viewer.remove(); screens.place.inert=false; return; }
    if(event.target.closest('[data-prev]')) { current=(current+place.photos.length-1)%place.photos.length; render(); }
    if(event.target.closest('[data-next]')) { current=(current+1)%place.photos.length; render(); }
  });
}
const feedSheet = document.querySelector('.feed-sheet');
const homeSheet = document.querySelector('.home-sheet');
const sheetBackdrop = [...screens.feed.children].filter(node => node !== feedSheet);
let sheetMotion = null;
let sheetAnimating = false;
function prepareSheet(fromOpen) {
  const distance = Math.max(0, document.querySelector('.phone').clientHeight - 276 - 74);
  screens.map.classList.remove('is-hidden');
  screens.feed.classList.remove('is-hidden');
  screens.feed.style.pointerEvents = 'none';
  homeSheet.style.opacity = '0';
  sheetMotion = {distance, offset: fromOpen ? 0 : distance};
  paintSheet(sheetMotion.offset);
}
function paintSheet(offset) {
  sheetMotion.offset = Math.max(0, Math.min(sheetMotion.distance, offset));
  feedSheet.style.transform = `translateY(${sheetMotion.offset}px)`;
  const progress = 1 - sheetMotion.offset / (sheetMotion.distance || 1);
  sheetBackdrop.forEach(node => { node.style.opacity = String(progress); });
}
async function settleSheet(open) {
  if (!sheetMotion || sheetAnimating) return;
  sheetAnimating = true;
  const {distance, offset} = sheetMotion;
  const target = open ? 0 : distance;
  const timing = {duration: reduceMotion() ? 0 : 420, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards'};
  const animations = [feedSheet.animate([{transform:`translateY(${offset}px)`},{transform:`translateY(${target}px)`}], timing), ...sheetBackdrop.map(node => node.animate([{opacity:node.style.opacity},{opacity:open?1:0}],timing))];
  await Promise.all(animations.map(animation => animation.finished.catch(()=>{})));
  showScreen(open ? 'feed' : 'map');
  animations.forEach(animation=>animation.cancel());
  feedSheet.style.removeProperty('transform');
  sheetBackdrop.forEach(node=>node.style.removeProperty('opacity'));
  homeSheet.style.removeProperty('opacity');
  screens.feed.style.removeProperty('pointer-events');
  sheetMotion = null;
  sheetAnimating = false;
  if (open && activeTest === '1') centerIntent(category);
}
function openFeed() {
  if (activeScreen !== 'map' || sheetAnimating || sheetMotion) return;
  prepareSheet(false);
  settleSheet(true);
}
function goMap() {
  if (activeScreen !== 'feed' || sheetAnimating || sheetMotion) return;
  prepareSheet(true);
  settleSheet(false);
}

document.querySelector('#open-feed').addEventListener('click',openFeed);
document.querySelector('[data-open-feed]').addEventListener('click',openFeed);
document.querySelector('#collapse-feed').addEventListener('click',goMap);
document.querySelector('#back-to-map').addEventListener('click',()=>openDiscovery());
function selectTest(test, updateUrl=true) {
  if (sheetAnimating || sheetMotion) return;
  document.querySelector('.photo-viewer')?.remove();
  activeTest = test === '2' ? '2' : '1';
  document.querySelector('.phone').dataset.test = activeTest;
  document.querySelectorAll('.test-switcher [data-test]').forEach(button=>{
    const selected=button.dataset.test===activeTest;
    button.classList.toggle('is-active',selected);
    if(selected)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
  document.title='Яндекс Карты — Тест '+activeTest;
  category='all';savedOnly=false;search.value='';intents.scrollLeft=0;renderFeed();
  googleFeed.querySelectorAll('.google-section').forEach(section=>{
    section.classList.remove('is-expanded');
    const button=section.querySelector('[data-expand-section]');
    button.textContent=googleSections.find(item=>item.id===section.dataset.section).action;
  });
  document.querySelectorAll('.google-carousel').forEach(row=>{row.scrollLeft=0;});
  feedScroll.scrollTop=0;
  returnScreen='feed';
  showScreen('map');
  if(updateUrl){const url=new URL(location.href);url.searchParams.set('test',activeTest);history.replaceState({test:activeTest},'',url);}
}
document.querySelector('.test-switcher').addEventListener('click',event=>{
  const button=event.target.closest('[data-test]');
  if(button)selectTest(button.dataset.test);
});
document.querySelector('[data-google-open]').addEventListener('click',openFeed);
document.querySelector('[data-open-saved]').addEventListener('click',()=>{
  savedOnly=true;category='all';renderFeed();openFeed();
});
savedButton.addEventListener('click',()=>{savedOnly=!savedOnly;renderFeed();});
search.addEventListener('input',()=>renderFeed());
intents.addEventListener('click',event=>{
  const button = event.target.closest('[data-category]');
  if(button) setCategory(button.dataset.category);
});
intents.addEventListener('wheel',event=>{
  if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) { intents.scrollLeft += event.deltaY; event.preventDefault(); }
},{passive:false});
intents.addEventListener('keydown',event=>{
  if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
  event.preventDefault();
  const index=categories.findIndex(item=>item.id===category);
  const next=(index+(event.key==='ArrowRight'?1:-1)+categories.length)%categories.length;
  setCategory(categories[next].id);
  intents.querySelector('[aria-selected="true"]').focus();
});
feedScroll.addEventListener('scroll',updateHeader,{passive:true});
for(const container of [grid,homePreview,discoveryGrid]) container.addEventListener('click',event=>{
  if (suppressedTileClick && performance.now() < suppressedTileClick.until && event.target.closest('[data-tile-id]')?.dataset.tileId === suppressedTileClick.id) {
    event.preventDefault(); return;
  }
  const save=event.target.closest('[data-save]');
  if(save){toggleSaved(save.dataset.save);return;}
  const place=event.target.closest('[data-place-id]');
  if(place)openPlace(place.dataset.placeId);
});
document.querySelector('.home-suggest').addEventListener('click',event=>{
  if(event.target.closest('[data-home-unavailable]')){notify('Эта категория не входит в сценарий теста');return;}
  const button=event.target.closest('[data-home-category]');
  if(button){setCategory(button.dataset.homeCategory);openFeed();}
});
document.querySelector('.tabbar').addEventListener('click',()=>notify('В этом тесте доступны рекомендации мест'));
screens.place.addEventListener('click',async event=>{
  if(event.target.closest('.place-back')){closePlace();return;}
  if(event.target.closest('[data-back-map]')){returnScreen='map';closePlace();return;}
  const image=event.target.closest('[data-photo]');
  if(image){openPhotos(Number(image.dataset.photo));return;}
  if(event.target.closest('[data-reserve]')){notify('Это демонстрация: бронь не отправляется');return;}
  if(event.target.closest('[data-share]')){
    try { await navigator.clipboard.writeText(currentPlace.sourceUrl);notify('Ссылка на место скопирована'); }
    catch { notify(currentPlace.name); }
    return;
  }
  const tab=event.target.closest('[data-card-tab]');
  if(tab) {
    screens.place.querySelectorAll('.card-tab').forEach(node=>node.classList.toggle('is-active',node===tab));
    const destination=screens.place.querySelector('#card-'+tab.dataset.cardTab);
    destination?.scrollIntoView({behavior:'smooth',block:'start'});
  }
});
window.addEventListener('popstate',()=>{if(activeScreen==='place')showScreen(returnScreen);});
window.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  const viewer=document.querySelector('.photo-viewer');
  if(viewer){viewer.remove();screens.place.inert=false;return;}
  if(activeScreen==='place')closePlace();else if(activeScreen==='feed')goMap();else if(activeScreen==='discovery'){if(discoveryExpanded)expandDiscovery(false);else closeDiscovery();}
});
function dragHandle(element, fromOpen) {
  let drag = null;
  let suppressClickUntil = 0;
  element.addEventListener('click', event => {
    if(performance.now() < suppressClickUntil) { event.preventDefault();event.stopImmediatePropagation(); }
  },true);
  element.addEventListener('pointerdown',event=>{
    if(sheetAnimating || sheetMotion || event.button !== 0)return;
    const phone = document.querySelector('.phone');
    drag = {y:event.clientY, scale:phone.getBoundingClientRect().height / phone.clientHeight, moved:false};
    element.setPointerCapture(event.pointerId);
  });
  element.addEventListener('pointermove', event => {
    if(!drag)return;
    const dy = (event.clientY-drag.y)/drag.scale;
    if(!drag.moved && Math.abs(dy)>4){drag.moved=true;prepareSheet(fromOpen);}
    if(drag.moved)paintSheet((fromOpen?0:sheetMotion.distance)+dy);
  });
  function end(event,cancelled=false) {
    if(!drag)return;
    if(drag.moved){
      suppressClickUntil = performance.now()+500;
      const dy=(event.clientY-drag.y)/drag.scale;
      settleSheet(cancelled ? fromOpen : fromOpen ? dy < 60 : dy < -60);
    }
    drag=null;
  }
  element.addEventListener('pointerup',event=>end(event));
  element.addEventListener('pointercancel',event=>end(event,true));
}
dragHandle(document.querySelector('#open-feed'),false);
dragHandle(document.querySelector('#collapse-feed'),true);

function updateTilePhoto(tile, index) {
  const place = byId(tile.dataset.tileId);
  index = Math.max(0,Math.min(place.photos.length-1,index));
  tilePhotos.set(place.id,index);
  tile.dataset.photoIndex=String(index);
  const track=tile.querySelector('.tile-photo-track');
  track.classList.remove('is-dragging');
  track.style.transform=`translateX(-${index*100}%)`;
  tile.querySelector('.tile-stepper').innerHTML = stepperDots(place,index);
}
for(const container of [grid,homePreview,discoveryGrid]) {
  let gesture=null;
  container.addEventListener('pointerdown',event=>{
    const link=event.target.closest('.tile-link');
    if(!link || event.button!==0)return;
    const tile=link.closest('.place-tile');
    const visual=tile.querySelector('.tile-visual').getBoundingClientRect();
    if(event.clientY>visual.bottom)return;
    gesture={tile,link,x:event.clientX,y:event.clientY,index:Number(tile.dataset.photoIndex),width:visual.width,time:performance.now(),horizontal:false};
    link.setPointerCapture(event.pointerId);
  });
  container.addEventListener('pointermove',event=>{
    if(!gesture)return;
    const dx=event.clientX-gesture.x,dy=event.clientY-gesture.y;
    if(!gesture.horizontal && Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)){gesture=null;return;}
    if(!gesture.horizontal && Math.abs(dx)>8 && Math.abs(dx)>Math.abs(dy))gesture.horizontal=true;
    if(!gesture.horizontal)return;
    const track=gesture.tile.querySelector('.tile-photo-track');
    track.classList.add('is-dragging');
    const max=byId(gesture.tile.dataset.tileId).photos.length-1;
    const overscroll=(gesture.index===0&&dx>0)||(gesture.index===max&&dx<0);
    track.style.transform=`translateX(${ -gesture.index*100+dx/gesture.width*100*(overscroll?.2:1)}%)`;
  });
  function endSwipe(event,cancelled=false) {
    if(!gesture)return;
    if(gesture.horizontal){
      const dx=event.clientX-gesture.x;
      const velocity=Math.abs(dx)/Math.max(1,performance.now()-gesture.time);
      const advance=!cancelled&&(Math.abs(dx)>gesture.width*.18 || Math.abs(dx)>20&&velocity>.35);
      updateTilePhoto(gesture.tile,gesture.index+(advance?(dx<0?1:-1):0));
      suppressedTileClick={id:gesture.tile.dataset.tileId,until:performance.now()+500};
    }
    gesture=null;
  }
  container.addEventListener('pointerup',event=>endSwipe(event));
  container.addEventListener('pointercancel',event=>endSwipe(event,true));
  container.addEventListener('keydown',event=>{
    if(!event.target.matches('.tile-link')||!['ArrowLeft','ArrowRight'].includes(event.key))return;
    event.preventDefault();
    const tile=event.target.closest('.place-tile');
    updateTilePhoto(tile,Number(tile.dataset.photoIndex)+(event.key==='ArrowRight'?1:-1));
  });
}
// Test 2 uses horizontal organization rows, not the Test 1 photo-swipe handler.
for(const container of [googleFeed,googleHomePreview]) {
  let drag=null;
  let suppressUntil=0;
  container.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse' || event.button!==0)return;
    const row=event.target.closest('.google-carousel');
    if(!row || row.closest('.is-expanded'))return;
    drag={row,x:event.clientX,y:event.clientY,left:row.scrollLeft,moved:false,target:event.target};
  });
  container.addEventListener('pointermove',event=>{
    if(!drag)return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if(!drag.moved && Math.abs(dy)>8 && Math.abs(dy)>Math.abs(dx)){drag=null;return;}
    if(!drag.moved && Math.abs(dx)>8){drag.moved=true;drag.target.setPointerCapture(event.pointerId);drag.row.classList.add('is-dragging');}
    if(drag.moved){const scale=drag.row.getBoundingClientRect().width/drag.row.clientWidth;drag.row.scrollLeft=drag.left-dx/scale;}
  });
  function finishDrag(){
    if(drag?.moved){drag.row.classList.remove('is-dragging');suppressUntil=performance.now()+500;}
    drag=null;
  }
  container.addEventListener('pointerup',finishDrag);
  container.addEventListener('pointercancel',finishDrag);
  container.addEventListener('click',event=>{
    if(performance.now()<suppressUntil){event.preventDefault();return;}
    const place=event.target.closest('[data-place-id]');
    if(place){openPlace(place.dataset.placeId);return;}
    const button=event.target.closest('[data-expand-section]');
    if(button){
      openDiscovery(button.dataset.expandSection);
    }
  });
  container.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight'].includes(event.key))return;
    const row=event.target.closest('.google-carousel');
    if(!row || row.closest('.is-expanded'))return;
    event.preventDefault();
    row.scrollBy({left:(event.key==='ArrowRight'?1:-1)*(row.querySelector('.google-tile').offsetWidth+8),behavior:reduceMotion()?'instant':'smooth'});
  });
}
let touchStart=null;
screens.map.addEventListener('touchstart',event=>{touchStart=event.target.closest('.drag-control,.place-tile,.home-suggest')?null:{x:event.touches[0].clientX,y:event.touches[0].clientY};},{passive:true});
screens.map.addEventListener('touchend',event=>{if(touchStart && touchStart.y-event.changedTouches[0].clientY>50 && Math.abs(touchStart.x-event.changedTouches[0].clientX)<40)openFeed();touchStart=null;},{passive:true});
screens.map.addEventListener('wheel',event=>{if(event.deltaY>15)openFeed();},{passive:true});

homePreview.innerHTML=places.slice(0,3).map(place=>tile(place,true)).join('');
const googleHelpers={photo,esc,count,asset};
googleFeed.innerHTML=renderGoogleSections(places,googleHelpers);
googleHomePreview.innerHTML=places.filter(place=>place.tags.includes('food')).map(place=>googleTile(place,googleHelpers,'L',true)).join('');
selectTest(new URLSearchParams(location.search).get('test')||'1',false);
