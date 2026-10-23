import { ToastSystem } from './utils.js';
import { LazyLoader } from './theme.js';
export const ModalManager = {
activeModal: null,
init() {
document.addEventListener('click', (e) => {
const trigger = e.target.closest('[data-modal-open]');
if (trigger) {
e.preventDefault();
const modalId = trigger.getAttribute('data-modal-open');
this.open(modalId);
return;
}
const closeBtn = e.target.closest('.close');
if (closeBtn) {
const modalId = closeBtn.getAttribute('data-modal');
this.close(modalId);
return;
}
if (e.target.classList.contains('modal')) {
this.close(e.target.id);
}
});
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && this.activeModal) {
this.close(this.activeModal);
}
});
console.log('✅ ModalManager inicializado');
},
open(modalId) {
const modal = document.getElementById(modalId);
if (!modal) {
console.warn(`Modal ${modalId} no encontrado`);
return;
}
modal.style.display = 'block';
this.activeModal = modalId;
document.body.style.overflow = 'hidden';
const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
if (firstFocusable) {
setTimeout(() => firstFocusable.focus(), 100);
}
},
close(modalId) {
const modal = document.getElementById(modalId);
if (!modal)
return;
modal.style.display = 'none';
this.activeModal = null;
document.body.style.overflow = '';
},
closeAll() {
document.querySelectorAll('.modal').forEach(modal => {
modal.style.display = 'none';
});
this.activeModal = null;
document.body.style.overflow = '';
}
};
const pageUrl = 'https://c0digos-para-compartir-por-whatsapp.pages.dev/';
const pageTitle = 'Códigos HTML de Amor ❤️ | Plantillas Románticas Gratis';
const pageDescription = '¡Descarga gratis hermosas plantillas HTML para WhatsApp! 💕';
requestAnimationFrame(() => {
setupShareButtons();
});
function setupShareButtons() {
const shareWhatsApp = document.getElementById('shareWhatsApp');
if (shareWhatsApp) {
shareWhatsApp.addEventListener('click', (e) => {
e.preventDefault();
const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(pageTitle + ' - ' + pageUrl)}`;
window.open(whatsappUrl, '_blank');
});
}
const shareFacebook = document.getElementById('shareFacebook');
if (shareFacebook) {
shareFacebook.addEventListener('click', (e) => {
e.preventDefault();
const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
window.open(facebookUrl, '_blank', 'width=600,height=400');
});
}
const shareTelegram = document.getElementById('shareTelegram');
if (shareTelegram) {
shareTelegram.addEventListener('click', (e) => {
e.preventDefault();
const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(pageDescription)}`;
window.open(telegramUrl, '_blank');
});
}
const copyLink = document.getElementById('copyLink');
if (copyLink) {
copyLink.addEventListener('click', (e) => {
e.preventDefault();
if (window.AndroidApp && window.AndroidApp.shareNative) {
window.AndroidApp.shareNative(pageUrl, pageTitle);
return;
}
if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
navigator.share({
title: pageTitle,
text: pageDescription,
url: pageUrl
}).then(() => {
ToastSystem.success('Enlace compartido correctamente', '¡Compartido!');
}).catch((error) => {
if (error.name !== 'AbortError') {
copyToClipboard();
}
});
}
else {
copyToClipboard();
}
function copyToClipboard() {
var textToCopy = pageUrl;
if (navigator.clipboard && navigator.clipboard.writeText) {
navigator.clipboard.writeText(textToCopy).then(() => {
onCopySuccess();
}).catch(err => {
console.warn('Clipboard API falló:', err);
copyFallback(textToCopy);
});
}
else {
copyFallback(textToCopy);
}
}
function onCopySuccess() {
var originalNodes = Array.from(copyLink.childNodes).map(function (n) { return n.cloneNode(true); });
var svgNS = 'http://www.w3.org/2000/svg';
var checkSvg = document.createElementNS(svgNS, 'svg');
checkSvg.setAttribute('viewBox', '0 0 24 24');
var checkPath = document.createElementNS(svgNS, 'path');
checkPath.setAttribute('d', 'M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z');
checkSvg.appendChild(checkPath);
copyLink.replaceChildren(checkSvg, document.createTextNode(' ¡Copiado!'));
copyLink.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
ToastSystem.success('El enlace se copió al portapapeles', '¡Enlace copiado!');
setTimeout(() => {
copyLink.replaceChildren(...originalNodes);
copyLink.style.background = 'linear-gradient(135deg, var(--accent-color) 0%, #764ba2 100%)';
}, 2000);
}
function copyFallback(text) {
var textarea = document.createElement('textarea');
textarea.value = text;
textarea.style.position = 'fixed';
textarea.style.opacity = '0';
textarea.style.pointerEvents = 'none';
document.body.appendChild(textarea);
try {
textarea.select();
if (document.execCommand('copy')) {
onCopySuccess();
}
else {
throw new Error('execCommand falló');
}
}
catch (err) {
console.error('Fallback copy error:', err);
ToastSystem.error('No se pudo copiar. Copia manualmente: ' + text, 'Error al copiar');
}
finally {
document.body.removeChild(textarea);
}
}
});
}
}
const TOTAL_FONDOS = 42;
const WALLPAPERS_PATH = './wallpapers/';
const WALLPAPER_DEFAULT_FORMAT = 'webp';
const WALLPAPER_FORMATS = {};
const WALLPAPER_RESPONSIVE = {};
function getWallpaperAsset(index) {
const ext = WALLPAPER_FORMATS[index] || WALLPAPER_DEFAULT_FORMAT;
const fileName = 'fondo' + index + '.' + ext;
const responsiveSet = WALLPAPER_RESPONSIVE[index] || [];
return {
path: WALLPAPERS_PATH + fileName,
fileName,
srcset: responsiveSet.map(item => WALLPAPERS_PATH + item).join(', ')
};
}
let wallpapersLoaded = false;
export function loadWallpapers() {
const grid = document.getElementById('wallpapersGrid');
const noWallpapers = document.getElementById('noWallpapers');
if (!grid)
return;
if (wallpapersLoaded) {
console.log('ℹ️ Wallpapers ya cargados, omitiendo recarga');
return;
}
if (TOTAL_FONDOS === 0) {
noWallpapers.style.display = 'block';
grid.style.display = 'none';
return;
}
grid.replaceChildren();
noWallpapers.style.display = 'none';
grid.style.display = 'grid';
for (let i = 1; i <= TOTAL_FONDOS; i++) {
const wallpaperAsset = getWallpaperAsset(i);
const imagePath = wallpaperAsset.path;
const wallpaperTitle = 'Fondo Romántico ' + i;
const fileName = wallpaperAsset.fileName;
const card = document.createElement('div');
card.className = 'wallpaper-card skeleton';
const cardImg = document.createElement('img');
cardImg.setAttribute('data-src', imagePath);
if (wallpaperAsset.srcset) {
cardImg.setAttribute('data-srcset', wallpaperAsset.srcset);
cardImg.setAttribute('data-sizes', '(max-width: 600px) 480px, (max-width: 1200px) 800px, 1200px');
}
cardImg.alt = wallpaperTitle;
cardImg.className = 'wallpaper-image';
cardImg.loading = 'lazy';
cardImg.decoding = 'async';
const infoEl = document.createElement('div');
infoEl.className = 'wallpaper-info';
const titleEl = document.createElement('div');
titleEl.className = 'wallpaper-title';
titleEl.textContent = wallpaperTitle;
const actionsEl = document.createElement('div');
actionsEl.className = 'wallpaper-actions';
const downloadEl = document.createElement('a');
downloadEl.href = imagePath;
downloadEl.setAttribute('download', fileName);
downloadEl.className = 'wallpaper-btn wallpaper-download';
downloadEl.textContent = '📥 Descargar';
const viewEl = document.createElement('button');
viewEl.type = 'button';
viewEl.className = 'wallpaper-btn wallpaper-view';
viewEl.textContent = '👁️ Ver';
actionsEl.append(downloadEl, viewEl);
infoEl.append(titleEl, actionsEl);
card.append(cardImg, infoEl);
const viewBtn = card.querySelector('.wallpaper-view');
viewBtn.addEventListener('click', (e) => {
e.stopPropagation();
viewWallpaper(imagePath, wallpaperTitle);
});
const dlBtn = card.querySelector('.wallpaper-download');
dlBtn.addEventListener('click', (e) => {
e.stopPropagation();
});
const img = card.querySelector('.wallpaper-image');
img.addEventListener('click', (e) => {
e.stopPropagation();
viewWallpaper(imagePath, wallpaperTitle);
});
card.addEventListener('click', () => {
viewWallpaper(imagePath, wallpaperTitle);
});
grid.appendChild(card);
}
wallpapersLoaded = true;
ToastSystem.info('Cargando ' + TOTAL_FONDOS + ' fondos de pantalla...', 'Galería');
requestAnimationFrame(() => {
const modalImages = document.querySelectorAll('#wallpapersGrid img[data-src]');
modalImages.forEach(img => {
LazyLoader.observeImage(img);
});
});
LazyLoader.preloadImages([WALLPAPERS_PATH + 'fondo1.webp']);
}
function downloadWallpaper(imagePath, title) {
const extension = imagePath.split('.').pop();
const fileName = (title || 'fondo').replace(/\s+/g, '_') + '.' + extension;
ToastSystem.info('Preparando descarga...', '📥 Descargando');
var xhr = new XMLHttpRequest();
xhr.open('HEAD', imagePath, true);
xhr.onload = function () {
if (xhr.status < 400) {
var link = document.createElement('a');
link.href = imagePath;
link.download = fileName;
document.body.appendChild(link);
try {
link.click();
ToastSystem.success(`"${fileName}" se ha descargado`, 'Descarga completa');
}
catch (err) {
ToastSystem.error('No se pudo iniciar la descarga', 'Error');
}
finally {
document.body.removeChild(link);
}
}
else {
ToastSystem.error('Este fondo no está disponible ahora mismo', '⚠️ No encontrado');
}
};
xhr.onerror = function () {
ToastSystem.error('Este fondo no está disponible ahora mismo', '⚠️ No encontrado');
console.warn('[downloadWallpaper] Error de red o archivo inexistente');
};
xhr.send();
}
function viewWallpaper(imagePath, title) {
const modal = document.getElementById('imageViewModal');
const img = document.getElementById('imageViewImg');
const titleEl = document.getElementById('imageViewTitle');
const downloadBtn = document.getElementById('imageViewDownload');
modal.style.display = 'block';
titleEl.textContent = title || 'Vista previa';
img.classList.remove('loaded', 'error');
img.classList.add('loading');
img.src = '';
img.style.display = 'block';
const tempImg = new Image();
tempImg.onload = () => {
img.src = imagePath;
img.classList.remove('loading');
img.classList.add('loaded');
};
tempImg.onerror = () => {
img.classList.remove('loading');
img.classList.add('error');
img.style.display = 'none';
ToastSystem.error('No se pudo cargar la imagen', 'Error');
const errorMsg = document.createElement('div');
errorMsg.style.cssText = 'text-align: center; padding: 60px 20px; color: var(--text-secondary);';
const errIcon = document.createElement('div');
errIcon.style.cssText = 'font-size: 64px; margin-bottom: 20px;';
errIcon.textContent = '❌';
const errTitle = document.createElement('h3');
errTitle.style.cssText = 'color: var(--text-primary); margin-bottom: 10px;';
errTitle.textContent = 'Imagen no disponible';
const errText = document.createElement('p');
errText.textContent = 'Este fondo de pantalla no pudo cargarse';
errorMsg.append(errIcon, errTitle, errText);
const modalContent = modal.querySelector('.modal-content');
const existingError = modalContent.querySelector('.error-message');
if (existingError)
existingError.remove();
errorMsg.className = 'error-message';
modalContent.appendChild(errorMsg);
};
tempImg.src = imagePath;
downloadBtn.onclick = () => downloadWallpaper(imagePath, title);
function handleEsc(e) {
if (e.key === 'Escape') {
modal.style.display = 'none';
document.removeEventListener('keydown', handleEsc);
const errorMsg = modal.querySelector('.error-message');
if (errorMsg)
errorMsg.remove();
}
}
document.addEventListener('keydown', handleEsc);
}
