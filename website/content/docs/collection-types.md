---
group: Collections
weight: 10
title: Collection Types
---
All editable content types are defined in the `collections` field of your `config.yml` file, and display in the left sidebar of the Content page of the editor UI.

Collections come in two main types: `folder` and `files`.

## Folder collections

Folder collections represent one or more files with the same format, fields, and configuration options, all stored within the same folder in the repository. You might use a folder collection for blog posts, product pages, author data files, etc.

Unlike file collections, folder collections have the option to allow editors to create new items in the collection. This is set by the boolean `create` field.

**Note:** Folder collections must have at least one field with the name `title` for creating new entry slugs. That field should use the default `string` widget. The `label` for the field can be any string value. If you wish to use a different field as your identifier, set `identifier_field` to the field name. See the [Collections reference doc](/docs/configuration-options/#collections) for details on how collections and fields are configured. If you forget to add this field, you will get an error that your collection "must have a field that is a valid entry identifier".

Example:

```yaml
collections:
  - label: "Blog"
    name: "blog"
    folder: "_posts/blog"
    create: true
    fields:
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Publish Date", name: "date", widget: "datetime"}
      - {label: "Featured Image", name: "thumbnail", widget: "image"}
      - {label: "Body", name: "body", widget: "markdown"}
```

With `identifier_field`:

```yaml
- label: "Blog"
  name: "blog"
  folder: "_posts/blog"
  create: true
  identifier_field: name
  fields:
    - {label: "Name", name: "name", widget: "string"}
    - {label: "Publish Date", name: "date", widget: "datetime"}
    - {label: "Featured Image", name: "thumbnail", widget: "image"}
    - {label: "Body", name: "body", widget: "markdown"}
```

### Filtered folder collections

The entries for any folder collection can be filtered based on the value of a single field. By filtering a folder into different collections, you can manage files with different fields, options, extensions, etc. in the same folder.

The `filter` option requires two fields:

* `field`: The name of the collection field to filter on.
* `value`: The desired field value.

The example below creates two collections in the same folder, filtered by the `language` field. The first collection includes posts with `language: en`, and the second, with `language: es`.

```yaml
collections:
  - label: "Blog in English"
    name: "english_posts"
    folder: "_posts"
    create: true
    filter: {field: "language", value: "en"}
    fields:
      - {label: "Language", name: "language", widget: "select", options: ["en", "es"]}
      - {label: "Title", name: "title", widget: "string"}
      - {label: "Content", name: "body", widget: "markdown"}
  - label: "Blog en Español"
    name: "spanish_posts"
    folder: "_posts"
    create: true
    filter: {field: "language", value: "es"}
    fields:
      - {label: "Lenguaje", name: "language", widget: "select", options: ["en", "es"]}
      - {label: "Titulo", name: "title", widget: "string"}
      - {label: "Contenido", name: "body", widget: "markdown"}
```

### Nested collections (beta)

[Nested collections](/docs/beta-features/#nested-collections) is a beta feature that allows a folder collection to show a nested structure of entries and edit the locations of the entries. This feature is useful when you have a complex folder structure and may not want to create separate collections for every directory. As it is in beta, please use with discretion.

## File collections

A `files` collection contains one or more uniquely configured files. Unlike items in `folder` collections, which repeat the same configuration over all files in the folder, each item in a `files` collection has an explicitly set path, filename, and configuration. This can be useful for unique files with a custom set of fields, like a settings file or a custom landing page with a unique content structure.

When configuring a `files` collection, configure each file in the collection separately, and list them under the `files` field of the collection. Each file has its own list of `fields` and a unique filepath specified in the `file` field (relative to the base of the repo).

**Note:** Files listed in a file collection must already exist in the hosted repository branch set in your Netlify CMS [backend configuration](/docs/backends-overview). Files must also have a valid value for the file type. For example, an empty file works as valid YAML, but a JSON file must have a non-empty value to be valid, such as an empty object.

Example:

```yaml
collections:
  - label: "Pages"
    name: "pages"
    files:
      - label: "About Page"
        name: "about"
        file: "site/content/about.yml"
        fields:
          - {label: Title, name: title, widget: string}
          - {label: Intro, name: intro, widget: markdown}
          - label: Team
            name: team
            widget: list
            fields:
              - {label: Name, name: name, widget: string}
              - {label: Position, name: position, widget: string}
              - {label: Photo, name: photo, widget: image}
      - label: "Locations Page"
        name: "locations"
        file: "site/content/locations.yml"
        fields:
          - {label: Title, name: title, widget: string}
          - {label: Intro, name: intro, widget: markdown}
          - label: Locations
            name: locations
            widget: list
            fields:
              - {label: Name, name: name, widget: string}
              - {label: Address, name: address, widget: string}
```
