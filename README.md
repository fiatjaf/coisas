![](icon-s.png) coisas
====================

**coisas** is a headless CMS specifically designed to let you edit files hosted in a GitHub repository. It is similar to [Netlify CMS](https://github.com/netlify/netlify-cms) and [Prose](http://prose.io/). Unlike existing alternatives, **coisas** doesn't try to be a multipurpose CMS. It still lets you edit, create, upload, and browse files, but doesn't try to look like a fancy CMS (custom schema, objects and all that mess). It also isn't tailored to Jekyll websites, which means that it won't insert Jekyll specific code or expect your repository to have a Jekyll-specific file structure.

Other features that **coisas** includes are:

  * file tree view;
  * simple metadata editor and automatic saving of Markdown and HTML files with YAML front-matter;
  * behavior customizations that can be configured from your repository, while still accessing **coisas** from its own URL;
  * easy embedding in your own site, so you'll never have to touch **coisas** own URL;
  * image gallery with all the images from your repository, so you can drag and drop them inside the editor;
  * simple visualization of many file formats (only text files are editable, however).

## usage

To use **coisas**, go to https://coisas.alhur.es/ or embed it in your site, for example, in an `/admin/` section (more detailed instructions on how to do this may come - for the meantime please copy the hosted version file structure).

## demo

There is a demo site at https://geraldoquagliato.github.io/, which you can browse and edit (no login necessary) by visiting https://coisas.alhur.es/#!/geraldoquagliato/geraldoquagliato.github.io/. Please be decent.

## customization

To customize the app behavior specifically for your repository, create a file named `coisas.js` and put it at the root of the repository. That file may contain anything and will be loaded and executed dynamically by **coisas** as part of its initialization process.

From that file you must modify the global object `window.coisas`, whose defaults are specified in [preferences.js](preferences.js) (along with comments to explain each property). If you need more customization options I'm happy to include them, please open an issue.

### live previews

Through the customization file, you may define a couple of functions that will enable live previews in the edit session of **coisas** (a couple of buttons will be shown allowing the editor to switch between the _edit_ view and the _preview_ view). See [preferences.js](preferences.js) for more information about how to do that.

## meta

##### Source tree for this repository

(The majority of action happens at [components/Repo.js](components/Repo.js) and [state.js](state.js), although Prosemirror takes a lot of space in the tree due to its hypermodularization)

![](http://node-dependencies-view.glitch.me/fiatjaf/coisas)

##### Visit analytics for this repository

[![](https://ght.trackingco.de/fiatjaf/coisas)](https://ght.trackingco.de/)
