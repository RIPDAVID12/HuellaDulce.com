document.addEventListener('DOMContentLoaded', () => {
    // 1. MENÚ HAMBURGUESA GLOBAL
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            menuToggle.textContent = navMenu.classList.contains('active') ? '✕' : '☰';
        });

        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.textContent = '☰';
            }
        });
    }
});
