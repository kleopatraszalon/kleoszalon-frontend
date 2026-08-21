(function () {
  var MOBILE_MAX = 900;
  var mobileOpen = false;
  var shell = null;
  var toggle = null;
  var observer = null;

  function isMobile() {
    return window.matchMedia('(max-width: ' + MOBILE_MAX + 'px)').matches;
  }

  function findShell() {
    shell = document.querySelector('.app-layout-shell');
    toggle = document.querySelector('.topbar-collapse');
    return !!shell;
  }

  function sync() {
    if (!findShell()) return;
    if (!isMobile()) {
      shell.classList.remove('mobile-menu-managed');
      if (toggle) toggle.removeAttribute('data-mobile-menu-managed');
      return;
    }

    shell.classList.add('mobile-menu-managed');
    shell.classList.toggle('is-sidebar-collapsed', !mobileOpen);
    if (toggle) {
      toggle.setAttribute('data-mobile-menu-managed', '1');
      toggle.setAttribute('aria-expanded', mobileOpen ? 'true' : 'false');
    }
    document.documentElement.classList.toggle('mobile-menu-open', mobileOpen);
    document.body.classList.toggle('mobile-menu-open', mobileOpen);
  }

  function closeMenu() {
    mobileOpen = false;
    sync();
  }

  function toggleMenu(event) {
    if (!isMobile()) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    mobileOpen = !mobileOpen;
    sync();
  }

  function onClick(event) {
    if (!isMobile()) return;
    var target = event.target;
    if (!target || !target.closest) return;

    if (target.closest('.topbar-collapse')) {
      toggleMenu(event);
      return;
    }

    if (target.closest('.sidebar-backdrop')) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      closeMenu();
      return;
    }

    if (mobileOpen && target.closest('.kleo-sidebar a')) {
      window.setTimeout(closeMenu, 0);
    }
  }

  function installObserver() {
    if (observer) observer.disconnect();
    observer = new MutationObserver(function () {
      if (!isMobile()) return;
      window.requestAnimationFrame(sync);
    });
    observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'aria-expanded'] });
  }

  function boot() {
    mobileOpen = false;
    sync();
    installObserver();
  }

  document.addEventListener('click', onClick, true);
  window.addEventListener('resize', function () {
    if (!isMobile()) mobileOpen = false;
    sync();
  }, { passive: true });
  window.addEventListener('orientationchange', function () {
    mobileOpen = false;
    window.setTimeout(sync, 50);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
