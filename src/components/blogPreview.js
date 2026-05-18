export function blogPreview() {
  const basePath = window.location.pathname.includes(
    "/internet-accountability-compass",
  )
    ? "/internet-accountability-compass"
    : "";

  const posts = [
    {
      title: "The Global Digital Compact One Year On: Promises, Progress, and Persistent Gaps",
      slug: "the-global-digital-compact-one-year-on",
      image: "https://picsum.photos/seed/globalcompact/640/340",
      date: "12 May 2026",
      author: "Patryk Pawlak",
    },
    {
      title: "Bridging the Digital Divide: Infrastructure Accountability in the Global South",
      slug: "bridging-the-digital-divide",
      image: "https://picsum.photos/seed/infrastructure2030/640/340",
      date: "28 April 2026",
      author: "Nils Berglund",
    },
    {
      title: "AI Governance in Practice: From Principles to Accountability Frameworks",
      slug: "ai-governance-in-practice",
      image: "https://picsum.photos/seed/aigovernance42/640/340",
      date: "14 April 2026",
      author: "Patryk Pawlak",
    },
  ];

  const container = document.createElement("div");
  container.innerHTML = `
    <div class="grid grid-cols-3">
      ${posts
        .map(
          (post) => `
        <a href="${basePath}/blog#${post.slug}" class="blog-preview-tile">
          <div class="blog-img-wrap blog-img-wrap--tile">
            <img src="${post.image}" alt="${post.title}" loading="lazy">
          </div>
          <p class="blog-preview-title">${post.title}</p>
          <span class="blog-date">${post.date} · ${post.author}</span>
        </a>
      `,
        )
        .join("")}
    </div>
  `;

  return container.firstElementChild;
}
