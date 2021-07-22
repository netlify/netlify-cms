---
group: Media
weight: 10
title: Cloudinary
---
Cloudinary is a digital asset management platform with a broad feature set, including support for responsive image generation and url based image transformation. They also provide a powerful media library UI for managing assets, and tools for organizing your assets into a hierarchy.

The Cloudinary media library integration for Netlify CMS uses Cloudinary's own media library interface within Netlify CMS. To get started, you'll need a Cloudinary account and Netlify CMS 2.3.0 or greater.

## Creating a Cloudinary Account

You can [sign up for Cloudinary](https://cloudinary.com/users/register/free) for free. Once you're logged in, you'll need to retrieve your Cloud name and API key from the upper left corner of the Cloudinary console.

![Cloudinary console screenshot](/img/cloudinary-console-details.png)

## Connecting Cloudinary to Netlify CMS

To use the Cloudinary media library within Netlify CMS, you'll need to update your Netlify CMS configuration file with the information from your Cloudinary account:

```yaml
media_library:
  name: cloudinary
  config:
    cloud_name: your_cloud_name
    api_key: your_api_key
```

**Note:** The user must be logged in to the Cloudinary account connected to the `api_key` used in your Netlify CMS configuration. 

**Note:** The Netlify CMS media library extensions for Cloudinary are not included in `netlify-cms-app`. If you're using `netlify-cms-app`, you'll need to [register the media libraries yourself](https://www.netlifycms.org/blog/2019/07/netlify-cms-gatsby-plugin-4-0-0#using-media-libraries-with-netlify-cms-app).

### Security Considerations

Although this setup exposes the `cloud_name` and `api_key` publicly via the `/admin/config.yml` endpoint, this information is not sensitive. Any integration of the Cloudinary media library requires this information to be exposed publicly. To use this library or use the restricted Cloudinary API endpoints, the user must have access to the Cloudinary account login details or the `api_secret` associated with the `cloud_name` and `api_key`.

## Netlify CMS configuration options

The following options are specific to the Netlify CMS integration for Cloudinary:

* **`output_filename_only`**: *(default: `false`)*\
  By default, the value provided for a selected image is a complete URL for the asset on Cloudinary's CDN. Setting `output_filename_only` to `true` will instead produce just the filename (e.g. `image.jpg`). This should be `true` if you will be directly embedding cloudinary transformation urls in page templates. Refer to [Inserting Cloudinary URL in page templates](#inserting-cloudinary-url-in-page-templates).
* **`use_transformations`**: *(default: `true`)*\
  If `true`, uses derived url when available (the url will have image transformation segments included). Has no effect if `output_filename_only` is set to `true`.
* **`use_secure_url`**: *(default: `true`)*\
  Controls whether an `http` or `https` URL is provided. Has no effect if `output_filename_only` is set to `true`.

## Cloudinary configuration options

The following options are used to configure the media library. All options are listed in Cloudinary's [media library documentation](https://cloudinary.com/documentation/media_library_widget#3_set_the_configuration_options), but only options listed below are available or recommended for the Netlify CMS integration:

### Authentication

* `cloud_name`
* `api_key`

### Media library behavior

* `default_transformations` *\- only the first [image transformation](#image-transformations) is used, be sure to use the `SDK Parameter` column transformation names from the* *[transformation reference](https://cloudinary.com/documentation/image_transformation_reference)*
* `max_files` *\- has no impact on images inside the [markdown widget](/docs/widgets/#markdown)*. Refer to [media library documentation](https://cloudinary.com/documentation/media_library_widget#3_set_the_configuration_options) for details on this property
* `multiple` *\- has no impact on images inside the [markdown widget](/docs/widgets/#markdown)*. Refer to [media library documentation](https://cloudinary.com/documentation/media_library_widget#3_set_the_configuration_options) for details on this property

## Image transformations

The Cloudinary integration allows images to be transformed in two ways: directly within Netlify CMS via [Cloudinary's Media Library](#transforming-images-via-media-library), and separately from the CMS via Cloudinary's [dynamic URL's](https://cloudinary.com/documentation/image_transformations#delivering_media_assets_using_dynamic_urls) by [inserting cloudinary urls](#inserting-cloudinary-url-in-page-templates).

### Transforming images via Media Library

If you transform and insert images from within the Cloudinary media library, the transformed image URL will be output by default. This gives the editor complete freedom to make changes to the image output.
There are two ways to configure image transformation via media library - [globally](#global-configuration) and per [field](#field-configuration). Global options will be overridden by field options.

#### Global configuration

Global configuration, which is meant to affect the Cloudinary widget at all times, can be provided
as seen below, under the primary `media_library` property. Settings applied here will affect every
instance of the Cloudinary widget.

```yaml
# global
media_library:
  name: cloudinary
  output_filename_only: false
  config:
    default_transformations:
      - - fetch_format: auto
          width: 160
          quality: auto
          crop: scale
```

#### Field configuration

Configuration can also be provided for individual fields that use the media library. The structure
is very similar to the global configuration, except the settings are added to an individual `field`.
For example:

```yaml
# field
fields: # The fields each document in this collection have
- label: 'Cover Image'
  name: 'image'
  widget: 'image'
  required: false
  tagname: ''
  media_library:
    config:
      default_transformations:
        - - fetch_format: auto
            width: 300    
            quality: auto
            crop: fill
            effect: grayscale
```

## Inserting Cloudinary URL in page templates

If you prefer to provide direction so that images are transformed in a specific way, or dynamically retrieve images based on viewport size, you can do so by providing your own base Cloudinary URL and only storing the asset filenames in your content:

* Either globally or for specific fields, configure the Cloudinary extension to only output the asset filename

```yaml
# global
media_library:
  name: cloudinary
  output_filename_only: true
# field
media_library:
  name: cloudinary
  output_filename_only: true
```

* Provide a dynamic URL in the site template

```handlebars
{{! handlebars example }}
<img src="https://res.cloudinary.com/<cloud_name>/<resource_type>/<type>/<transformations>/{{image}}"/>
```

Your dynamic URL can be formed conditionally to provide any desired transformations - please see Cloudinary's [image transformation reference](https://cloudinary.com/documentation/image_transformation_reference) for available transformations.