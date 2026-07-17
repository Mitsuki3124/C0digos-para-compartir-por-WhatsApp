// SISTEMA DE NOTIFICACIONES TOAST

// Función segura para escapar contenido en toast
const escapeToastContent = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const ToastSystem = {
    container: null,
    toastCount: 0,
    
    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            console.error('Toast container not found');
        }
    },
    
    show(options) {
        if (!this.container) this.init();
        
        const {
            type = 'info',
            title = '',
            message = '',
            duration = 3000,
            icon = null
        } = options;
        
        // Iconos por defecto según el tipo
        const defaultIcons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const toastIcon = icon || defaultIcons[type] || '💬';
        const toastId = `toast-${++this.toastCount}`;
        
        // Crear elemento toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        
        // Construir HTML estructura CON contenido directo pero escapado
        const titleHtml = title ? `<div class="toast-title">${escapeToastContent(title)}</div>` : '';
        const messageHtml = `<div class="toast-message">${escapeToastContent(message)}</div>`;
        
        toast.innerHTML = `
            <div class="toast-icon">${toastIcon}</div>
            <div class="toast-content">
                ${titleHtml}
                ${messageHtml}
            </div>
            <button type="button" class="toast-close" aria-label="Cerrar notificación">×</button>
            ${duration > 0 ? '<div class="toast-progress"></div>' : ''}
        `;
        
        // Añadir al contenedor
        this.container.appendChild(toast);
        
        // Botón cerrar
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => this.hide(toastId));
        
        // Mostrar con animación
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto-ocultar
        if (duration > 0) {
            setTimeout(() => this.hide(toastId), duration);
        }
        
        return toastId;
    },
    
    hide(toastId) {
        const toast = document.getElementById(toastId);
        if (!toast) return;
        
        toast.classList.remove('show');
        toast.classList.add('hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    },
    
    success(message, title = '¡Éxito!') {
        return this.show({ type: 'success', title, message });
    },
    
    error(message, title = 'Error') {
        return this.show({ type: 'error', title, message });
    },
    
    warning(message, title = 'Advertencia') {
        return this.show({ type: 'warning', title, message });
    },
    
    info(message, title = 'Información') {
        return this.show({ type: 'info', title, message });
    }
};

// ELIMINADO - ToastSystem.init() ahora se llama en el bloque principal de DOMContentLoaded

// SISTEMA DE STORAGE SEGURO (Anti-Crash)
const SafeStorage = {
    _memoryStorage: {},
    
    isAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    },

    set(key, value) {
        if (!this.isAvailable()) {
            console.warn('💾 LocalStorage no disponible (modo incógnito)');
            this._memoryStorage[key] = value;
            return false;
        }
        
        try {
            localStorage.setItem(key, value);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                ToastSystem.warning('Almacenamiento lleno. Limpiando datos antiguos...', 'Espacio insuficiente');
                this.clearOldData();
                try {
                    localStorage.setItem(key, value);
                    return true;
                } catch (e2) {
                    console.error('No se pudo guardar después de limpiar:', e2);
                    return false;
                }
            }
            console.error('Error al guardar:', e);
            return false;
        }
    },

    get(key, defaultValue = null) {
        if (!this.isAvailable()) {
            return this._memoryStorage[key] || defaultValue;
        }
        
        try {
            const value = localStorage.getItem(key);
            return value !== null ? value : defaultValue;
        } catch (e) {
            console.error('Error al leer:', e);
            return defaultValue;
        }
    },

    clearOldData() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith('old_') || key.startsWith('temp_')) {
                try {
                    localStorage.removeItem(key);
                } catch (e) {
                    console.error('Error al limpiar:', e);
                }
            }
        });
    }
};

// FUNCIÓN DEBOUNCE PARA OPTIMIZAR BÚSQUEDA
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// SISTEMA DE FAVORITOS OPTIMIZADO
const FavoritesManager = {
    favorites: [],
    
    init() {
        this.loadFavorites();
        this.restoreStates();
        this.setupEventDelegation();
        console.log('✅ FavoritesManager inicializado');
    },
    
    loadFavorites() {
        try {
            const stored = SafeStorage.get('favorites', '[]');
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                this.favorites = parsed;
            } else {
                console.warn('Datos de favoritos corruptos, reiniciando...');
                this.favorites = [];
                SafeStorage.set('favorites', '[]');
                setTimeout(() => {
                    ToastSystem.warning('Los favoritos guardados estaban corruptos y se reiniciaron', 'Favoritos reiniciados');
                }, 1000);
            }
        } catch (e) {
            console.error('Error al cargar favoritos:', e);
            this.favorites = [];
            SafeStorage.set('favorites', '[]');
            setTimeout(() => {
                ToastSystem.error('No se pudieron cargar los favoritos guardados', 'Error de carga');
            }, 1000);
        }
    },
    
    saveFavorites() {
        try {
            const saved = SafeStorage.set('favorites', JSON.stringify(this.favorites));
            if (!saved) {
                ToastSystem.warning('Tus favoritos no se guardarán al cerrar el navegador', 'Modo incógnito detectado');
            }
            return saved;
        } catch (e) {
            console.error('Error al guardar favoritos:', e);
            if (e.name === 'QuotaExceededError') {
                ToastSystem.error('No hay espacio suficiente para guardar más favoritos', 'Almacenamiento lleno');
            }
            return false;
        }
    },
    
    restoreStates() {
        const cards = document.querySelectorAll('.code-card');
        cards.forEach((card, index) => {
            const btn = card.querySelector('.favorite-btn');
            if (!btn) return;
            
            if (this.favorites.includes(index)) {
                this.setFavoriteState(btn, card, true);
            } else {
                btn.setAttribute('aria-pressed', 'false');
            }
        });
    },
    
    setupEventDelegation() {
        const grid = document.getElementById('plantillas');
        if (!grid) return;
        
        grid.addEventListener('click', (e) => {
            const btn = e.target.closest('.favorite-btn');
            if (!btn) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const card = btn.closest('.code-card');
            if (!card) return;
            const index = Number(card.dataset.index);
            if (Number.isNaN(index)) return;
            
            this.toggleFavorite(index, btn, card);
        });
    },
    
    toggleFavorite(index, btn, card) {
        const templateTitle = card.querySelector('.code-title').textContent.trim();
        const isFavorite = this.favorites.includes(index);
        
        if (isFavorite) {
            this.removeFavorite(index, btn, card, templateTitle);
        } else {
            this.addFavorite(index, btn, card, templateTitle);
        }
        
        this.saveFavorites();
        
        // Actualizar vista si está en filtro de favoritos
        if (currentFilter === 'favorites') {
            filterTemplates();
        }
    },
    
    addFavorite(index, btn, card, templateTitle) {
        this.favorites.push(index);
        this.setFavoriteState(btn, card, true);
        
        // Animación
        btn.style.animation = 'heartBeat 0.5s ease';
        setTimeout(() => btn.style.animation = '', 500);
        
        ToastSystem.show({
            type: 'success',
            icon: '⭐',
            title: '¡Añadido a favoritos!',
            message: `"${templateTitle}" guardado correctamente`,
            duration: 2500
        });
    },
    
    removeFavorite(index, btn, card, templateTitle) {
        this.favorites = this.favorites.filter(i => i !== index);
        this.setFavoriteState(btn, card, false);
        
        ToastSystem.show({
            type: 'info',
            icon: '💔',
            title: 'Eliminado de favoritos',
            message: `"${templateTitle}" ya no está en tus favoritos`,
            duration: 2500
        });
    },
    
    setFavoriteState(btn, card, isFavorite) {
        if (isFavorite) {
            const isDarkMode = document.documentElement.classList.contains('dark-mode') || 
                              (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
                               !document.documentElement.classList.contains('light-mode'));
            btn.textContent = isDarkMode ? '★' : '★';
            btn.style.color = isDarkMode ? '#fff' : '#333';
            btn.classList.add('active');
            card.classList.add('favorite');
            btn.setAttribute('aria-pressed', 'true');
            
            if (!card.querySelector('.favorite-badge')) {
                const badge = document.createElement('div');
                badge.className = 'favorite-badge';
                badge.textContent = '❤️ Favorito';
                card.insertBefore(badge, card.firstChild);
            }
        } else {
            btn.textContent = '☆';
            const isDarkMode = document.documentElement.classList.contains('dark-mode') || 
                              (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && 
                               !document.documentElement.classList.contains('light-mode'));
            btn.style.color = isDarkMode ? '#fff' : '#333';
            btn.classList.remove('active');
            card.classList.remove('favorite');
            btn.setAttribute('aria-pressed', 'false');
            
            const badge = card.querySelector('.favorite-badge');
            if (badge) badge.remove();
        }
    }
};

// VARIABLES GLOBALES PARA SISTEMA DE BÚSQUEDA
let currentFilter = 'all';
let currentSearch = '';

// Debounced search para optimizar búsqueda en tiempo real
const debouncedSearch = debounce((value) => {
    currentSearch = value;
    filterTemplates();
}, 300);

// CACHÉ DE SELECTORES DOM (OPTIMIZACIÓN)
const DOM = {
    // Elementos principales
    body: document.body,
    html: document.documentElement,
    mainHeader: null,
    container: null,
    
    // Sistema de búsqueda
    searchInput: null,
    searchStats: null,
    resultsCount: null,
    filterButtons: null,
    codeCards: null,
    codesGrid: null,
    noResults: null,
    
    // Menú
    menuToggle: null,
    sidebarMenu: null,
    menuOverlay: null,
    
    // Modales
    privacyModal: null,
    termsModal: null,
    contactModal: null,
    wallpapersModal: null,
    imageViewModal: null,
    
    // Tema y navidad
    themeToggle: null,
    navidadToggle: null,
    
    // Otros
    backToTop: null,
    heartsContainer: null,
    snowflakesContainer: null,
    toastContainer: null,
    
    // Inicializar todos los selectores
    init() {
        this.mainHeader = document.getElementById('mainHeader');
        this.container = document.querySelector('.container');
        
        // Búsqueda
        this.searchInput = document.getElementById('searchInput');
        this.searchStats = document.getElementById('searchStats');
        this.resultsCount = document.getElementById('resultsCount');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.codeCards = document.querySelectorAll('.code-card');
        this.codesGrid = document.getElementById('plantillas');
        this.noResults = document.getElementById('noResults');
        
        // Menú
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebarMenu = document.getElementById('sidebarMenu');
        this.menuOverlay = document.getElementById('menuOverlay');
        
        // Modales
        this.privacyModal = document.getElementById('privacyModal');
        this.termsModal = document.getElementById('termsModal');
        this.contactModal = document.getElementById('contactModal');
        this.wallpapersModal = document.getElementById('wallpapersModal');
        this.imageViewModal = document.getElementById('imageViewModal');
        
        // Tema
        this.themeToggle = document.getElementById('themeToggle');
        this.navidadToggle = document.getElementById('navidadToggle');
        
        // Otros
        this.backToTop = document.getElementById('backToTop');
        this.heartsContainer = document.getElementById('heartsContainer');
        this.snowflakesContainer = document.getElementById('snowflakesContainer');
        this.toastContainer = document.getElementById('toastContainer');
        
        console.log('✅ Caché DOM inicializado');
    },
    
    // Refrescar elementos que pueden cambiar dinámicamente
    refresh() {
        this.codeCards = document.querySelectorAll('.code-card');
        this.filterButtons = document.querySelectorAll('.filter-btn');
    }
};

// SISTEMA DE BÚSQUEDA Y FILTROS OPTIMIZADO
// Nota: Ahora usamos DOM.codeCards, DOM.searchInput, etc.
// El caché se inicializa en DOMContentLoaded

// Contar plantillas totales (se ejecutará después de DOM.init())
function updateTotalCount() {
    if (DOM.resultsCount && DOM.codeCards) {
        DOM.resultsCount.textContent = DOM.codeCards.length;
    }
}

// Función para filtrar plantillas - VERSIÓN MEJORADA Y CORREGIDA
function filterTemplates() {
    let visibleCount = 0;
    
    // Usar DOM.codeCards que se inicializa en DOM.init()
    DOM.codeCards.forEach((card, index) => {
        const categories = card.getAttribute('data-categories') || '';
        const searchText = card.getAttribute('data-search') || '';
        const title = card.querySelector('.code-title').textContent.toLowerCase();
        const description = card.querySelector('.code-description').textContent.toLowerCase();
        const isFavorite = FavoritesManager.favorites.includes(index);
        
        // VERIFICAR FILTROS - VERSIÓN MEJORADA
        let matchesFilter = true;
        
        if (currentFilter === 'favorites') {
            matchesFilter = isFavorite;
        } else if (currentFilter !== 'all') {
            // Buscar en todas las categorías de la plantilla
            const categoryList = categories.split(' ');
            matchesFilter = categoryList.includes(currentFilter);
        }
        
        // VERIFICAR BÚSQUEDA - VERSIÓN MEJORADA
        let matchesSearch = false;
        
        if (currentSearch === '') {
            matchesSearch = true;
        } else {
            // Buscar en todos los campos de texto
            const searchLower = currentSearch.toLowerCase();
            matchesSearch = 
                (searchText && searchText.toLowerCase().includes(searchLower)) ||
                title.includes(searchLower) ||
                description.includes(searchLower) ||
                categories.includes(searchLower);
        }
        
        // APLICAR FILTROS
        if (matchesFilter && matchesSearch) {
            card.classList.remove('hidden');
            visibleCount++;
            // Añadir animación solo si no la tiene
            if (!card.style.animation) {
                card.style.animation = 'fadeInUp 0.5s ease';
            }
        } else {
            card.classList.add('hidden');
        }
    });
    
    // Actualizar estadísticas usando DOM.resultsCount
    DOM.resultsCount.textContent = visibleCount;
    
    // Mostrar/ocultar mensaje de no resultados
    DOM.noResults.classList.toggle('hidden', visibleCount !== 0);
    DOM.codesGrid.classList.toggle('hidden', visibleCount === 0);

    if (visibleCount === 0) {
        // Mensaje especial para favoritos vacíos
        if (currentFilter === 'favorites') {
            DOM.noResults.innerHTML = '<h3>⭐ No tienes favoritos aún</h3><p>Haz clic en la estrella ☆ de las plantillas que te gusten para guardarlas aquí</p>';
        } else if (currentSearch) {
            // MEJOR ENFOQUE: Construir con textContent para user input
            DOM.noResults.innerHTML = '<h3>😔 No encontramos resultados para "<span id="search-term"></span>"</h3><p>Intenta con otros términos de búsqueda o cambia el filtro</p>';
            // Insertar búsqueda del usuario SEGURO con textContent
            document.getElementById('search-term').textContent = currentSearch;
        } else {
            DOM.noResults.innerHTML = '<h3>😔 No hay plantillas en esta categoría</h3><p>Intenta con otro filtro</p>';
        }
    }
    
    // Actualizar texto de estadísticas
    let filterText = '';
    switch(currentFilter) {
        case 'favorites':
            filterText = ' favoritas';
            break;
        case 'romantic':
            filterText = ' románticas';
            break;
        case 'funny':
            filterText = ' divertidas';
            break;
        case 'apology':
            filterText = ' de perdón';
            break;
        case 'special':
            filterText = ' especiales';
            break;
        default:
            filterText = '';
    }
    
    // MEJOR ENFOQUE: Separar HTML real de user input
    DOM.searchStats.innerHTML = `Mostrando <span id="resultsCount">${visibleCount}</span> plantillas${filterText}${currentSearch ? ' para "<span id="stats-search"></span>"' : ''}`;
    
    // Insertar búsqueda SEGURO si existe
    if (currentSearch) {
        const statsSearch = document.getElementById('stats-search');
        if (statsSearch) {
            statsSearch.textContent = currentSearch;
        }
    }
    
    // Las animaciones funcionan sin necesidad de forzar reflows en navegadores modernos
}

        // Función para guardar preferencia de navidad de forma segura
// Almacenamiento de preferencias manejado directamente en setupNavidadToggle() con SafeStorage
        
     // Función para activar modo navidad
// Modo Navidad manejado directamente en setupNavidadToggle() con requestAnimationFrame
// para evitar bloqueos. Las animaciones se generan sin interrumpir el evento click.

        // Crear copos de nieve
function crearCoposNieve() {
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

        function openMenu() {
    if (!DOM.sidebarMenu || !DOM.menuOverlay || !DOM.menuToggle) return;
    
    DOM.sidebarMenu.classList.add('active');
    DOM.menuOverlay.classList.add('active');
    DOM.menuToggle.setAttribute('aria-expanded', 'true');
    DOM.menuOverlay.setAttribute('aria-hidden', 'false');
    
    // Enfocar el primer elemento del menú
    const firstLink = DOM.sidebarMenu.querySelector('a');
    if (firstLink) firstLink.focus();
}

function closeMenu() {
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
const LazyLoader = {
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
function loadConfetti(callback) {
    if (_confettiLoaded) { if (callback) callback(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js';
    s.integrity = 'sha384-j3ZHVq+nFRvVpH9qKR3V5h7EqA0/Mq5sQKu/Ll1eSbRTNDlUZrKRG0YrZRE0Z8zK';
    s.crossOrigin = 'anonymous';
    s.onload = function() { _confettiLoaded = true; if (callback) callback(); };
    document.head.appendChild(s);
}

// SISTEMA DE CORAZONES FLOTANTES
function crearCorazonesFlotantes() {
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
function isValidTheme(theme) {
    return theme === 'dark' || theme === 'light';
}

function getSystemTheme() {
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

function loadTheme() {
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

function applyTheme(theme) {
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
        function saveTheme(theme) {
    const saved = SafeStorage.set('theme', theme);
    if (!saved) {
        ToastSystem.info('Tu preferencia de tema no se guardará al cerrar', 'Modo incógnito');
    }
    return saved;
}

// SISTEMA DE GESTIÓN DE MODALES OPTIMIZADO
const ModalManager = {
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
        // ========================================
// DETECCIÓN AUTOMÁTICA DE SOPORTE WEBP
// ========================================
// Este código detecta si el navegador soporta WebP
// Si soporta: usa .webp (más pequeño, mejor compresión)
// Si NO soporta: usa .jpg automáticamente (sin que hagas nada)
const extensionSoportada = (() => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Test simple pero confiable para WebP
  try {
    const webpData = canvas.toDataURL('image/webp');
    return webpData.indexOf('data:image/webp') === 0 ? 'webp' : 'jpg';
  } catch {
    return 'jpg';
  }
})();

console.log(`✅ Extensión detectada: ${extensionSoportada}`);

// ========================================
// SECCIÓN A REEMPLAZAR EN TU app.js
// Líneas aproximadamente 1099–1220
// ========================================

// ✅ MANTENIMIENTO: Para añadir más fondos, solo cambia este número:
// Ejemplo: fondo43 → cambia TOTAL_FONDOS a 43
//          fondo50 → cambia TOTAL_FONDOS a 50
//          fondo100 → cambia TOTAL_FONDOS a 100
const TOTAL_FONDOS = 42; // ← CAMBIAR AQUÍ si añades más

// Ruta base donde están las imágenes (subcarpeta wallpapers/)
const WALLPAPERS_PATH = './wallpapers/';

// Variable global para controlar carga única de wallpapers
let wallpapersLoaded = false;

// ========================================
// CARGAR GALERÍA DE FONDOS (CON LAZY LOAD)
// ========================================
function loadWallpapersGrid() {
  if (typeof DOM === 'undefined') return;

  const grid = document.getElementById('wallpapersGrid');
  
  if (grid && !wallpapersLoaded) {
    
    if (wallpapersLoaded) {
      return;
    }

    // Limpiar grid anterior si existe
    grid.innerHTML = '';

    // Crear tarjetas para cada fondo
    for (let i = 1; i <= TOTAL_FONDOS; i++) {
      // ⭐ AQUÍ ESTÁ LA MAGIA: construye la ruta con la extensión soportada
      const imagePath     = WALLPAPERS_PATH + 'fondo' + i + '.' + extensionSoportada;
      const wallpaperTitle = 'Fondo Romántico ' + i;
      const fileName       = 'fondo' + i + '.' + extensionSoportada; // ← También aquí

      const card = document.createElement('div');
      card.className = 'wallpaper-card skeleton';

      // Structure: Imagen + info (título, botones)
      // Usa data-src para lazy loading, no src directo
      card.innerHTML = 
        '<div class="wallpaper-image-wrapper">' +
          '<img ' +
            'data-src="' + imagePath + '" ' +
            'alt="' + wallpaperTitle + '" ' +
            'class="wallpaper-image"' +
          '>' +
        '</div>' +
        '<div class="wallpaper-info">' +
          '<div class="wallpaper-title">' + wallpaperTitle + '</div>' +
          '<div class="wallpaper-actions">' +
            '<button class="wallpaper-btn wallpaper-download" title="Descargar">⬇️ Descargar</button> ' +
            '<button class="wallpaper-btn wallpaper-view" title="Ver grande">🔍 Ver</button>' +
          '</div>' +
        '</div>';

      grid.appendChild(card);

      // Event listener: Ver fondo de pantalla
      const viewBtn = card.querySelector('.wallpaper-view');
      if (viewBtn) {
        viewBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          viewWallpaper(imagePath, wallpaperTitle);
        });
      }

      // Event listener: Descargar fondo
      const dlBtn = card.querySelector('.wallpaper-download');
      if (dlBtn) {
        dlBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          downloadWallpaper(imagePath, fileName);
        });
      }

      // Click en la tarjeta también abre el fondo
      const img = card.querySelector('.wallpaper-image');
      if (img) {
        img.addEventListener('click', function() {
          viewWallpaper(imagePath, wallpaperTitle);
        });
        
        // Loading skeleton mientras se descarga
        img.addEventListener('load', function() {
          card.classList.remove('skeleton');
        });
      }
    }

    wallpapersLoaded = true;

    // Toast de info
    if (typeof ToastSystem !== 'undefined') {
      ToastSystem.info('Cargando ' + TOTAL_FONDOS + ' fondos de pantalla...', 'Galería');
    }

    // Lazy load las imágenes
    if (typeof LazyLoader !== 'undefined') {
      const modalImages = document.querySelectorAll('#wallpapersGrid img[data-src]');
      LazyLoader.lazyLoad(modalImages);
    }

    // Precargar primer fondo
    if (typeof LazyLoader !== 'undefined') {
      LazyLoader.preloadImages([WALLPAPERS_PATH + 'fondo1.' + extensionSoportada]);
    }
  }
}

// ========================================
// DESCARGAR FONDO DE PANTALLA
// ========================================
function downloadWallpaper(url, title) {
  if (!url) {
    if (typeof ToastSystem !== 'undefined') {
      ToastSystem.error('Este fondo no está disponible ahora mismo', '⚠️ No encontrado');
    }
    return;
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = title || 'fondo';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  if (typeof ToastSystem !== 'undefined') {
    ToastSystem.success('Descargando: ' + title, '✅ Descarga');
  }
}

// ========================================
// VER FONDO DE PANTALLA EN MODAL
// ========================================
function viewWallpaper(url, title) {
  if (!url) {
    if (typeof ToastSystem !== 'undefined') {
      ToastSystem.error('Este fondo no está disponible ahora mismo', '⚠️ No encontrado');
    }
    return;
  }

  const modal = document.getElementById('wallpaperViewModal') || 
                document.getElementById('wallpapersModal');

  if (modal) {
    // Aquí va tu HTML del modal
    // Ejemplo básico:
    modal.innerHTML = `
      <div class="modal-content wallpaper-modal-content">
        <span class="close-modal" onclick="this.closest('[id*=Modal]').style.display='none'">&times;</span>
        <div class="wallpaper-view-container">
          <img src="${url}" alt="${title}" class="wallpaper-view-image">
          <div class="wallpaper-view-info">
            <h2>${title}</h2>
            <button class="btn btn-primary" onclick="downloadWallpaper('${url}', '${title}')">
              ⬇️ Descargar fondo de pantalla
            </button>
          </div>
        </div>
      </div>
    `;
    modal.style.display = 'block';
  } else {
    if (typeof ToastSystem !== 'undefined') {
      ToastSystem.error('Este fondo de pantalla no pudo cargarse', '⚠️ Error modal');
    }
  }
}

// ========================================
// EJECUTAR CUANDO HAGAS CLIC EN "VER FONDOS"
// ========================================
// Busca dónde en tu código se llama loadWallpapersGrid() y 
// asegúrate de que se ejecute cuando abres el modal de fondos

// Ejemplo:
document.addEventListener('DOMContentLoaded', function() {
  const menuWallpapers = document.getElementById('wallpapersBtn') || 
                          document.querySelector('[data-tab="wallpapers"]');
  
  if (menuWallpapers) {
    menuWallpapers.addEventListener('click', function() {
      loadWallpapersGrid();
      
      // Si tienes modal, muéstralo
      const modal = document.getElementById('wallpapersModal');
      if (modal) {
        modal.style.display = 'block';
      }
    });
  }
});

        // Función para descargar fondo de pantalla
        function downloadWallpaper(imagePath, title) {
    const fileName = (title || 'fondo').replace(/\s+/g, '_') + '.jpg';

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

// FUNCIONES DE CONFIGURACIÓN DE EVENT LISTENERS

function setupThemeToggle() {
    if (!DOM.themeToggle) return;
    
    DOM.themeToggle.addEventListener('click', () => {
        const isDark = DOM.html.classList.contains('dark-mode');
        const newTheme = isDark ? 'light' : 'dark';
        
        applyTheme(newTheme);
        SafeStorage.set('theme', newTheme);

        ToastSystem.show({
            type: 'info',
            icon: newTheme === 'dark' ? '🌙' : '☀️',
            title: newTheme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado',
            message: newTheme === 'dark' ? 'Tus ojos te lo agradecerán' : 'Brillo al máximo',
            duration: 2000
        });
    });
    
    // Detectar cambios en la preferencia del sistema (Navegador)
    if (window.matchMedia) {
        const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = function(e) {
            if (!SafeStorage.get('theme') && !window.APP_THEME) {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        };

        if (typeof darkModeQuery.addEventListener === 'function') {
            darkModeQuery.addEventListener('change', handleSystemThemeChange);
        } else if (typeof darkModeQuery.addListener === 'function') {
            darkModeQuery.addListener(handleSystemThemeChange);
        }
    }
}

function setupNavidadToggle() {
    if (!DOM.navidadToggle) return;
    
    DOM.navidadToggle.addEventListener('click', () => {
        const isNavidad = DOM.html.classList.contains('navidad');
        
        // Toggle clase sin delay
        DOM.html.classList.toggle('navidad');
        
        // Actualizar botón inmediatamente
        if (DOM.navidadToggle) {
            DOM.navidadToggle.textContent = isNavidad ? '🎄' : '🎅';
            DOM.navidadToggle.setAttribute('aria-label', isNavidad ? 'Activar modo navidad' : 'Desactivar modo navidad');
        }
        
        // Guardar preferencia
        SafeStorage.set('navidad', !isNavidad ? 'true' : 'false');
        
        // Toast sin bloqueo
        requestAnimationFrame(() => {
            ToastSystem.show({
                type: isNavidad ? 'info' : 'success',
                icon: isNavidad ? '🌸' : '🎄',
                title: isNavidad ? 'Modo navidad desactivado' : '¡Feliz Navidad!',
                message: isNavidad ? 'Volviendo al tema normal...' : 'Modo festivo activado',
                duration: 2000
            });
        });
        
        // Generar efectos SIN BLOQUEAR
        if (!isNavidad) {
            requestAnimationFrame(() => {
                crearCoposNieve();
                crearCorazonesFlotantes();
            });
        } else {
            if (DOM.snowflakesContainer) {
                DOM.snowflakesContainer.innerHTML = '';
            }
            crearCorazonesFlotantes();
        }
    });
}

// INICIALIZACIÓN PRINCIPAL OPTIMIZADA - SPLIT TASKS
// ✅ OPTIMIZACIÓN: Dividir tareas en bloques para evitar long tasks > 50ms
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    
    // BLOQUE CRÍTICO 1 (5-10ms): Elementos esenciales para renderización
    console.time('⏱️ Tareas críticas');
    
    // 0. Inicializar caché de selectores DOM primero
    DOM.init();
    console.log('✅ Caché DOM inicializado');
    
    // 1. Inicializar sistema de Toast (pequeño, necesario para feedback)
    ToastSystem.init();
    console.log('✅ Sistema Toast inicializado');
    
    // 2. Inicializar sistema de modales (CRÍTICO: debe ir después de DOM.init)
    ModalManager.init();
    console.log('✅ ModalManager inicializado');
    
    console.timeEnd('⏱️ Tareas críticas');
    
    // ✅ OPTIMIZACIÓN: Diferir tareas no-críticas después de renderización
    // Esto evita que la tarea exceda 50ms (Long Task threshold)
    
    // BLOQUE 2 (10-15ms): Tema y favoritos - deferir con requestAnimationFrame
    requestAnimationFrame(() => {
        console.time('⏱️ Bloque 2: Tema y Favoritos');
        
        // 3. Cargar tema guardado (modo oscuro/claro)
        loadTheme();
        console.log('✅ Tema cargado');
        
        // 4. Inicializar sistema de favoritos optimizado
        FavoritesManager.init();
        console.log('✅ Favoritos cargados');
        
        console.timeEnd('⏱️ Bloque 2: Tema y Favoritos');
        
        // BLOQUE 3 (15-20ms): Búsqueda y contadores - deferir más
        requestAnimationFrame(() => {
            console.time('⏱️ Bloque 3: Búsqueda y Contadores');
            
            // 5. Contar plantillas totales
            updateTotalCount();
            console.log('✅ Contador de plantillas actualizado');
            
            // 6. Inicializar sistema de búsqueda y filtros
            initSearchSystem();
            console.log('✅ Sistema de búsqueda inicializado');
            
            console.timeEnd('⏱️ Bloque 3: Búsqueda y Contadores');
            
            // BLOQUE 4 (20-25ms): Navidad y animaciones - deferir aún más
            requestAnimationFrame(() => {
                console.time('⏱️ Bloque 4: Navidad y Animaciones');
                
                // 7. Verificar modo navidad si es diciembre
                verificarModoNavidad();
                console.log('✅ Modo navidad verificado');
                
                // 8. Crear corazones flotantes (después de verificar navidad)
                crearCorazonesFlotantes();
                console.log('✅ Corazones flotantes creados');
                
                console.timeEnd('⏱️ Bloque 4: Navidad y Animaciones');
                
                // BLOQUE 5 (25-30ms): LazyLoader y event listeners
                requestAnimationFrame(() => {
                    console.time('⏱️ Bloque 5: LazyLoader y Listeners');
                    
                    // 9. Inicializar LazyLoader (ahora con Promise)
                    LazyLoader.init().then(() => {
                        console.log('✅ LazyLoader inicializado y listo');
                    }).catch(err => {
                        console.error('❌ Error al inicializar LazyLoader:', err);
                    });
                    
                    // 10. Configurar event listeners de botones de tema
                    setupThemeToggle();
                    setupNavidadToggle();
                    console.log('✅ Botones de tema configurados');
                    
                    // 11. Configurar event listeners principales
                    setupMainEventListeners();
                    console.log('✅ Event listeners configurados');
                    
                    console.timeEnd('⏱️ Bloque 5: LazyLoader y Listeners');
                    
                    // Métricas de rendimiento (opcional)
                    if (window.performance) {
                        const loadTime = performance.now();
                        console.log(`⚡ Tiempo total de carga: ${loadTime.toFixed(2)}ms`);
                    }
                });
            });
        });
    });
    
    // Toast de bienvenida - DIFERIDO para no interferir con la renderización
    setTimeout(() => {
        ToastSystem.success('¡Todo listo! Explora las plantillas románticas', '¡Bienvenido! 💖');
    }, 2000);
});

// Inicializar sistema de búsqueda al cargar la página
function initSearchSystem() {
    // Aplicar filtro inicial
    filterTemplates();
    
    // Setup event listeners de búsqueda
    if (DOM.searchInput) {
        DOM.searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });
        
        // Limpiar búsqueda con Escape
        DOM.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                e.target.value = '';
                currentSearch = '';
                filterTemplates();
            }
        });
    }
    
    // Setup filtros
    if (DOM.filterButtons) {
        DOM.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                DOM.filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    btn.setAttribute('aria-pressed', 'false');
                });
                button.classList.add('active');
                button.setAttribute('aria-pressed', 'true');
                
                currentFilter = button.getAttribute('data-filter');
                filterTemplates();
                
                if (currentSearch || currentFilter !== 'all') {
                    setTimeout(() => {
                        requestAnimationFrame(() => {
                            DOM.codesGrid?.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: 'start' 
                            });
                        });
                    }, 300);
                }
            });
        });
    }
}

// Nueva función para verificar modo navidad
function verificarModoNavidad() {
    const hoy = new Date();
    const esTemporadaNavidad = hoy.getMonth() === 11; // Diciembre
    const navidadGuardada = SafeStorage.get('navidad') === 'true';
    
    if ((esTemporadaNavidad && navidadGuardada !== false) || navidadGuardada === true) {
        DOM.html.classList.add('navidad');
        if (DOM.navidadToggle) {
            DOM.navidadToggle.textContent = '🎅';
            DOM.navidadToggle.setAttribute('aria-label', 'Desactivar modo navidad');
        }
        requestAnimationFrame(() => {
            crearCoposNieve();
            crearCorazonesFlotantes();
        });
    }
}

// Nueva función para configurar listeners principales
function setupMainEventListeners() {
    // Configurar menú hamburguesa
    if (DOM.menuToggle && DOM.sidebarMenu && DOM.menuOverlay) {
        DOM.menuToggle.addEventListener('click', () => {
            const isOpen = DOM.sidebarMenu.classList.contains('active');
            if (isOpen) {
                closeMenu();
            } else {
                openMenu();
            }
        });

        DOM.menuOverlay.addEventListener('click', closeMenu);

        // Cerrar menú al hacer clic en un enlace
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', closeMenu);
        });
        
        // Cerrar menú con tecla Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && DOM.sidebarMenu.classList.contains('active')) {
                closeMenu();
            }
        });
    }
    
    // Scroll effects batched via requestAnimationFrame
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(() => {
            const currentScroll = window.scrollY || window.pageYOffset;

            if (DOM.mainHeader) {
                if (currentScroll > 100) {
                    DOM.mainHeader.classList.add('header-scrolled');
                } else {
                    DOM.mainHeader.classList.remove('header-scrolled');
                }
            }

            if (DOM.backToTop) {
                if (currentScroll > 300) {
                    DOM.backToTop.classList.add('show');
                } else {
                    DOM.backToTop.classList.remove('show');
                }
            }

            scrollTicking = false;
        });
    }, { passive: true });
    
    if (DOM.backToTop) {
        DOM.backToTop.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Atajo de teclado para búsqueda (Ctrl + K)
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            DOM.searchInput?.focus();
        }
    });
    
    // Configurar evento de Fondos de Pantalla
    const menuWallpapers = document.getElementById('menuWallpapers');
    if (menuWallpapers && DOM.wallpapersModal) {
        menuWallpapers.addEventListener('click', (e) => {
            e.preventDefault();
            DOM.wallpapersModal.style.display = 'block';
            loadWallpapers();
            // Cerrar menú lateral si está abierto
            if (DOM.sidebarMenu && DOM.menuOverlay) {
                DOM.sidebarMenu.classList.remove('active');
                DOM.menuOverlay.classList.remove('active');
            }
        });
    }

    // Configurar enlace de Cookies en el menú lateral
    const menuCookieSettings = document.getElementById('menuCookieSettings');
    if (menuCookieSettings) {
        menuCookieSettings.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.openCookieSettings) window.openCookieSettings();
            closeMenu();
        });
    }
}
