import uploadcare from 'uploadcare-widget';
import uploadcareTabEffects from 'uploadcare-widget-tab-effects';
import { Iterable } from 'immutable';

window.UPLOADCARE_LIVE = false;
window.UPLOADCARE_MANUAL_START = true;

const USER_AGENT = 'NetlifyCMS-Uploadcare-MediaLibrary';
const CDN_BASE_URL = 'https://ucarecdn.com';

/**
 * Default Uploadcare widget configuration, can be overridden via config.yml.
 */
const defaultConfig = {
  previewStep: true,
  integration: USER_AGENT,
};

/**
 * Determine whether an array of urls represents an unaltered set of Uploadcare
 * group urls. If they've been changed or any are missing, a new group will need
 * to be created to represent the current values.
 */
function isFileGroup(files) {
  const basePatternString = `~${files.length}/nth/`;
  const mapExpression = (val, idx) => new RegExp(`${basePatternString}${idx}/$`);
  const expressions = Array.from({ length: files.length }, mapExpression);
  return expressions.every(exp => files.some(url => exp.test(url)));
}

/**
 * Returns a fileGroupInfo object wrapped in a promise-like object.
 */
function getFileGroup(files) {
  /**
   * Capture the group id from the first file in the files array.
   */
  const groupId = new RegExp(`^.+/([^/]+~${files.length})/nth/`).exec(files[0])[1];

  /**
   * The `openDialog` method handles the jQuery promise object returned by
   * `fileFrom`, but requires the promise returned by `loadFileGroup` to provide
   * the result of it's `done` method.
   */
  return new Promise(resolve => uploadcare.loadFileGroup(groupId).done(group => resolve(group)));
}

/**
 * Convert a url or array/List of urls to Uploadcare file objects wrapped in
 * promises, or Uploadcare groups when possible. Output is wrapped in a promise
 * because the value we're returning may be a promise that we created.
 */
function getFiles(value) {
  if (Array.isArray(value) || Iterable.isIterable(value)) {
    const arr = Array.isArray(value) ? value : value.toJS();
    return isFileGroup(arr) ? getFileGroup(arr) : Promise.all(arr.map(val => getFile(val)));
  }
  return value && typeof value === 'string' ? getFile(value) : null;
}

/**
 * Convert a single url to an Uploadcare file object wrapped in a promise-like
 * object. Group urls that get passed here were not a part of a complete and
 * untouched group, so they'll be uploaded as new images (only way to do it).
 */
function getFile(url) {
  const groupPattern = /~\d+\/nth\/\d+\//;
  const uploaded = url.startsWith(CDN_BASE_URL) && !groupPattern.test(url);
  return uploadcare.fileFrom(uploaded ? 'uploaded' : 'url', url);
}

/**
 * Open the standalone dialog. A single instance is created and destroyed for
 * each use.
 */
function openDialog(files, config, handleInsert) {
  uploadcare.openDialog(files, config).done(({ promise }) =>
    promise().then(({ cdnUrl, count }) => {
      if (config.multiple) {
        const urls = Array.from({ length: count }, (val, idx) => `${cdnUrl}nth/${idx}/`);
        handleInsert(urls);
      } else {
        handleInsert(cdnUrl);
      }
    }),
  );
}

/**
 * Initialization function will only run once, returns an API object for Netlify
 * CMS to call methods on.
 */
async function init({ options = { config: {} }, handleInsert } = {}) {
  const { publicKey, ...globalConfig } = options.config;
  const baseConfig = { ...defaultConfig, ...globalConfig };

  window.UPLOADCARE_PUBLIC_KEY = publicKey;

  /**
   * Register the effects tab by default because the effects tab is awesome. Can
   * be disabled via config.
   */
  uploadcare.registerTab('preview', uploadcareTabEffects);

  return {
    /**
     * On show, create a new widget, cache it in the widgets object, and open.
     * No hide method is provided because the widget doesn't provide it.
     */
    show: ({ value, config: instanceConfig = {}, allowMultiple, imagesOnly = false } = {}) => {
      const config = { ...baseConfig, imagesOnly, ...instanceConfig };
      const multiple = allowMultiple === false ? false : !!config.multiple;
      const resolvedConfig = { ...config, multiple };
      const files = getFiles(value);

      /**
       * Resolve the promise only if it's ours. Only the jQuery promise objects
       * from the Uploadcare library will have a `state` method.
       */
      if (files && !files.state) {
        return files.then(result => openDialog(result, resolvedConfig, handleInsert));
      } else {
        return openDialog(files, resolvedConfig, handleInsert);
      }
    },

    /**
     * Uploadcare doesn't provide a "media library" widget for viewing and
     * selecting existing files, so we return `false` here so Netlify CMS only
     * opens the Uploadcare widget when called from an editor control. This
     * results in the "Media" button in the global nav being hidden.
     */
    enableStandalone: () => false,
  };
}

/**
 * The object that will be registered only needs a (default) name and `init`
 * method. The `init` method returns the API object.
 */
const uploadcareMediaLibrary = { name: 'uploadcare', init };

export const NetlifyCmsMediaLibraryUploadcare = uploadcareMediaLibrary;
export default uploadcareMediaLibrary;
