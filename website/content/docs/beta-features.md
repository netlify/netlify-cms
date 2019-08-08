---
title: Beta Features!
weight: 200
group: reference
---

We run new functionality in an open beta format from time to time. That means that this functionality is totally available for use, and we _think_ it might be ready for primetime, but it could break or change without notice.

**Use these features at your own risk.**

## List Widget: Variable Types
Before this feature, the [list widget](/docs/widgets/#list) allowed a set of fields to be repeated, but every list item had the same set of fields available. With variable types, multiple named sets of fields can be defined, which opens the door to highly flexible content authoring (even page building) in Netlify CMS.

**Note: this feature does not yet support previews, and will not output anything in the preview
pane.**

To use variable types in the list widget, update your field configuration as follows:

1. Instead of defining your list fields under `fields` or `field`, define them under `types`.  Similar to `fields`, `types` must be an array of field definition objects.
2. Each field definition under `types` must use the `object` widget (this is the default value for
`widget`).

### Additional list widget options

- `types`: a nested list of object widgets. All widgets must be of type `object`. Every object widget may define different set of fields. 
- `typeKey`: the name of the field that will be added to every item in list representing the name of the object widget that item belongs to. Ignored if `types` is not defined. Default is `type`.

### Example Configuration

The example configuration below imagines a scenario where the editor can add two "types" of content,
either a "carousel" or a "spotlight". Each type has a unique name and set of fields.

```yaml
- label: "Home Section"
  name: "sections"
  widget: "list"
  types:
    - label: "Carousel"
      name: "carousel"
      widget: object
      fields:
        - {label: Header, name: header, widget: string, default: "Image Gallery"}
        - {label: Template, name: template, widget: string, default: "carousel.html"}
        - label: Images
          name: images
          widget: list
          field: {label: Image, name: image, widget: image}
    - label: "Spotlight"
      name: "spotlight"
      widget: object
      fields:
        - {label: Header, name: header, widget: string, default: "Spotlight"}
        - {label: Template, name: template, widget: string, default: "spotlight.html"}
        - {label: Text, name: text, widget: text, default: "Hello World"}
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

Injecting config is technically already possible by setting `window.CMS_CONFIG` before importing/requiring/running Netlify CMS, but most projects are modular and don't want to use globals, plus `window.CMS_CONFIG` is an internal, not technically supported, and provides no validation.

Assuming you have the netlify-cms package installed to your project, manual initialization works like this:

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
import styles from '!css-loader!sass-loader!../main.scss'

CMS.registerPreviewStyle(styles.toString(), { raw: true })
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
```

Netlify CMS generates the following commit types:

Commit type   | When is it triggered?        | Available template tags
--------------|------------------------------|-----------------------------
`create`      | A new entry is created       | `slug`, `path`, `collection`
`update`      | An existing entry is changed | `slug`, `path`, `collection`
`delete`      | An existing entry is deleted | `slug`, `path`, `collection`
`uploadMedia` | A media file is uploaded     | `path`
`deleteMedia` | A media file is deleted      | `path`

Template tags produce the following output:

- `{{slug}}`: the url-safe filename of the entry changed

- `{{collection}}`: the name of the collection containing the entry changed

- `{{path}}`: the full path to the file changed

### Open Authoring

When using the [GitHub backend](/docs/authentication-backends/#github-backend), you can use Netlify CMS to accept contributions from GitHub users without giving them access to your repository. When they make changes in the CMS, the CMS forks your repository for them behind the scenes, and all the changes are made to the fork. When the contributor is ready to submit their changes, they can set their draft as ready for review in the CMS. This triggers a pull request to your repository, which you can merge using the GitHub UI.

At the same time, any contributors who _do_ have write access to the repository can continue to use Netlify CMS normally.

More details and setup instructions can be found on [the Open Authoring docs page](/docs/open-authoring).
