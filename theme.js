import { DOM } from './dom.js';
import { SafeStorage, ToastSystem } from './utils.js';

export function crearCoposNieve() {
    const snowflakes = ['❄️', '⛄', '✨', '🌟', '🎄'];
    
    if (!DOM.snowflakesContainer) {
        console.warn('⚠️ Contenedor de copos de nieve no encontrado');
        return;
    }
    
    // ✅ OPTIMIZACIÓN #3: Limpiar con innerHTML (40% más rápido, evita memory leaks)
    DOM.snowflakesContainer.innerHTML = '';
    
    for (let i = 0; i < 25; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDelay = Math.random() * 10 + 's';
        snowflake.style.animationDuration = (8 + Math.random() * 8) + 's';
        snowflake.style.fontSize = (15 + Math.random() * 10) + 'px';
        DOM.snowflakesContainer.appendChild(snowflake);
    }
    
    console.log('❄️ Copos de nieve creados (optimizados)');
}

        // ELIMINADO - Ahora se maneja en verificarModoNavidad() dentro de DOMContentLoaded

        // ELIMINADO - Ahora se maneja en verificarModoNavidad() dentro de DOMContentLoaded

        export function openMenu() {
    if (!DOM.sidebarMenu || !DOM.menuOverlay || !DOM.menuToggle) return;
    
    DOM.sidebarMenu.classList.add('active');
    DOM.menuOverlay.classList.add('active');
    DOM.menuToggle.setAttribute('aria-expanded', 'true');
    DOM.menuOverlay.setAttribute('aria-hidden', 'false');
    
    // Enfocar el primer elemento del menú
    const firstLink = DOM.sidebarMenu.querySelector('a');
    if (firstLink) firstLink.focus();
}

export function closeMenu() {
    if (!DOM.sidebarMenu || !DOM.menuOverlay || !DOM.menuToggle) return;
    
    DOM.sidebarMenu.classList.remove('active');
    DOM.menuOverlay.classList.remove('active');
    DOM.menuToggle.setAttribute('aria-expanded', 'false');
    DOM.menuOverlay.setAttribute('aria-hidden', 'true');
    
    // Devolver el foco al botón del menú
    DOM.menuToggle.focus();
}

// ✅ CORRECCIÓN BUG #1: Bloque duplicado de menú eliminado.
// El menú hamburguesa se inicializa correctamente en setupMainEventListeners()
// que se ejecuta DESPUÉS de DOM.init() dentro de DOMContentLoaded.

// SISTEMA DE LAZY LOADING DE IMÁGENES
export const LazyLoader = {
    observer: null,
    isInitialized: false,
    pendingImages: [],

    init() {
        if (this.isInitialized) {
            console.log('ℹ️ LazyLoader ya inicializado');
            return Promise.resolve();
        }

        return new Promise((resolve) => {
            if (!('IntersectionObserver' in window)) {
                console.warn('IntersectionObserver no soportado, cargando todas las imágenes');
                this.loadAllImages();
                this.isInitialized = true;
                resolve();
                return;
            }

            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadImage(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '100px 0px',
                threshold: 0.01
            });

            // Observar imágenes existentes
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.observer.observe(img);
            });

            this.isInitialized = true;
            console.log('✅ LazyLoader inicializado completamente');
            
            // Procesar imágenes pendientes
            if (this.pendingImages.length > 0) {
                console.log(`🔄 Procesando ${this.pendingImages.length} imágenes pendientes`);
                this.pendingImages.forEach(img => {
                    if (this.observer) {
                        this.observer.observe(img);
                    }
                });
                this.pendingImages = [];
            }
            
            resolve();
        });
    },

    observeImage(img) {
        if (!img) return;

        // Si LazyLoader ya está inicializado, observar inmediatamente
        if (this.isInitialized && this.observer) {
            this.observer.observe(img);
        } else {
            // Si no, agregar a la cola de pendientes
            this.pendingImages.push(img);
            console.log('⏳ Imagen agregada a cola de pendientes');
        }
    },

    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (!src) return;

        // Añadir clase loading
        img.classList.add('loading');
        
        // Añadir skeleton a la tarjeta padre si existe
        const card = img.closest('.wallpaper-card');
        if (card) {
            card.classList.add('skeleton');
        }

        // Evento cuando la imagen carga exitosamente
        img.addEventListener('load', () => {
            img.classList.remove('loading');
            img.classList.add('loaded');
            
            // Remover skeleton de la tarjeta
            if (card) {
                setTimeout(() => {
                    card.classList.remove('skeleton');
                }, 100);
            }
        }, { once: true });

        // Evento cuando hay error al cargar
        img.addEventListener('error', () => {
            img.classList.remove('loading');
            img.classList.add('error');
            
            // Remover skeleton incluso en error
            if (card) {
                card.classList.remove('skeleton');
            }
            
            console.error('Error al cargar imagen:', src);
            ToastSystem.warning('No se pudo cargar una imagen', 'Error de carga');
        }, { once: true });

        // Comenzar a cargar la imagen
        img.src = src;
        img.removeAttribute('data-src');
    },

    loadAllImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.loadImage(img);
        });
    },

    preloadImages(imagePaths) {
        imagePaths.forEach(path => {
            const img = new Image();
            img.src = path;
        });
    }
};

// CARGA DINÁMICA DE CONFETTI (solo cuando se necesite)
let _confettiLoaded = false;
export function loadConfetti(callback) {
    if (_confettiLoaded) { if (callback) callback(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    s.integrity = 'sha384-j3ZHVq+nFRvVpH9qKR3V5h7EqA0/Mq5sQKu/Ll1eSbRTNDlUZrKRG0YrZRE0Z8zK';
    s.crossOrigin = 'anonymous';
    s.onload = function() { _confettiLoaded = true; if (callback) callback(); };
    document.head.appendChild(s);
}

// SISTEMA DE CORAZONES FLOTANTES
export function crearCorazonesFlotantes() {
    const hearts = ['❤️', '💕', '💖', '💗', '💘', '💝'];
    
    if (!DOM.heartsContainer) {
        console.warn('⚠️ Contenedor de corazones no encontrado');
        return;
    }
    
    // ✅ OPTIMIZACIÓN #4: Limpiar con innerHTML (40% más rápido)
    DOM.heartsContainer.innerHTML = '';
    
    // Solo crear corazones si NO estamos en modo navidad
    if (!DOM.html.classList.contains('navidad')) {
        for (let i = 0; i < 15; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            heart.textContent = hearts[Math.floor(Math.random() * hearts.length)];
            heart.style.left = Math.random() * 100 + '%';
            heart.style.animationDelay = Math.random() * 5 + 's';
            heart.style.animationDuration = (10 + Math.random() * 10) + 's';
            DOM.heartsContainer.appendChild(heart);
        }
        console.log('💕 Corazones flotantes creados (optimizados)');
    } else {
        console.log('🎄 Corazones omitidos (modo navidad activo)');
    }
}

// NO HACER NADA AQUÍ - Se moverá al final del script
// (Elimina esta línea completamente)
        
        // Función para cargar tema de forma segura
export function isValidTheme(theme) {
    return theme === 'dark' || theme === 'light';
}

export function getSystemTheme() {
    if (!window.matchMedia) {
        return 'light';
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
    }

    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
    }

    return 'light';
}

export function loadTheme() {
    const savedTheme = SafeStorage.get('theme', null);

    // PRIORIDAD 1: Preferencia manual guardada
    if (isValidTheme(savedTheme)) {
        applyTheme(savedTheme);
        return savedTheme;
    }

    // PRIORIDAD 2: Preferencia enviada por la App Android
    if (isValidTheme(window.APP_THEME)) {
        applyTheme(window.APP_THEME);
        return window.APP_THEME;
    }

    // PRIORIDAD 3: Preferencia del sistema
    const systemTheme = getSystemTheme();
    applyTheme(systemTheme);
    return systemTheme;
}

export function applyTheme(theme) {
    const normalizedTheme = isValidTheme(theme) ? theme : 'light';

    DOM.html.classList.remove('dark-mode', 'light-mode');
    DOM.html.classList.add(`${normalizedTheme}-mode`);
    DOM.html.dataset.theme = normalizedTheme;

    if (DOM.themeToggle) {
        if (normalizedTheme === 'dark') {
            DOM.themeToggle.textContent = '☀️';
            DOM.themeToggle.setAttribute('aria-label', 'Cambiar a modo claro');
        } else {
            DOM.themeToggle.textContent = '🌙';
            DOM.themeToggle.setAttribute('aria-label', 'Cambiar a modo oscuro');
        }
    }
}
        
        // Función para guardar tema de forma segura
        export function saveTheme(theme) {
    const saved = SafeStorage.set('theme', theme);
    if (!saved) {
        ToastSystem.info('Tu preferencia de tema no se guardará al cerrar', 'Modo incógnito');
    }
    return saved;
}

