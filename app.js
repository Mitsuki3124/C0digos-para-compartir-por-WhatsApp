import { ToastSystem, SafeStorage } from './utils.js';
import { DOM } from './dom.js';
import { FavoritesManager } from './favorites.js';
import { updateTotalCount, filterTemplates, currentSearch, currentFilter, setCurrentSearch, setCurrentFilter } from './search.js';
import { ModalManager, loadWallpapers } from './share.js';
import { LazyLoader, loadTheme, applyTheme, crearCoposNieve, crearCorazonesFlotantes, closeMenu, openMenu } from './theme.js';

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
                setCurrentSearch('');
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
                
                setCurrentFilter(button.getAttribute('data-filter'));
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
