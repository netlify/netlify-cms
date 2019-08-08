---
title: Deploy Preview Links
group: features
weight: 10
---

When using the editorial workflow, content editors can create and save content without publishing it
to a live site. Deploy preview links provide a way to view live content when it has not been
published, provided that you're using a continuous deployment platform to provide "deploy previews"
of your unmerged content.

**Note:** for the initial release, only the GitHub and Git Gateway (with GitHub) backends will
support deploy preview links. Others should follow shortly.

## Using deploy preview links
Deploy preview links will work without configuration when all of the following requirements are met:

- Netlify CMS version is 2.4.0+
- Using the GitHub backend (or Git Gateway with a GitHub repository)
- Using editorial workflow
- Have a continuous deployment platform that builds every commit and provides statuses to your repo

Any site created using one of the Deploy to Netlify options on our [starters
page](../start-with-a-template) will automatically meet these criteria (barring any changes made to
your Netlify settings), but you may need to [update](../update-the-cms-version) your Netlify CMS version to get the
functionality.

**Note:** If you're using a custom backend (one that is not included with Netlify CMS), please check the
documentation for that backend for more information about enabling deploy preview links.

Deploy preview links are provided in the editor toolbar, near the publishing controls:

![Deploy preview link for unpublished content](/img/preview-link-unpublished.png)

### Waiting for builds
Deploy your site preview may take ten seconds or ten minutes, depending on many factors. For maximum
flexibility, Netlify CMS provides a "Check for Preview" refresh button when the deploy preview is
pending, which a content editor can use to manually check for a finished preview until it's ready:

![Deploy preview link for unpublished content](/img/preview-link-check.png)

## Configuring preview paths
Deploy preview links point to the site root by default, but you'll probably want them to point to
the specific piece of content that the content editor is viewing. You can do this by providing a
`preview_path` string template for each collection.

Let's say we have a `blog` collection that stores content in our repo under `content/blog`. The path
to a post in your repo may look like `content/blog/2018-01-new-post.md`, but the path to that post
on your site would look more like: `/blog/2018-01-new-post/`. Here's how you would use
`preview_path` in your configuration for this scenario:

```yml
collections:
  - name: blog
    folder: content/blog
    slug: {{year}}-{{month}}-{{slug}}
    preview_path: blog/{{slug}}
```

With the above configuration, the deploy preview URL from your backend will be combined with your
preview path to create a URL to a specific blog post.

**Note:** `{{slug}}` in `preview_path` is different than `{{slug}}` in `slug`. In the `slug`
template, `{{slug}}` is only the url-safe [identifier
field](../configuration-options/#identifier_field), while in the `preview_path` template, `{{slug}}`
is the entire slug for the entry. For example:

```yml
# for an entry created Jan 1, 2000 with identifier "My New Post!"

collections:
  - name: posts
    slug: {{year}}-{{month}}-{{slug}} # {{slug}} will compile to "my-new-post"
    preview_path: blog/{{slug}} # {{slug}} will compile to "2000-01-my-new-post"
```

### Dates in preview paths
Some static site generators allow URL's to be customized with date parameters - for example, Hugo
can be configured to use values like `year` and `month` in a URL. These values are generally derived
by the static site generator from a date field in the content file. `preview_path` accepts these
parameters as well, similar to the `slug` configuration, except `preview_path` populates date values
based on a date value from the entry, just like static site generators do. Netlify CMS will attempt
to infer an obvious date field, but you can also specify which date field to use for `preview_path`
template tags by using
[`preview_path_date_field`](../configuration-options/#preview_path_date_field).

Together with your other field values, dates can be used to configure most URL schemes available
through static site generators.

**Example**

```yaml
# This collection's date field will be inferred because it has a field named `"date"`

collections:
  - name: posts
    preview_path: blog/{{year}}/{{month}}/{{title}}
    fields:
      - { name: title, label: Title }
        { name: date, label: Date, widget: date }
        { name: body, label: Body, widget: markdown }

# This collection requires `path_preview_date_field` because the no obvious date field is available

collections:
  - name: posts
    preview_path: blog/{{year}}/{{month}}/{{title}}
    preview_path_date_field: published_at
    fields:
      - { name: title, label: Title }
        { name: published_at, label: Published At, widget: date }
        { name: body, label: Body, widget: markdown }
```

## Preview links for published content
You may also want preview links for published content as a convenience. You can do this by providing
a `site_url` in your configuration, which will be used in place of the deploy preview URL that a
backend would provide for an unpublished entry. Just as for deploy preview links to unpublished
content, links to published content will use any `preview_path` values that are defined in the
collection configurations.

Preview links for published content will also work if you are not using the editorial workflow.

![Deploy preview link for unpublished content](/img/preview-link-unpublished.png)

## Disabling deploy preview links
To disable deploy preview links, set `show_preview_links` to false in your CMS configuration.

## How it works
Deploy preview links are provided through your CMS backend, and Netlify CMS is unopinionated about
where the links come from or how they're created. That said, the general approach for Git backends
like GitHub is powered by "commit statuses". Continuous deployment platforms like Netlify can deploy
a version of your site for every commit that is pushed to your remote Git repository, and then send
a commit status back to your repository host with the URL.

The deploy preview URL provided by a backend will lead to the root of the deployed site. Netlify CMS
will then use the `preview_path` template in an entry's collection configuration to build a path to
a specific piece of content. If a `preview_path` is not provided for an entry's collection, the URL
will be used as is.
