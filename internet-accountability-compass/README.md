# DFI Tracker

This is an [Observable Framework](https://observablehq.com/framework) project.

To start the local preview server, run:

```
npm run dev
```

Then visit <http://localhost:3000> to preview your project.

For more, see <https://observablehq.com/framework/getting-started>.

## Project structure

```ini
.
├─ src
│  ├─ components
│  │  └─ plot.js               # all chart types, and some other js helpers
│  ├─ data
│  │  ├─ data.csv.r            # R data loaders
│  │  └─ data.csv              # mock data. the data loader parses from google drive or github
│  ├─ countries
│  │  ├─ template.md           # the markdown template for the subpages
│  │  ├─ generatePage.r        # R script looping through subpages, drawing on template.md
│  │  └─ subpage.md            # generated subpages
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the project config file
├─ package.json
└─ README.md
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your site. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/javascript/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [project configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the project’s title.

## Command reference

| Command              | Description                                 |
| -------------------- | ------------------------------------------- |
| `npm install`        | Install or reinstall dependencies           |
| `npm run dev`        | Start local preview server                  |
| `npm run build`      | Build your static site, generating `./dist` |
| `npm run deploy`     | Deploy your project to Observable           |
| `npm run clean`      | Clear the local data loader cache           |
| `npm run observable` | Run commands like `observable help`         |
