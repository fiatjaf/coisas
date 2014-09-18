coisas
========

A pure-javascript kind of CMS for hosting multipurpose websites in GitHub pages.

## The internals:

There is a directory, at Github, structured as this:

* articles
  * about-that-day
    * README.md
  * about-that-thing
    * README.md
  * README.md
* blog
  * just-arrived-at-viena
    * README.md
  * visiting-mises-old-house
    * README.md
  * README.md
* README.md
* globals.yaml

`coisas` will extract from each README.md, the globals.yaml file and from the directory structure a list of documents like this:

```
[{
  "id": "oewir",
  "slug": "",
  "path": [""],
  "html": "<p>Hello, welcome to my blog!</p>"
}, {
  "id": "is0hr",
  "slug": "articles",
  "path": ["articles"],
  "html": "<h3>Articles</h3><div><p>These are my articles!</p></div>",
  "sort": "slug",
  "children": [{"slug": "about-that-day"}, {"slug": "about-that-thing"}]
}, {
  "id": "oerptiz",
  "slug": "about-that-day",
  "path": ["articles", "about-that-day"],
  "html": "<h2>About that day</h2><div><p>That day something happened et cetera.</p></div>",
}, {
  "id": "sdlkfn",
  "slug": "about-that-thing",
  "path": ["articles", "about-that-thing"],
  "html": "<h2>About that thing</h2><div><p>That thing is something.</p></div>",
}, {
  "id": "34p5ioj",
  "slug": "blog",
  "path": ["blog"],
  "html": "<h3>Blog</h3><div><p>These are my posts!</p></div>",
  "children": [{"slug": "just-arrived-at-viena"}, {"slug": "visiting-mises-old-house"}]
  "sort": "date"
}, {
  "id": "sdjfnas",
  "slug": "just-arrived-at-viena",
  "path": ["blog", "just-arrived-at-viena"],
  "html": "<h3>Viena!</h3><div><p>We are here! Going to see the old Mises house</p></div>",
  "date": "2014-05-18"
}, {
  "id": "3poiu42",
  "slug": "visiting-mises-old-house",
  "path": ["blog", "visiting-mises-old-house"],
  "html": "<h3>Mises house!</h3><div><p>We are here! Hello!</p></div>",
  "date": "2014-05-19"
}]
```

## Improvements needed:

* Support for titles and other metadata in the children lists
* A nice plugin system
* Support for hundreds of pages (the Github API limits that, so we need to do various HTTP calls and so on)
