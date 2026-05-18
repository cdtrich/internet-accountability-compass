export function sidebar() {
  const basePath = window.location.pathname.includes(
    "/internet-accountability-compass",
  )
    ? "/internet-accountability-compass"
    : "";
  const isMobile = window.innerWidth <= 768;

  const container = document.createElement("div");
  container.innerHTML = `
    <div class="sidebar${isMobile ? " collapsed" : ""}" id="sidebar">
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
            <a href="${basePath}/blog">
              <i class="fas fa-newspaper"></i>
              <span>Blog</span>
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
        (href === "/blog" && currentPath.startsWith("/blog")) ||
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
