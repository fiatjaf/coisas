![](icon-s.png) coisas
====================

**coisas** is a headless CMS specifically designed to let you edit files hosted in a GitHub repository. It is similar to [Netlify CMS](https://github.com/netlify/netlify-cms) and [Prose](http://prose.io/), the difference is that, unlike the first, it doesn't try to be a multipurpose CMS, it lets you edit files, create text files, upload files, browse your files, but doesn't try to look like a fancy CMS with custom schema and objects and all that mess; and, unlike the second, it isn't tailored to Jekyll websites, so it won't insert Jekyll specific code or expect your repository to have Jekyll-specific file structure.

Other features that **coisas** include are:

  * file tree view;
  * simple metadata editor and automatic saving of Markdown and HTML files with YAML front-matter;
  * behavior customizations that can be configured from your repository, while still accessing **coisas** from its own URL;
  * easily embeddable in your own site, so you'll never have to touch **coisas** own URL;
  * image gallery with all images from your repository, so you can drag from there and drop them inside the editor;
  * simple visualization of many file formats (only text files are editable, however).

### Please do not expect this to be free of bugs or to have all the features you need. It's a work in progress. Everything is broken still.

## usage

To use **coisas**, go to https://coisas.alhur.es/ or embed it in your site, for example, in an `/admin/` section (more detailed instructions of how to do this may come, meanwhile please copy the hosted version file structure).

## demo

There is a demo site at https://geraldoquagliato.github.io/ which you can browse and edit (no login necessary) by visiting https://coisas.alhur.es/#!/geraldoquagliato/geraldoquagliato.github.io/. Please be decent.

## customization

To customize the app behavior specifically for your repository, create a file named `coisas.js` and put it at the root of the repository. That file may contain anything, it will be loaded dinamically by **coisas** at its initialization process and run as is.

From that file you must modify the global object `window.coisas`, whose defaults are given at [preferences.js](preferences.js), along with comments that say which of its properties do what. If you need more customization options I'm happy to include them, please open an issue.
