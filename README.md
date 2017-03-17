# Netlify CMS

A CMS for static site generators. Give non-technical users a simple way to edit
and add content to any site built with a static site generator.

## How it works

Netlify CMS is a single-page app that you pull into the `/admin` part of your site.

It presents a clean UI for editing content stored in a Git repository.

You setup a YAML config to describe the content model of your site, and typically
tweak the main layout of the CMS a bit to fit your own site.

When a user navigates to `/admin` they'll be prompted to login, and once authenticated
they'll be able to create new content or edit existing content.

Read more about Netlify CMS [Core Concepts](docs/intro.md).

# Installation and Configuration

The Netlify CMS can be used in two different ways.

* A Quick and easy install, that just requires you to create a single HTML file and a configuration file. All the CMS Javascript and CSS are loaded from a CDN.
To learn more about this installation method, refer to the [Quick Start Guide](docs/quick-start.md)
* A complete, more complex install, that gives you more flexibility but requires that you use a static site builder with a build system with supports npm packages.

# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).  
Every release is documented on the Github [Releases](https://github.com/netlify/netlify-cms/releases) page.

# License

Netlify CMS is released under the [MIT License](LICENSE).
Please make sure you understand its [implications and guarantees](https://writing.kemitchell.com/2016/09/21/MIT-License-Line-by-Line.html).


