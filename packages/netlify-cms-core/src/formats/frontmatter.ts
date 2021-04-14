import matter from 'gray-matter';
import tomlFormatter from './toml';
import yamlFormatter from './yaml';
import jsonFormatter from './json';

export type Delimiter = string | [string, string];
type Format = { language: string; delimiters: Delimiter };

const parsers = {
  toml: {
    parse: (input: string) => tomlFormatter.fromFile(input),
    stringify: (metadata: object, opts?: { sortedKeys?: string[] }) => {
      const { sortedKeys } = opts || {};
      return tomlFormatter.toFile(metadata, sortedKeys);
    },
  },
  json: {
    parse: (input: string) => {
      let JSONinput = input.trim();
      // Fix JSON if leading and trailing brackets were trimmed.
      if (JSONinput.substr(0, 1) !== '{') {
        JSONinput = '{' + JSONinput + '}';
      }
      return jsonFormatter.fromFile(JSONinput);
    },
    stringify: (metadata: object) => {
      let JSONoutput = jsonFormatter.toFile(metadata).trim();
      // Trim leading and trailing brackets.
      if (JSONoutput.substr(0, 1) === '{' && JSONoutput.substr(-1) === '}') {
        JSONoutput = JSONoutput.substring(1, JSONoutput.length - 1);
      }
      return JSONoutput;
    },
  },
  yaml: {
    parse: (input: string) => yamlFormatter.fromFile(input),
    stringify: (
      metadata: object,
      opts?: { sortedKeys?: string[]; comments?: Record<string, string> },
    ) => {
      const { sortedKeys, comments } = opts || {};
      return yamlFormatter.toFile(metadata, sortedKeys, comments);
    },
  },
};

function inferFrontmatterFormat(str: string) {
  const firstLine = str.substr(0, str.indexOf('\n')).trim();
  if (firstLine.length > 3 && firstLine.substr(0, 3) === '---') {
    // No need to infer, `gray-matter` will handle things like `---toml` for us.
    return;
  }
  switch (firstLine) {
    case '---':
      return getFormatOpts('yaml');
    case '+++':
      return getFormatOpts('toml');
    case '{':
      return getFormatOpts('json');
    default:
      console.warn('Unrecognized front-matter format.');
  }
}

export function getFormatOpts(format?: string, customDelimiter?: Delimiter) {
  if (!format || (format !== 'yaml' && format !== 'toml' && format !== 'json')) {
    return undefined;
  }

  const formats: {
    [key in 'yaml' | 'toml' | 'json']: Format;
  } = {
    yaml: { language: 'yaml', delimiters: '---' },
    toml: { language: 'toml', delimiters: '+++' },
    json: { language: 'json', delimiters: ['{', '}'] },
  };

  const { language, delimiters } = formats[format];

  return {
    language,
    delimiters: customDelimiter || delimiters,
  };
}

export class FrontmatterFormatter {
  format?: Format;

  constructor(format?: string, customDelimiter?: Delimiter) {
    this.format = getFormatOpts(format, customDelimiter);
  }

  fromFile(content: string) {
    const format = this.format || inferFrontmatterFormat(content);
    const result = matter(content, { engines: parsers, ...format });
    // in the absent of a body when serializing an entry we use an empty one
    // when calling `toFile`, so we don't want to add it when parsing.
    return {
      ...result.data,
      ...(result.content.trim() && { body: result.content }),
    };
  }

  toFile(
    data: { body?: string } & Record<string, unknown>,
    sortedKeys?: string[],
    comments?: Record<string, string>,
  ) {
    const { body = '', ...meta } = data;

    // Stringify to YAML if the format was not set
    const format = this.format || getFormatOpts('yaml');

    // gray-matter always adds a line break at the end which trips our
    // change detection logic
    // https://github.com/jonschlinkert/gray-matter/issues/96
    const trimLastLineBreak = body.slice(-1) !== '\n';
    const file = matter.stringify(body, meta, {
      engines: parsers,
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore `sortedKeys` is not recognized by gray-matter, so it gets passed through to the parser
      sortedKeys,
      comments,
      ...format,
    });
    return trimLastLineBreak && file.slice(-1) === '\n' ? file.substring(0, file.length - 1) : file;
  }
}

export const FrontmatterInfer = new FrontmatterFormatter();

export function frontmatterYAML(customDelimiter?: Delimiter) {
  return new FrontmatterFormatter('yaml', customDelimiter);
}

export function frontmatterTOML(customDelimiter?: Delimiter) {
  return new FrontmatterFormatter('toml', customDelimiter);
}

export function frontmatterJSON(customDelimiter?: Delimiter) {
  return new FrontmatterFormatter('json', customDelimiter);
}
