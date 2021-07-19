import registry from 'netlify-cms-core';
import visit from 'unist-util-visit';

import { markdownToRemark, remarkToMarkdown } from '..';

describe('remark plugins', () => {
  function withNetlifyLinks() {
    return transformer;
    function transformer(tree) {
      visit(tree, 'link', function onLink(node) {
        node.url = 'https://netlify.com';
      });
    }
  }

  it('should use remark transformer plugins from registry when converting mdast to markdown', () => {
    registry.registerRemarkPlugin(withNetlifyLinks);
    const result = remarkToMarkdown({
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              value: 'Some text with ',
            },
            {
              type: 'link',
              title: null,
              url: 'https://example.com',
              children: [
                {
                  type: 'text',
                  value: 'a link',
                },
              ],
            },
            {
              type: 'text',
              value: ' in it.',
            },
          ],
        },
      ],
    });
    expect(result).toMatchInlineSnapshot(`"Some text with [a link](https://netlify.com) in it."`);
  });

  it('should use remark transformer plugins from registry when converting markdown to mdast', () => {
    registry.registerRemarkPlugin(withNetlifyLinks);
    const result = markdownToRemark('Some text with [a link](https://example.com) in it.');
    expect(result).toMatchInlineSnapshot(`
Object {
  "children": Array [
    Object {
      "children": Array [
        Object {
          "children": Array [],
          "position": Position {
            "end": Object {
              "column": 16,
              "line": 1,
              "offset": 15,
            },
            "indent": Array [],
            "start": Object {
              "column": 1,
              "line": 1,
              "offset": 0,
            },
          },
          "type": "text",
          "value": "Some text with ",
        },
        Object {
          "children": Array [
            Object {
              "children": Array [],
              "position": Position {
                "end": Object {
                  "column": 23,
                  "line": 1,
                  "offset": 22,
                },
                "indent": Array [],
                "start": Object {
                  "column": 17,
                  "line": 1,
                  "offset": 16,
                },
              },
              "type": "text",
              "value": "a link",
            },
          ],
          "position": Position {
            "end": Object {
              "column": 45,
              "line": 1,
              "offset": 44,
            },
            "indent": Array [],
            "start": Object {
              "column": 16,
              "line": 1,
              "offset": 15,
            },
          },
          "title": null,
          "type": "link",
          "url": "https://netlify.com",
        },
        Object {
          "children": Array [],
          "position": Position {
            "end": Object {
              "column": 52,
              "line": 1,
              "offset": 51,
            },
            "indent": Array [],
            "start": Object {
              "column": 45,
              "line": 1,
              "offset": 44,
            },
          },
          "type": "text",
          "value": " in it.",
        },
      ],
      "position": Position {
        "end": Object {
          "column": 52,
          "line": 1,
          "offset": 51,
        },
        "indent": Array [],
        "start": Object {
          "column": 1,
          "line": 1,
          "offset": 0,
        },
      },
      "type": "paragraph",
    },
  ],
  "position": Object {
    "end": Object {
      "column": 52,
      "line": 1,
      "offset": 51,
    },
    "start": Object {
      "column": 1,
      "line": 1,
      "offset": 0,
    },
  },
  "type": "root",
}
`);
  });
});
