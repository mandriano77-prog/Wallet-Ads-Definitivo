/**
 * Sidebar — mobile drawer + backdrop (<768px). Desktop unchanged.
 */
(function (global) {
    var MOBILE_MQ = '(max-width: 767px)';

    function isMobileSidebar() {
        try {
            return window.matchMedia(MOBILE_MQ).matches;
        } catch (_) {
            return false;
        }
    }

    function bindMobileSidebar() {
        if (document.documentElement.getAttribute('data-app') === 'filodiretto') return;
        var toggle = document.getElementById('sidebarToggle');
        var backdrop = document.getElementById('sidebarBackdrop');
        var sidebar = document.querySelector('.layout .sidebar');
        if (!toggle || toggle.dataset.bound === '1') return;
        toggle.dataset.bound = '1';

        function setOpen(open) {
            var shouldOpen = !!open && isMobileSidebar();
            document.body.classList.toggle('sidebar-open', shouldOpen);
            toggle.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
            toggle.setAttribute('aria-label', shouldOpen ? 'Chiudi menu' : 'Apri menu');
            if (backdrop) backdrop.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
            document.body.style.overflow = shouldOpen ? 'hidden' : '';
        }

        function closeDrawer() {
            setOpen(false);
        }

        toggle.addEventListener('click', function () {
            if (!isMobileSidebar()) return;
            setOpen(!document.body.classList.contains('sidebar-open'));
        });

        if (backdrop) {
            backdrop.addEventListener('click', closeDrawer);
        }

        if (sidebar) {
            sidebar.addEventListener('click', function (e) {
                if (!isMobileSidebar()) return;
                if (e.target.closest('.nav-item')) closeDrawer();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeDrawer();
        });

        try {
            window.matchMedia(MOBILE_MQ).addEventListener('change', function (e) {
                if (!e.matches) closeDrawer();
            });
        } catch (_) {
            window.addEventListener('resize', function () {
                if (!isMobileSidebar()) closeDrawer();
            });
        }
    }

    global.bindMobileSidebar = bindMobileSidebar;
    global.isMobileSidebar = isMobileSidebar;
})(typeof window !== 'undefined' ? window : global);
