import { SafeStorage, ToastSystem } from './utils.js';
import { filterTemplates, getCurrentFilter } from './search.js';

// SISTEMA DE FAVORITOS OPTIMIZADO
export const FavoritesManager = {
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
        if (getCurrentFilter() === 'favorites') {
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

