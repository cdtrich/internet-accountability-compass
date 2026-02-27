export function sidebar() {
  const basePath = window.location.pathname.includes("/dfi") ? "/dfi" : "";
  const isMobile = window.innerWidth <= 768;

  const container = document.createElement("div");
  container.innerHTML = `
    <div class="sidebar collapsed" id="sidebar">
      <div class="sidebar-content">
        <ul class="sidebar-menu">
          <li>
            <a href="${basePath}/index">
              <i class="fas fa-globe"></i>
              <span>Map</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/countries">
              <i class="fas fa-flag"></i>
              <span>Countries</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/directions">
              <i class="fas fa-rainbow"></i>
              <span>Directions</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/perspectives">
              <i class="fas fa-comments"></i>
              <span>Perspectives</span>
            </a>
          </li>
          <li>
            <a href="${basePath}/methodology">
              <i class="fas fa-tools"></i>
              <span>Methodology</span>
            </a>
          </li>
        </ul>
      </div>
    </div>
  `;

  const sidebarEl = container.querySelector("#sidebar");

  // Add hover event listeners (desktop only)
  if (!isMobile) {
    sidebarEl.addEventListener("mouseenter", function () {
      sidebarEl.classList.remove("collapsed");
    });

    sidebarEl.addEventListener("mouseleave", function () {
      sidebarEl.classList.add("collapsed");
    });

    // Touch events for tablets/touch laptops
    let touchTimeout;

    sidebarEl.addEventListener("touchstart", function () {
      clearTimeout(touchTimeout);
      sidebarEl.classList.remove("collapsed");
    });

    sidebarEl.addEventListener("touchend", function () {
      touchTimeout = setTimeout(() => {
        sidebarEl.classList.add("collapsed");
      }, 2000);
    });
  }

  function highlightCurrentPage() {
    const currentPath = window.location.pathname.replace(basePath, "") || "/";

    const links = container.querySelectorAll(".sidebar-menu a");

    links.forEach((link) => {
      const href = link.getAttribute("href").replace(basePath, "");

      if (
        (href === "/index" &&
          (currentPath === "/" || currentPath === "/index")) ||
        (href === "/countries" && currentPath.startsWith("/countries")) ||
        (href === "/directions" && currentPath.startsWith("/directions")) ||
        (href === "/perspectives" && currentPath.startsWith("/perspectives")) ||
        (href === "/methodology" && currentPath.startsWith("/methodology"))
      ) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }

  // Initialize
  highlightCurrentPage();

  return container.firstElementChild;
}
