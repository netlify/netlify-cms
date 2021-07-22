---
group: Configuration
weight: 200
title: Beta Features!
---

We run new functionality in an open beta format from time to time. That means that this functionality is totally available for use, and we _think_ it might be ready for primetime, but it could break or change without notice.

**Use these features at your own risk.**

## Working with a Local Git Repository

**_added in netlify-cms@2.10.17 / netlify-cms-app@2.11.14_**

You can connect Netlify CMS to a local Git repository, instead of working with a live repo.

1. Navigate to a local Git repository configured with the CMS.
2. Add the top-level property `local_backend` configuration to your `config.yml`:

```yaml
backend:
  name: git-gateway

# when using the default proxy server port
local_backend: true
```

3. Run `npx netlify-cms-proxy-server` from the root directory of the above repository.

   - If the default port (8081) is in use, the proxy server won't start and you will see an error message. In this case, follow [these steps](#configure-the-netlify-cms-proxy-server-port-number) before proceeding.

4. Start your local development server (e.g. run `gatsby develop`).
5. Open <http://localhost:8000/admin> to verify that your can administer your content locally.

**Note:** `netlify-cms-proxy-server` runs an unauthenticated express server. As any client can send requests to the server, it should only be used for local development.

### Configure the Netlify CMS proxy server port number

1. Create a `.env` file in the project's root folder and define the PORT you'd like the proxy server to use

```ini
PORT=8082
```

2. Update the `local_backend` object in `config.yml` and specify a `url` property to use your custom port number

```yaml
backend:
  name: git-gateway

local_backend:
  # when using a custom proxy server port
  url: http://localhost:8082/api/v1
  # when accessing the local site from a host other than 'localhost' or '127.0.0.1'
  allowed_hosts: ['192.168.0.1']
```

## GitLab and BitBucket Editorial Workflow Support

**_added in netlify-cms@2.10.6 / netlify-cms-app@2.11.3_**

You can enable the Editorial Workflow with the following line in your Netlify CMS `config.yml` file:

```yaml
publish_mode: editorial_workflow
```

In order to track unpublished entries statuses the GitLab implementation uses merge requests labels and the BitBucket implementation uses pull requests comments.

## i18n Support

The CMS can provide a side by side interface for authoring content in multiple languages.
Configuring the CMS for i18n support requires top level configuration, collection level configuration and field level configuration.

### Top level configuration

```yaml
i18n:
  # Required and can be one of multiple_folders, multiple_files or single_file
  # multiple_folders - persists files in `<folder>/<locale>/<slug>.<extension>`
  # multiple_files - persists files in `<folder>/<slug>.<locale>.<extension>`
  # single_file - persists a single file in `<folder>/<slug>.<extension>`
  structure: multiple_folders

  # Required - a list of locales to show in the editor UI
  locales: [en, de, fr]

  # Optional, defaults to the first item in locales.
  # The locale to be used for fields validation and as a baseline for the entry.
  default_locale: en
```

### Collection level configuration

```yaml
collections:
  - name: i18n_content
    # same as the top level, but all fields are optional and defaults to the top level
    # can also be a boolean to accept the top level defaults
    i18n: true
```

When using a file collection, you must also enable i18n for each individual file:

```yaml
collections:
  - name: pages
    label: Pages
    # Configure i18n for this collection.
    i18n:
      structure: single_file
      locales: [en, de, fr]
    files:
      - name: about
        label: About Page
        file: site/content/about.yml
        # Enable i18n for this file.
        i18n: true
        fields:
          - { label: Title, name: title, widget: string, i18n: true }
```

### Field level configuration

```yaml
fields:
  - label: Title
    name: title
    widget: string
    # same as 'i18n: translate'. Allows translation of the title field
    i18n: true
  - label: Date
    name: date
    widget: datetime
    # The date field will be duplicated from the default locale.
    i18n: duplicate
  - label: Body
    name: body
    # The markdown field will be omitted from the translation.
    widget: markdown
```

Example configuration:

```yaml
i18n:
  structure: multiple_folders
  locales: [en, de, fr]

collections:
  - name: posts
    label: Posts
    folder: content/posts
    create: true
    i18n: true
    fields:
      - label: Title
        name: title
        widget: string
        i18n: true
      - label: Date
        name: date
        widget: datetime
        i18n: duplicate
      - label: Body
        name: body
        widget: markdown
```

### Limitations

1. File collections support only `structure: single_file`.
2. List widgets only support `i18n: true`. `i18n` configuration on sub fields is ignored.
3. Object widgets only support `i18n: true` and `i18n` configuration should be done per field:

```yaml
- label: 'Object'
  name: 'object'
  widget: 'object'
  i18n: true
  fields:
    - { label: 'String', name: 'string', widget: 'string', i18n: true }
    - { label: 'Date', name: 'date', widget: 'datetime', i18n: duplicate }
    - { label: 'Boolean', name: 'boolean', widget: 'boolean', i18n: duplicate }
    - {
        label: 'Object',
        name: 'object',
        widget: 'object',
        i18n: true,
        field: { label: 'String', name: 'string', widget: 'string', i18n: duplicate },
      }
```

## GitHub GraphQL API

Experimental support for GitHub's [GraphQL API](https://developer.github.com/v4/) is now available for the GitHub backend.

**Note: not currently compatible with Git Gateway.**

For many queries, GraphQL allows data to be retrieved using less individual API requests compared to a REST API. GitHub's GraphQL API still does not support all mutations necessary to completely replace their REST API, so this feature only calls the new GraphQL API where possible.

You can use the GraphQL API for the GitHub backend by setting `backend.use_graphql` to `true` in your CMS config:

```yml
backend:
  name: github
  repo: owner/repo # replace this with your repo info
  use_graphql: true
```

Learn more about the benefits of GraphQL in the [GraphQL docs](https://graphql.org).

## Open Authoring

When using the [GitHub backend](/docs/github-backend), you can use Netlify CMS to accept contributions from GitHub users without giving them access to your repository. When they make changes in the CMS, the CMS forks your repository for them behind the scenes, and all the changes are made to the fork. When the contributor is ready to submit their changes, they can set their draft as ready for review in the CMS. This triggers a pull request to your repository, which you can merge using the GitHub UI.

At the same time, any contributors who _do_ have write access to the repository can continue to use Netlify CMS normally.

More details and setup instructions can be found on [the Open Authoring docs page](/docs/open-authoring).

## Folder Collections Path

By default the CMS stores folder collection content under the folder specified in the collection setting.

For example configuring `folder: posts` for a collection will save the content under `posts/post-title.md`.

You can now specify an additional `path` template (similar to the `slug` template) to control the content destination.

This allows saving content in subfolders, e.g. configuring `path: '{{year}}/{{slug}}'` will save the content under `posts/2019/post-title.md`.

## Folder Collections Media and Public Folder

By default the CMS stores media files for all collections under a global `media_folder` directory as specified in the configuration.

When using the global `media_folder` directory any entry field that points to a media file will use the absolute path to the published file as designated by the `public_folder` configuration.

For example configuring:

```yaml
media_folder: static/media
public_folder: /media
```

And saving an entry with an image named `image.png` will result in the image being saved under `static/media/image.png` and relevant entry fields populated with the value of `/media/image.png`.

Some static site generators (e.g. Gatsby) work best when using relative image paths.

This can now be achieved using a per collection `media_folder` configuration which specifies a relative media folder for the collection.

For example, the following configuration will result in media files being saved in the same directory as the entry, and the image field being populated with the relative path to the image.

```yaml
media_folder: static/media
public_folder: /media
collections:
  - name: posts
    label: Posts
    label_singular: 'Post'
    folder: content/posts
    path: '{{slug}}/index'
    media_folder: ''
    public_folder: ''
    fields:
      - label: Title
        name: title
        widget: string
      - label: 'Cover Image'
        name: 'image'
        widget: 'image'
```

More specifically, saving an entry with a title of `example post` with an image named `image.png` will result in a directory structure of:

```bash
content
  posts
    example-post
      index.md
      image.png
```

And for the image field being populated with a value of `image.png`.

**Note: When specifying a `path` on a folder collection, `media_folder` defaults to an empty string.**

**Available template tags:**

Supports all of the [`slug` templates](/docs/configuration-options#slug) and:

- `{{dirname}}` The path to the file's parent directory, relative to the collection's `folder`.
- `{{filename}}` The file name without the extension part.
- `{{extension}}` The file extension.
- `{{media_folder}}` The global `media_folder`.
- `{{public_folder}}` The global `public_folder`.

## List Widget: Variable Types

Before this feature, the [list widget](/docs/widgets/#list) allowed a set of fields to be repeated, but every list item had the same set of fields available. With variable types, multiple named sets of fields can be defined, which opens the door to highly flexible content authoring (even page building) in Netlify CMS.

**Note: this feature does not yet support default previews and requires [registering a preview template](/docs/customization#registerpreviewtemplate) in order to show up in the preview pane.**

To use variable types in the list widget, update your field configuration as follows:

1. Instead of defining your list fields under `fields` or `field`, define them under `types`. Similar to `fields`, `types` must be an array of field definition objects.
2. Each field definition under `types` must use the `object` widget (this is the default value for
   `widget`).

### Additional list widget options

- `types`: a nested list of object widgets. All widgets must be of type `object`. Every object widget may define different set of fields.
- `typeKey`: the name of the field that will be added to every item in list representing the name of the object widget that item belongs to. Ignored if `types` is not defined. Default is `type`.
- `summary`: allows customization of a collapsed list item object in a similar way to a [collection summary](/docs/configuration-options/?#summary)

### Example Configuration

The example configuration below imagines a scenario where the editor can add two "types" of content,
either a "carousel" or a "spotlight". Each type has a unique name and set of fields.

```yaml
- label: 'Home Section'
  name: 'sections'
  widget: 'list'
  types:
    - label: 'Carousel'
      name: 'carousel'
      widget: object
      summary: '{{fields.header}}'
      fields:
        - { label: Header, name: header, widget: string, default: 'Image Gallery' }
        - { label: Template, name: template, widget: string, default: 'carousel.html' }
        - label: Images
          name: images
          widget: list
          field: { label: Image, name: image, widget: image }
    - label: 'Spotlight'
      name: 'spotlight'
      widget: object
      fields:
        - { label: Header, name: header, widget: string, default: 'Spotlight' }
        - { label: Template, name: template, widget: string, default: 'spotlight.html' }
        - { label: Text, name: text, widget: text, default: 'Hello World' }
```

### Example Output

The output for the list widget will be an array of objects, and each object will have a `type` key
with the name of the type used for the list item. The `type` key name can be customized via the
`typeKey` property in the list configuration.

If the above example configuration were used to create a carousel, a spotlight, and another
carousel, the output could look like this:

```yaml
title: Home
sections:
  - type: carousel
    header: Image Gallery
    template: carousel.html
    images:
      - images/image01.png
      - images/image02.png
      - images/image03.png
  - type: spotlight
    header: Spotlight
    template: spotlight.html
    text: Hello World
  - type: carousel
    header: Image Gallery
    template: carousel.html
    images:
      - images/image04.png
      - images/image05.png
      - images/image06.png
```

## Custom Mount Element

Netlify CMS always creates its own DOM element for mounting the application, which means it always takes over the entire page, and is generally inflexible if you're trying to do something creative, like injecting it into a shared context.

You can now provide your own element for Netlify CMS to mount in by setting the target element's ID as `nc-root`. If Netlify CMS finds an element with this ID during initialization, it will mount within that element instead of creating its own.

## Manual Initialization

Netlify CMS can now be manually initialized, rather than automatically loading up the moment you import it. The whole point of this at the moment is to inject configuration into Netlify CMS before it loads, bypassing need for an actual Netlify CMS `config.yml`. This is important, for example, when creating tight integrations with static site generators.

Assuming you have the netlify-cms package installed to your project, manual initialization works by setting `window.CMS_MANUAL_INIT = true` **before importing the CMS**:

```js
// This global flag enables manual initialization.
window.CMS_MANUAL_INIT = true
// Usage with import from npm package
import CMS, { init } from 'netlify-cms'
// Usage with script tag
const { CMS, initCMS: init } = window
/**
 * Initialize without passing in config - equivalent to just importing
 * Netlify CMS the old way.
 */
init()
/**
 * Optionally pass in a config object. This object will be merged into
 * `config.yml` if it exists, and any portion that conflicts with
 * `config.yml` will be overwritten. Arrays will be replaced during merge,
 * not concatenated.
 *
 * For example, the code below contains an incomplete config, but using it,
 * your `config.yml` can be missing its backend property, allowing you
 * to set this property at runtime.
 */
init({
  config: {
    backend: {
      name: 'git-gateway',
    },
  },
})
/**
 * Optionally pass in a complete config object and set a flag
 *  (`load_config_file: false`) to ignore the `config.yml`.
 *
 * For example, the code below contains a complete config. The
 * `config.yml` will be ignored when setting `load_config_file` to false.
 * It is not required if the `config.yml` file is missing to set
 * `load_config_file`, but will improve performance and avoid a load error.
 */
init({
  config: {
    backend: {
      name: 'git-gateway',
    },
    load_config_file: false,
    media_folder: "static/images/uploads",
    public_folder: "/images/uploads",
    collections: [
      { label: "Blog", name: "blog", folder: "_posts/blog", create: true, fields: [
        { label: "Title", name: "title", widget: "string" },
        { label: "Publish Date", name: "date", widget: "datetime" },
        { label: "Featured Image", name: "thumbnail", widget: "image" },
        { label: "Body", name: "body", widget: "markdown" },
      ]},
    ],
  },
})
// The registry works as expected, and can be used before or after init.
CMS.registerPreviewTemplate(...);
```

## Raw CSS in `registerPreviewStyle`

`registerPreviewStyle` can now accept a CSS string, in addition to accepting a url. The feature is activated by passing in an object as the second argument, with `raw` set to a truthy value. This is critical for integrating with modern build tooling. Here's an example using webpack:

```js
/**
 * Assumes a webpack project with `sass-loader` and `css-loader` installed.
 * Takes advantage of the `toString` method in the return value of `css-loader`.
 */
import CMS from 'netlify-cms';
import styles from '!css-loader!sass-loader!../main.scss';
CMS.registerPreviewStyle(styles.toString(), { raw: true });
```

## Squash merge GitHub pull requests

When using the [Editorial Workflow](../configuration-options/#publish-mode) with the `github` or GitHub-connected `git-gateway` backends, Netlify CMS creates a pull request for each unpublished entry. Every time the unpublished entry is changed and saved, a new commit is added to the pull request. When the entry is published, the pull request is merged, and all of those commits are added to your project commit history in a merge commit.

The squash merge option causes all commits to be "squashed" into a single commit when the pull request is merged, and the resulting commit is rebased onto the target branch, avoiding the merge commit altogether.

To enable this feature, you can set the following option in your Netlify CMS `config.yml`:

```yaml
backend:
  squash_merges: true
```

## Commit Message Templates

You can customize the templates used by Netlify CMS to generate commit messages by setting the `commit_messages` option under `backend` in your Netlify CMS `config.yml`.

Template tags wrapped in curly braces will be expanded to include information about the file changed by the commit. For example, `{{path}}` will include the full path to the file changed.

Setting up your Netlify CMS `config.yml` to recreate the default values would look like this:

```yaml
backend:
  commit_messages:
    create: Create {{collection}} “{{slug}}”
    update: Update {{collection}} “{{slug}}”
    delete: Delete {{collection}} “{{slug}}”
    uploadMedia: Upload “{{path}}”
    deleteMedia: Delete “{{path}}”
    openAuthoring: '{{message}}'
```

Netlify CMS generates the following commit types:

| Commit type     | When is it triggered?                    | Available template tags                                     |
| --------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `create`        | A new entry is created                   | `slug`, `path`, `collection`, `author-login`, `author-name` |
| `update`        | An existing entry is changed             | `slug`, `path`, `collection`, `author-login`, `author-name` |
| `delete`        | An exising entry is deleted              | `slug`, `path`, `collection`, `author-login`, `author-name` |
| `uploadMedia`   | A media file is uploaded                 | `path`, `author-login`, `author-name`                       |
| `deleteMedia`   | A media file is deleted                  | `path`, `author-login`, `author-name`                       |
| `openAuthoring` | A commit is made via a forked repository | `message`, `author-login`, `author-name`                    |

Template tags produce the following output:

- `{{slug}}`: the url-safe filename of the entry changed
- `{{collection}}`: the name of the collection containing the entry changed
- `{{path}}`: the full path to the file changed
- `{{message}}`: the relevant message based on the current change (e.g. the `create` message when an entry is created)
- `{{author-login}}`: the login/username of the author
- `{{author-name}}`: the full name of the author (might be empty based on the user's profile)

## Image widget file size limit

You can set a limit to as what the maximum file size of a file is that users can upload directly into a image field.

Example config:

```yaml
- label: 'Featured Image'
  name: 'thumbnail'
  widget: 'image'
  default: '/uploads/chocolate-dogecoin.jpg'
  media_library:
    config:
      max_file_size: 512000 # in bytes, only for default media library
```

## Summary string template transformations

You can apply transformations on fields in a summary string template using filter notation syntax.

Example config:

```yaml
collections:
  - name: 'posts'
    label: 'Posts'
    folder: '_posts'
    summary: "{{title | upper}} - {{date | date('YYYY-MM-DD')}}"
    fields:
      - { label: 'Title', name: 'title', widget: 'string' }
      - { label: 'Publish Date', name: 'date', widget: 'datetime' }
```

The above config will transform the title field to uppercase and format the date field using `YYYY-MM-DD` format.
Available transformations are `upper`, `lower` and `date('<format>')`

## Registering to CMS Events

You can execute a function when a specific CMS event occurs.

Example usage:

```javascript
CMS.registerEventListener({
  name: 'prePublish',
  handler: ({ author, entry }) => console.log(JSON.stringify({ author, data: entry.get('data') })),
});
```

Supported events are `prePublish`, `postPublish`, `preUnpublish`, `postUnpublish`, `preSave` and `postSave`. The `preSave` hook can be used to modify the entry data like so:

```javascript
CMS.registerEventListener({
  name: 'preSave',
  handler: ({ entry }) => {
    return entry.get('data').set('title', 'new title');
  },
});
```

## Dynamic Default Values

When linking to `/admin/#/collections/posts/new` you can pass URL parameters to pre-populate an entry.

For example given the configuration:

```yaml
collections:
  - name: posts
    label: Posts
    folder: content/posts
    create: true
    fields:
      - label: Title
        name: title
        widget: string
      - label: Object
        name: object
        widget: object
        fields:
          - label: Title
            name: title
            widget: string
      - label: body
        name: body
        widget: markdown
```

clicking the following link: `/#/collections/posts/new?title=first&object.title=second&body=%23%20content`

will open the editor for a new post with the `title` field populated with `first`, the nested `object.title` field
with `second` and the markdown `body` field with `# content`.

**Note:** URL Encoding might be required for certain values (e.g. in the previous example the value for `body` is URL encoded).

## Nested Collections

Allows a folder collection to show a nested structure of entries and edit the locations of the entries.

Example configuration:

```yaml
collections:
  - name: pages
    label: Pages
    label_singular: 'Page'
    folder: content/pages
    create: true
    # adding a nested object will show the collection folder structure
    nested:
      depth: 100 # max depth to show in the collection tree
      summary: '{{title}}' # optional summary for a tree node, defaults to the inferred title field
    fields:
      - label: Title
        name: title
        widget: string
      - label: Body
        name: body
        widget: markdown
    # adding a meta object with a path property allows editing the path of entries
    # moving an existing entry will move the entire sub tree of the entry to the new location
    meta: { path: { widget: string, label: 'Path', index_file: 'index' } }
```

Nested collections expect the following directory structure:

```bash
content
└── pages
    ├── authors
    │   ├── author-1
    │   │   └── index.md
    │   └── index.md
    ├── index.md
    └── posts
        ├── hello-world
        │   └── index.md
        └── index.md
```

## Remark plugins

You can register plugins to customize [`remark`](https://github.com/remarkjs/remark), the library used by the richtext editor for serializing and deserializing markdown.

```js
// register a plugin
CMS.registerRemarkPlugin(plugin);

// provide global settings to all plugins, e.g. for customizing `remark-stringify`
CMS.registerRemarkPlugin({ settings: { bullet: '-' } });
```

Note that `netlify-widget-markdown` currently uses `remark@10`, so you should check a plugin's compatibility first.
