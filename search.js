import { DOM } from './dom.js';
import { debounce } from './utils.js';
import { FavoritesManager } from './favorites.js';

// VARIABLES GLOBALES PARA SISTEMA DE BÚSQUEDA
export let currentFilter = 'all';
export let currentSearch = '';

// Debounced search para optimizar búsqueda en tiempo real
const debouncedSearch = debounce((value) => {
    currentSearch = value;
    filterTemplates();
}, 300);

// SISTEMA DE BÚSQUEDA Y FILTROS OPTIMIZADO
// Nota: Ahora usamos DOM.codeCards, DOM.searchInput, etc.
// El caché se inicializa en DOMContentLoaded

// Contar plantillas totales (se ejecutará después de DOM.init())
export function updateTotalCount() {
    if (DOM.resultsCount && DOM.codeCards) {
        DOM.resultsCount.textContent = DOM.codeCards.length;
    }
}

// Función para filtrar plantillas - VERSIÓN MEJORADA Y CORREGIDA
export function filterTemplates() {
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

export function getCurrentFilter() { return currentFilter; }
export function setCurrentFilter(value) { currentFilter = value; }
export function getCurrentSearch() { return currentSearch; }
export function setCurrentSearch(value) { currentSearch = value; }
