---
toc: false
sidebar: false
pager: null
footer: false
theme: air
---

<head>
<link rel="stylesheet" href="../style.css">
<!-- sidebar -->
    <link
      rel="stylesheet"
      href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
    />
    <link rel="stylesheet" href="../sidebar.css" />
</head>

<!-- import components -->

```js
import { straightPlot } from "../components/straightPlot.js";
import { polarCountry } from "../components/polarCountry.js";
import { sources } from "../components/sources.js";
import { onlyUnique } from "../components/onlyUnique.js";
import { sidebar } from "../components/sidebar.js";
import { pillarTextShort } from "../components/pillarTextShort.js";
import { sourcesLegend } from "../components/sourcesLegend.js";
```

<!-- load countries -->

```js
const country = "cntr";
const dfiFull = FileAttachment("../data/dfiFull.csv").csv({
  typed: true,
});
const dfiCardinal = FileAttachment("../data/dfiCardinal.csv").csv({
  typed: true,
});
const sourcesParse = FileAttachment("../data/sources.csv").csv({
  typed: true,
});
// const pillarTextShort = FileAttachment("../components/pillarTextShort.js");
```

<!-- calculate country specific data for intro -->

```js
const dfiCountry = dfiFull.filter((d) => d.NAME_ENGL == country)[0];
const dfiCardinalCountry = dfiCardinal.filter((d) => d.NAME_ENGL == country);
```

```js
const total = Math.round(dfiCountry.total);
const group = dfiCountry.group;
```

<!-- only unique sources, and filtered by country -->

```js
const sourcesData = sourcesParse
  .filter((d) => d.NAME_ENGL === country)
  .filter(
    (d, index, self) =>
      index === self.findIndex((item) => item.title === d.title),
  );
```

<div class="hero">
  <h1>${country}</h1>
</div>

```js
var commitments = dfiFull.map((d) => d.commitment_txt);
var commitmentUnique = commitments.filter(onlyUnique);
```

<!-- text and polar -->
<div class="body-text">
<div class="grid grid-cols-3">

  <div class="card grid-col-1">
  <p>${country} scores a <span style="font-weight: 700;">total of ${total} </span>points (<i>${group}</i>).</p>
  <p>Cardinal point breakdown:</p>
<ul>
  <li>${dfiCardinalCountry[0].value === "NA" ? dfiCardinalCountry[0].note : `${Math.round(dfiCardinalCountry[0].value)} (${dfiCardinalCountry[0].group_value})`} in <span class="pillar-connectivity" style="font-weight: 700;">${dfiCardinalCountry[0].pillar_txt}</span></li>
  <li>${dfiCardinalCountry[1].value === "NA" ? dfiCardinalCountry[1].note : `${Math.round(dfiCardinalCountry[1].value)} (${dfiCardinalCountry[1].group_value})`} in <span class="pillar-rights" style="font-weight: 700;">${dfiCardinalCountry[1].pillar_txt}</span></li>
  <li>${dfiCardinalCountry[2].value === "NA" ? dfiCardinalCountry[2].note : `${Math.round(dfiCardinalCountry[2].value)} (${dfiCardinalCountry[2].group_value})`} in <span class="pillar-responsibility" style="font-weight: 700;">${dfiCardinalCountry[2].pillar_txt}</span></li>
  <li>${dfiCardinalCountry[3].value === "NA" ? dfiCardinalCountry[3].note : `${Math.round(dfiCardinalCountry[3].value)} (${dfiCardinalCountry[3].group_value})`} in <span class="pillar-trust" style="font-weight: 700;">${dfiCardinalCountry[3].pillar_txt}</span></li>
</ul>
    </div>

  <div class="card grid-col-2">
        ${resize((width) => polarCountry(dfiFull, country, {width}))}
    </div>

</div>
</div>

<!-- # Scores -->

<p><span class="pillar-connectivity" style="font-weight: 700;">${dfiCardinalCountry[0].pillar_txt}</span></p>
<p>${pillarTextShort.filter(d => d.title == dfiCardinalCountry[0].pillar_txt)[0].paragraphs}</p>

  <div class="card size-full">
      ${resize((width) => straightPlot(dfiFull, country, dfiCardinalCountry[0].pillar_txt, {width}))}
    </div>

<p><span class="pillar-rights" style="font-weight: 700;">${dfiCardinalCountry[1].pillar_txt}</span></p>
<p>${pillarTextShort.filter(d => d.title == dfiCardinalCountry[1].pillar_txt)[0].paragraphs}</p>

  <div class="card size-full">
      ${resize((width) => straightPlot(dfiFull, country, dfiCardinalCountry[1].pillar_txt, {width}))}
    </div>

<p><span class="pillar-responsibility" style="font-weight: 700;">${dfiCardinalCountry[2].pillar_txt}</span></p>
<p>${pillarTextShort.filter(d => d.title == dfiCardinalCountry[2].pillar_txt)[0].paragraphs}</p>

  <div class="card size-full">
      ${resize((width) => straightPlot(dfiFull, country, dfiCardinalCountry[2].pillar_txt, {width}))}
    </div>

<p><span class="pillar-trust" style="font-weight: 700;">${dfiCardinalCountry[3].pillar_txt}</span></p>
<p>${pillarTextShort.filter(d => d.title == dfiCardinalCountry[3].pillar_txt)[0].paragraphs}</p>

  <div class="card size-full">
      ${resize((width) => straightPlot(dfiFull, country, dfiCardinalCountry[3].pillar_txt, {width}))}
    </div>

<!-- sources -->

```js
var resourcesHeading = sourcesData.length === 0 ? "" : "Resources";
```

<h1>${resourcesHeading}</h1>

  <div class="grid grid-cols-4 gap-4">
  <div>
      ${resize((width) => sourcesLegend(sourcesData, {width}))}
    </div>
  </div>
  <div class="col-span-3">
  </div>

  <div id="sources-section">
  </div>

```js
sources(sourcesData);
```

<!-- sidebar -->

<div>
    ${sidebar()}
</div>
