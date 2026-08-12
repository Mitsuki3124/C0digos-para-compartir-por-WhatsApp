// SISTEMA DE NOTIFICACIONES TOAST

// Función segura para escapar contenido en toast
const escapeToastContent = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

export const ToastSystem = {
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
export const SafeStorage = {
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
export function debounce(func, wait) {
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

