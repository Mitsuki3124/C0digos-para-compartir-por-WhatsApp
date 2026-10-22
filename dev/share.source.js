import { ToastSystem } from './utils.js';
import { LazyLoader } from './theme.js';

// SISTEMA DE GESTIÓN DE MODALES OPTIMIZADO
export const ModalManager = {
    activeModal: null,
    
    init() {
        // Event delegation para todos los modales
        document.addEventListener('click', (e) => {
            // Abrir modales desde enlaces
            const trigger = e.target.closest('[data-modal-open]');
            if (trigger) {
                e.preventDefault();
                const modalId = trigger.getAttribute('data-modal-open');
                this.open(modalId);
                return;
            }
            
            // Cerrar con botón close
            const closeBtn = e.target.closest('.close');
            if (closeBtn) {
                const modalId = closeBtn.getAttribute('data-modal');
                this.close(modalId);
                return;
            }
            
            // Cerrar al hacer clic fuera
            if (e.target.classList.contains('modal')) {
                this.close(e.target.id);
            }
        });
        
        // Cerrar con tecla ESC
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
        document.body.style.overflow = 'hidden'; // Prevenir scroll
        
        // Focus en el modal para accesibilidad
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            setTimeout(() => firstFocusable.focus(), 100);
        }
    },
    
    close(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        modal.style.display = 'none';
        this.activeModal = null;
        document.body.style.overflow = ''; // Restaurar scroll
    },
    
    closeAll() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.activeModal = null;
        document.body.style.overflow = '';
    }
};


        // ✅ CORRECCIÓN BUG #2: Listener duplicado de backToTop eliminado.
        // El botón "Volver Arriba" se inicializa correctamente en setupMainEventListeners()
        // que se ejecuta DESPUÉS de DOM.init() dentro de DOMContentLoaded.

        // Botones de Compartir
        const pageUrl = 'https://c0digos-para-compartir-por-whatsapp.pages.dev/';
        const pageTitle = 'Códigos HTML de Amor ❤️ | Plantillas Románticas Gratis';
        const pageDescription = '¡Descarga gratis hermosas plantillas HTML para WhatsApp! 💕';

        // ✅ OPTIMIZACIÓN: Diferir registración de listeners de compartir
        // Esto evita una tarea larga sincrónica al cargar la página
        requestAnimationFrame(() => {
            setupShareButtons();
        });

        function setupShareButtons() {
            // WhatsApp
            const shareWhatsApp = document.getElementById('shareWhatsApp');
            if (shareWhatsApp) {
                shareWhatsApp.addEventListener('click', (e) => {
                    e.preventDefault();
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(pageTitle + ' - ' + pageUrl)}`;
                    window.open(whatsappUrl, '_blank');
                });
            }

            // Facebook
            const shareFacebook = document.getElementById('shareFacebook');
            if (shareFacebook) {
                shareFacebook.addEventListener('click', (e) => {
                    e.preventDefault();
                    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
                    window.open(facebookUrl, '_blank', 'width=600,height=400');
                });
            }

            // X (antes Twitter) — el botón ya tiene href directo, no necesita JS adicional

            // Telegram
            const shareTelegram = document.getElementById('shareTelegram');
            if (shareTelegram) {
                shareTelegram.addEventListener('click', (e) => {
                    e.preventDefault();
                    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(pageDescription)}`;
                    window.open(telegramUrl, '_blank');
                });
            }

            // Copiar Link con Toast
            const copyLink = document.getElementById('copyLink');
            if (copyLink) {
                copyLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Puente Nativo para Android: Si la app está abierta, usar el menú de compartir real
                    if (window.AndroidApp && window.AndroidApp.shareNative) {
                        window.AndroidApp.shareNative(pageUrl, pageTitle);
                        return;
                    }

                    // Verificar si el navegador soporta Web Share API
                    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
                        navigator.share({
                            title: pageTitle,
                            text: pageDescription,
                            url: pageUrl
                        }).then(() => {
                            ToastSystem.success('Enlace compartido correctamente', '¡Compartido!');
                        }).catch((error) => {
                            if (error.name !== 'AbortError') {
                                // Si falla Web Share, intentar copiar al portapapeles
                                copyToClipboard();
                            }
                        });
                    } else {
                        // Navegador de escritorio o sin soporte Web Share
                        copyToClipboard();
                    }
                    
                    function copyToClipboard() {
                        var textToCopy = pageUrl;
                        
                        // Método moderno (Clipboard API)
                        if (navigator.clipboard && navigator.clipboard.writeText) {
                            navigator.clipboard.writeText(textToCopy).then(() => {
                                onCopySuccess();
                            }).catch(err => {
                                console.warn('Clipboard API falló:', err);
                                copyFallback(textToCopy);
                            });
                        } else {
                            // Fallback para navegadores antiguos
                            copyFallback(textToCopy);
                        }
                    }
                    
                    function onCopySuccess() {
                        var originalText = copyLink.innerHTML;
                        copyLink.innerHTML = '<svg viewBox="0 0 24 24"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg> ¡Copiado!';
                        copyLink.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
                        ToastSystem.success('El enlace se copió al portapapeles', '¡Enlace copiado!');
                        
                        setTimeout(() => {
                            copyLink.innerHTML = originalText;
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
                            } else {
                                throw new Error('execCommand falló');
                            }
                        } catch (err) {
                            console.error('Fallback copy error:', err);
                            ToastSystem.error('No se pudo copiar. Copia manualmente: ' + text, 'Error al copiar');
                        } finally {
                            document.body.removeChild(textarea);
                        }
                    }
                });
            }
        }

        // GALERÍA DE FONDOS DE PANTALLA EN MODAL

        // CONFIGURACIÓN AUTOMÁTICA DE FONDOS DE PANTALLA
        // ✅ MANTENIMIENTO: Para añadir más fondos, solo cambia este número:
        // Ejemplo: fondo43 → cambia TOTAL_FONDOS a 43
        //          fondo50 → cambia TOTAL_FONDOS a 50
        //          fondo100 → cambia TOTAL_FONDOS a 100
        const TOTAL_FONDOS = 42;

        // Ruta base donde están las imágenes (subcarpeta wallpapers/)
        const WALLPAPERS_PATH = './wallpapers/';
        const WALLPAPER_DEFAULT_FORMAT = 'webp';
        const WALLPAPER_FORMATS = {};
        const WALLPAPER_RESPONSIVE = {
            // Ejemplo futuro:
            // 19: ['fondo19-480w.webp 480w', 'fondo19-800w.webp 800w', 'fondo19.webp 1200w']
        };

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

        // Variable global para controlar carga única de wallpapers
        let wallpapersLoaded = false;

        // FUNCIÓN AUTOMÁTICA DE CARGA DE GALERÍA
        // Genera las 42 tarjetas con un bucle for
        // SIN arrays manuales ni código repetitivo
        export function loadWallpapers() {
            const grid = document.getElementById('wallpapersGrid');
            const noWallpapers = document.getElementById('noWallpapers');

            if (!grid) return;

            // Si ya se cargaron una vez, no recargar
            if (wallpapersLoaded) {
                console.log('ℹ️ Wallpapers ya cargados, omitiendo recarga');
                return;
            }

            if (TOTAL_FONDOS === 0) {
                noWallpapers.style.display = 'block';
                grid.style.display = 'none';
                return;
            }

            grid.innerHTML = '';
            noWallpapers.style.display = 'none';
            grid.style.display = 'grid';

            // ✅ BUCLE FOR: genera dinámicamente las TOTAL_FONDOS tarjetas
            // sin necesidad de ningún array escrito a mano
            for (let i = 1; i <= TOTAL_FONDOS; i++) {
                // Se usa let para que el closure capture el valor correcto de i en cada iteración
                const wallpaperAsset = getWallpaperAsset(i);
                const imagePath     = wallpaperAsset.path;
                const wallpaperTitle = 'Fondo Romántico ' + i;
                const fileName       = wallpaperAsset.fileName;
                const responsiveAttrs = wallpaperAsset.srcset
                    ? '" data-srcset="' + wallpaperAsset.srcset + '" data-sizes="(max-width: 600px) 480px, (max-width: 1200px) 800px, 1200px'
                    : '';

                const card = document.createElement('div');
                card.className = 'wallpaper-card skeleton';

                // ✅ BOTÓN DESCARGAR → <a> con atributo HTML5 "download"
                //    Descarga directa al almacenamiento del móvil sin servidores externos.
                //
                // ✅ BOTÓN VER → <button> que llama a viewWallpaper()
                //    Abre el modal personalizado de THORN ELDRITCH con la imagen
                //    ampliada y el botón "Descargar fondo de pantalla" en la parte inferior.
                //
                // ✅ CLICK EN LA IMAGEN Y EN LA TARJETA → también abre el modal
                card.innerHTML =
                    '<img data-src="' + imagePath + responsiveAttrs + '"' +
                        ' alt="' + wallpaperTitle + '"' +
                        ' class="wallpaper-image"' +
                        ' loading="lazy"' +
                        ' decoding="async">' +
                    '<div class="wallpaper-info">' +
                        '<div class="wallpaper-title">' + wallpaperTitle + '</div>' +
                        '<div class="wallpaper-actions">' +
                            '<a href="' + imagePath + '"' +
                               ' download="' + fileName + '"' +
                               ' class="wallpaper-btn wallpaper-download">' +
                                '📥 Descargar' +
                            '</a>' +
                            '<button type="button"' +
                               ' class="wallpaper-btn wallpaper-view">' +
                                '👁️ Ver' +
                            '</button>' +
                        '</div>' +
                    '</div>';

                // Botón VER → abre el modal personalizado
                const viewBtn = card.querySelector('.wallpaper-view');
                viewBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    viewWallpaper(imagePath, wallpaperTitle);
                });

                // Botón DESCARGAR → stopPropagation para evitar que active el modal
                const dlBtn = card.querySelector('.wallpaper-download');
                dlBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                });

                // Click en la imagen → abre el modal
                const img = card.querySelector('.wallpaper-image');
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    viewWallpaper(imagePath, wallpaperTitle);
                });

                // Click en cualquier parte de la tarjeta → abre el modal
                // (excepto si se hizo click en el enlace de descarga o en el botón ver,
                //  que ya tienen su propio listener con stopPropagation)
                card.addEventListener('click', () => {
                    viewWallpaper(imagePath, wallpaperTitle);
                });

                grid.appendChild(card);
            }

            // Marcar como cargado
            wallpapersLoaded = true;

            ToastSystem.info('Cargando ' + TOTAL_FONDOS + ' fondos de pantalla...', 'Galería');

            // Esperar a que LazyLoader esté listo antes de observar imágenes
            requestAnimationFrame(() => {
                const modalImages = document.querySelectorAll('#wallpapersGrid img[data-src]');
                modalImages.forEach(img => {
                    LazyLoader.observeImage(img);
                });
            });

            // Precargar primera imagen
            LazyLoader.preloadImages([WALLPAPERS_PATH + 'fondo1.webp']);
        }

        // Función para descargar fondo de pantalla
        function downloadWallpaper(imagePath, title) {
    const extension = imagePath.split('.').pop();
    const fileName = (title || 'fondo').replace(/\s+/g, '_') + '.' + extension;

    // Aviso inicial
    ToastSystem.info('Preparando descarga...', '📥 Descargando');

    // Verificación previa: ¿existe la imagen?
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', imagePath, true);
    
    xhr.onload = function() {
        if (xhr.status < 400) {
            // Crear descarga segura
            var link = document.createElement('a');
            link.href = imagePath;
            link.download = fileName;
            document.body.appendChild(link);

            // Intento de descarga
            try {
                link.click();
                ToastSystem.success(`"${fileName}" se ha descargado`, 'Descarga completa');
            } catch (err) {
                // Si algo falla con el click
                ToastSystem.error('No se pudo iniciar la descarga', 'Error');
            } finally {
                document.body.removeChild(link);
            }
        } else {
            ToastSystem.error('Este fondo no está disponible ahora mismo', '⚠️ No encontrado');
        }
    };
    
    xhr.onerror = function() {
        ToastSystem.error('Este fondo no está disponible ahora mismo', '⚠️ No encontrado');
        console.warn('[downloadWallpaper] Error de red o archivo inexistente');
    };
    
    xhr.send();
}

        // Función para ver fondo de pantalla
        function viewWallpaper(imagePath, title) {
    const modal = document.getElementById('imageViewModal');
    const img = document.getElementById('imageViewImg');
    const titleEl = document.getElementById('imageViewTitle');
    const downloadBtn = document.getElementById('imageViewDownload');

    // Mostrar modal y título
    modal.style.display = 'block';
    titleEl.textContent = title || 'Vista previa';

    // Preparar estados visuales
    img.classList.remove('loaded', 'error');
    img.classList.add('loading');
    img.src = '';
    img.style.display = 'block';

    // Imagen temporal para validar
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

        // Crear mensaje de error visual
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'text-align: center; padding: 60px 20px; color: var(--text-secondary);';
        errorMsg.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">❌</div>
            <h3 style="color: var(--text-primary); margin-bottom: 10px;">Imagen no disponible</h3>
            <p>Este fondo de pantalla no pudo cargarse</p>
        `;
        
        const modalContent = modal.querySelector('.modal-content');
        const existingError = modalContent.querySelector('.error-message');
        if (existingError) existingError.remove();
        errorMsg.className = 'error-message';
        modalContent.appendChild(errorMsg);
    };

    // Intento de carga
    tempImg.src = imagePath;

    // Botón de descarga con comprobación previa
    downloadBtn.onclick = () => downloadWallpaper(imagePath, title);

    // Cerrar modal con tecla ESC (mejora de accesibilidad)
    function handleEsc(e) {
        if (e.key === 'Escape') {
            modal.style.display = 'none';
            document.removeEventListener('keydown', handleEsc);
            // Limpiar mensaje de error si existe
            const errorMsg = modal.querySelector('.error-message');
            if (errorMsg) errorMsg.remove();
        }
    }
    document.addEventListener('keydown', handleEsc);
}
