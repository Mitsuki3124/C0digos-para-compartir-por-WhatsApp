export const DOM = {
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

