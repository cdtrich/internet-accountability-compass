<!-- import externals -->
<head>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link
  rel="stylesheet"
  href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
/>
<link rel="stylesheet" href="style.css">
<link rel="stylesheet" href="./sidebar.css" />
</head>

<!-- back to root button -->
<!-- <a href="../" class="back-to-root">
  <span class="arrow"></span>
</a> -->

<!-- import components -->

```js
// import { colorScales } from "./components/scales.js";
// import { onlyUnique } from "./components/onlyUnique.js";
import { sources } from "./components/sources.js";
// import { mapSources } from "./components/mapSources.js";
import { mapSourcesD3 } from "./components/mapSourcesD3.js";
import { sidebar } from "./components/sidebar.js";
```

<!-- data -->

```js
const sourcesData = FileAttachment("./data/sources.csv").csv({
  typed: true,
});
```

<!-- hero -->
<div class="hero">
  <h1>Perspectives</h1>
  <h2 class="subheader">Sharing knowledge to accelerate progress.</h2>
  <!-- <div id="hero-image"></div> -->
</div>

<div class="body-text">
<p>Accountability in the digital realm is not a new conceptâ€”extensive research, advocacy, and policy innovation have shaped the global understanding of what it means to build a safe, inclusive, and rights-respecting Internet. Around the world, governments, civil society, international organisations, and research institutions have developed tools, frameworks, and initiatives to uphold commitments to connectivity, human rights, sustainability, and resilience.</p>

<p>Yet this valuable knowledge often remains fragmented, siloed by region, sector, or theme. This section brings together <b>a curated collection of complementary sources, analysis, and projects</b> that highlight good practices, policy innovations, and real-world applications of the principles captured in the Internet Accountability Compass.</p>

<p>Whether it's a successful regulatory reform, an inclusive AI policy, a transparent approach to digital trade, or a strong national cybersecurity frameworkâ€”these examples demonstrate that progress is possible. They also offer insights into how shared digital principles, such as those in the Global Digital Compact, can be translated into meaningful action.</p>

<p>Together, these resources help build a clearer picture of what digital accountability looks like in practiceâ€”and how it can be strengthened globally.</p>
</div>

<!-- data processing: unique types and countries for dropdown, and deduplicated data -->

```js
const sourceTypeUnique = [...new Set(sourcesData.map((d) => d.type))];
const sourceCountryUnique = [...new Set(sourcesData.map((d) => d.NAME_ENGL))];
const sourceISOUnique = [...new Set(sourcesData.map((d) => d.ISO3_CODE))];

const sourcesDataUnique = sourcesData.filter(
  (d, index, self) =>
    index ===
    self.findIndex(
      (item) => item.NAME_ENGL === d.NAME_ENGL && item.title === d.title,
    ),
);
```

<!-- load world map -->

```js
var worldLoad = FileAttachment("./data/CNTR_RG_60M_2024_4326.json").json();
var coastLoad = FileAttachment("./data/COAS_RG_60M_2016_4326.json").json();
```

```js
const world = topojson
  .feature(worldLoad, worldLoad.objects.CNTR_RG_60M_2024_4326)
  .features.filter((d) => d.properties.NAME_ENGL !== "Antarctica")
  .filter((d) => d.properties.SVRG_UN === "UN Member State")
  .map((d) => {
    d.properties = {
      CNTR_ID: d.properties.CNTR_ID,
      ISO3_CODE: d.properties.ISO3_CODE,
      NAME_ENGL: d.properties.NAME_ENGL,
    };
    return d;
  });

const coast = topojson.feature(
  coastLoad,
  coastLoad.objects.COAS_RG_60M_2016_4326,
);
```

```js
const worldFiltered = world.filter((feature) =>
  sourceISOUnique.includes(feature.properties.ISO3_CODE),
);
```

<!-- map -->
<div class="figure-w-full">
      ${resize((width) => mapSourcesD3(world, coast, sourcesData, {width, height: 400 }))}
</div>

<!-- input controls -->

<div class="body-text">
  <h2>Resources</h2>
</div>
<!-- <p>Select a resource type.</p> -->

<div class="body-text body-input">

```js
// console.log("worldFiltered", worldFiltered);
const selectSourceType = view(
  Inputs.checkbox(sourceTypeUnique, {
    // label: "Source type",
    format: (x) =>
      html`<span style="font-weight: [400, 700, 200];">${x}</span>`,
  }),
);
```

<!-- Select a country. -->

```js
const selectSourceCountry = view(
  Inputs.search(sourceCountryUnique, {
    value: "",
    datalist: sourceCountryUnique,
    placeholder: "Search countries",
    output: null,
  }),
);
```

<!-- filtered data -->

```js
const sourcesDataFiltered = sourcesDataUnique.filter((d) => {
  const typeMatch =
    !selectSourceType ||
    selectSourceType.length === 0 ||
    selectSourceType.includes(d.type);
  const countryMatch =
    !selectSourceCountry ||
    selectSourceCountry.length === 0 ||
    selectSourceCountry.includes(d.NAME_ENGL);
  return typeMatch && countryMatch;
});
sources(sourcesDataFiltered);
```

<!-- interactivity -->

```js
// Debounce helper to speed up text input
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
```

```js
{
  if (!window._mapCountryListenerSet) {
    window._mapCountryListenerSet = true;

    function debounce(fn, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    }

    function trySetupMapInputSync() {
      const input = document.querySelector(
        "input[placeholder='Search countries']",
      );
      if (!input) {
        console.log("â³ Input not yet mounted, trying again...");
        requestAnimationFrame(trySetupMapInputSync);
        return;
      }

      console.log("âœ… Input found. Setting up sync...");

      // ðŸ–±ï¸ Map click â†’ input update
      window.addEventListener("map-country-selected", (e) => {
        const country = e.detail;
        console.log("ðŸ—ºï¸ Map clicked:", country);

        input.value = country || "";
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });

      // âŒ¨ï¸ Typing â†’ map update (debounced)
      let lastDispatched = null;

      const sendToMap = debounce((value) => {
        if (value !== lastDispatched) {
          lastDispatched = value;
          window.dispatchEvent(
            new CustomEvent("map-country-selected", { detail: value }),
          );
        }
      }, 150);

      input.addEventListener("input", (e) => {
        const typed = e.target.value;
        console.log("âŒ¨ï¸ Input typed:", typed);
        sendToMap(typed);
      });
    }

    trySetupMapInputSync();
  }
}
```

</div>

<div class="body-text">
  <!-- sources section -->
  <div id="sources-section"></div>
</div>

<!-- sidebar -->
<div>
    ${sidebar()}
</div>
