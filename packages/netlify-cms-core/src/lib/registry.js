import { Map } from 'immutable';
import produce from 'immer';
import { oneLine } from 'common-tags';

import EditorComponent from '../valueObjects/EditorComponent';

const allowedEvents = [
  'prePublish',
  'postPublish',
  'preUnpublish',
  'postUnpublish',
  'preSave',
  'postSave',
];
const eventHandlers = {};
allowedEvents.forEach(e => {
  eventHandlers[e] = [];
});

/**
 * Global Registry Object
 */
const registry = {
  backends: {},
  templates: {},
  previewStyles: [],
  widgets: {},
  editorComponents: Map(),
  remarkPlugins: [],
  widgetValueSerializers: {},
  mediaLibraries: [],
  locales: {},
  eventHandlers,
};

export default {
  registerPreviewStyle,
  getPreviewStyles,
  registerPreviewTemplate,
  getPreviewTemplate,
  registerWidget,
  getWidget,
  getWidgets,
  resolveWidget,
  registerEditorComponent,
  getEditorComponents,
  registerRemarkPlugin,
  getRemarkPlugins,
  registerWidgetValueSerializer,
  getWidgetValueSerializer,
  registerBackend,
  getBackend,
  registerMediaLibrary,
  getMediaLibrary,
  registerLocale,
  getLocale,
  registerEventListener,
  removeEventListener,
  getEventListeners,
  invokeEvent,
};

/**
 * Preview Styles
 *
 * Valid options:
 *  - raw {boolean} if `true`, `style` value is expected to be a CSS string
 */
export function registerPreviewStyle(style, opts) {
  registry.previewStyles.push({ ...opts, value: style });
}
export function getPreviewStyles() {
  return registry.previewStyles;
}

/**
 * Preview Templates
 */
export function registerPreviewTemplate(name, component) {
  registry.templates[name] = component;
}
export function getPreviewTemplate(name) {
  return registry.templates[name];
}

/**
 * Editor Widgets
 */
export function registerWidget(name, control, preview, schema = {}) {
  if (Array.isArray(name)) {
    name.forEach(widget => {
      if (typeof widget !== 'object') {
        console.error(`Cannot register widget: ${widget}`);
      } else {
        registerWidget(widget);
      }
    });
  } else if (typeof name === 'string') {
    // A registered widget control can be reused by a new widget, allowing
    // multiple copies with different previews.
    const newControl = typeof control === 'string' ? registry.widgets[control].control : control;
    registry.widgets[name] = { control: newControl, preview, schema };
  } else if (typeof name === 'object') {
    const {
      name: widgetName,
      controlComponent: control,
      previewComponent: preview,
      schema = {},
      allowMapValue,
      globalStyles,
      ...options
    } = name;
    if (registry.widgets[widgetName]) {
      console.warn(oneLine`
        Multiple widgets registered with name "${widgetName}". Only the last widget registered with
        this name will be used.
      `);
    }
    if (!control) {
      throw Error(`Widget "${widgetName}" registered without \`controlComponent\`.`);
    }
    registry.widgets[widgetName] = {
      control,
      preview,
      schema,
      globalStyles,
      allowMapValue,
      ...options,
    };
  } else {
    console.error('`registerWidget` failed, called with incorrect arguments.');
  }
}
export function getWidget(name) {
  return registry.widgets[name];
}
export function getWidgets() {
  return produce(Object.entries(registry.widgets), draft => {
    return draft.map(([key, value]) => ({ name: key, ...value }));
  });
}
export function resolveWidget(name) {
  return getWidget(name || 'string') || getWidget('unknown');
}

/**
 * Markdown Editor Custom Components
 */
export function registerEditorComponent(component) {
  const plugin = EditorComponent(component);
  if (plugin.type === 'code-block') {
    const codeBlock = registry.editorComponents.find(c => c.type === 'code-block');

    if (codeBlock) {
      console.warn(oneLine`
        Only one editor component of type "code-block" may be registered. Previously registered code
        block component(s) will be overwritten.
      `);
      registry.editorComponents = registry.editorComponents.delete(codeBlock.id);
    }
  }

  registry.editorComponents = registry.editorComponents.set(plugin.id, plugin);
}
export function getEditorComponents() {
  return registry.editorComponents;
}

/**
 * Remark plugins
 */
/** @typedef {import('unified').Pluggable} RemarkPlugin */
/** @type {(plugin: RemarkPlugin) => void} */
export function registerRemarkPlugin(plugin) {
  registry.remarkPlugins.push(plugin);
}
/** @type {() => Array<RemarkPlugin>} */
export function getRemarkPlugins() {
  return registry.remarkPlugins;
}

/**
 * Widget Serializers
 */
export function registerWidgetValueSerializer(widgetName, serializer) {
  registry.widgetValueSerializers[widgetName] = serializer;
}
export function getWidgetValueSerializer(widgetName) {
  return registry.widgetValueSerializers[widgetName];
}

/**
 * Backend API
 */
export function registerBackend(name, BackendClass) {
  if (!name || !BackendClass) {
    console.error(
      "Backend parameters invalid. example: CMS.registerBackend('myBackend', BackendClass)",
    );
  } else if (registry.backends[name]) {
    console.error(`Backend [${name}] already registered. Please choose a different name.`);
  } else {
    registry.backends[name] = {
      init: (...args) => new BackendClass(...args),
    };
  }
}

export function getBackend(name) {
  return registry.backends[name];
}

/**
 * Media Libraries
 */
export function registerMediaLibrary(mediaLibrary, options) {
  if (registry.mediaLibraries.find(ml => mediaLibrary.name === ml.name)) {
    throw new Error(`A media library named ${mediaLibrary.name} has already been registered.`);
  }
  registry.mediaLibraries.push({ ...mediaLibrary, options });
}

export function getMediaLibrary(name) {
  return registry.mediaLibraries.find(ml => ml.name === name);
}

function validateEventName(name) {
  if (!allowedEvents.includes(name)) {
    throw new Error(`Invalid event name '${name}'`);
  }
}

export function getEventListeners(name) {
  validateEventName(name);
  return [...registry.eventHandlers[name]];
}

export function registerEventListener({ name, handler }, options = {}) {
  validateEventName(name);
  registry.eventHandlers[name].push({ handler, options });
}

export async function invokeEvent({ name, data }) {
  validateEventName(name);
  const handlers = registry.eventHandlers[name];

  let _data = { ...data };
  for (const { handler, options } of handlers) {
    try {
      const result = await handler(_data, options);
      if (result !== undefined) {
        const entry = _data.entry.set('data', result);
        _data = { ...data, entry };
      }
    } catch (e) {
      console.warn(`Failed running handler for event ${name} with message: ${e.message}`);
    }
  }
  return _data.entry.get('data');
}

export function removeEventListener({ name, handler }) {
  validateEventName(name);
  if (handler) {
    registry.eventHandlers[name] = registry.eventHandlers[name].filter(
      item => item.handler !== handler,
    );
  } else {
    registry.eventHandlers[name] = [];
  }
}

/**
 * Locales
 */
export function registerLocale(locale, phrases) {
  if (!locale || !phrases) {
    console.error("Locale parameters invalid. example: CMS.registerLocale('locale', phrases)");
  } else {
    registry.locales[locale] = phrases;
  }
}

export function getLocale(locale) {
  return registry.locales[locale];
}
