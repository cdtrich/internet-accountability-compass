export function blogPreview() {
  const basePath = window.location.pathname.includes(
    "/internet-accountability-compass",
  )
    ? "/internet-accountability-compass"
    : "";

  const posts = [
    {
      title: "Charting a Way for Stronger Internet Accountability",
      slug: "charting-a-way-for-stronger-internet-accountability",
      image: "https://picsum.photos/seed/charting/640/340",
      date: "27 May 2026",
      author: "Patryk Pawlak",
    },
    {
      title:
        "From Promises to Practice: The Real Test of Global Digital Cooperation",
      slug: "from-promises-to-practice-the-real-test-of-global-digital-cooperation",
      image: "https://picsum.photos/seed/cooperation/640/340",
      date: "27 April 2026",
      author: "Patryk Pawlak and Nils Berglund",
    },
    {
      title: "Regional Contributions to Global Internet Accountability Debates",
      slug: "regional-contributions-to-global-internet-accountability-debates",
      image: "https://picsum.photos/seed/aigovernance42/640/340",
      date: "27 May 2026",
      author: "Nils Berglund",
    },
  ];

  const container = document.createElement("div");
  container.innerHTML = `
    <div class="grid grid-cols-3">
      ${posts
        .map(
          (post) => `
        <a href="${basePath}/perspectives#${post.slug}" class="blog-preview-tile">
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
