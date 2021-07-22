import visit from 'unist-util-visit';

import { markdownToRemark, remarkToMarkdown } from '..';

describe('registered remark plugins', () => {
  function withNetlifyLinks() {
    return function transformer(tree) {
      visit(tree, 'link', function onLink(node) {
        node.url = 'https://netlify.com';
      });
    };
  }

  it('should use remark transformer plugins when converting mdast to markdown', () => {
    const plugins = [withNetlifyLinks];
    const result = remarkToMarkdown(
      {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Some ',
              },
              {
                type: 'emphasis',
                children: [
                  {
                    type: 'text',
                    value: 'important',
                  },
                ],
              },
              {
                type: 'text',
                value: ' text with ',
              },
              {
                type: 'link',
                title: null,
                url: 'https://this-value-should-be-replaced.com',
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
      },
      plugins,
    );
    expect(result).toMatchInlineSnapshot(
      `"Some *important* text with [a link](https://netlify.com) in it."`,
    );
  });

  it('should use remark transformer plugins when converting markdown to mdast', () => {
    const plugins = [withNetlifyLinks];
    const result = markdownToRemark(
      'Some text with [a link](https://this-value-should-be-replaced.com) in it.',
      plugins,
    );
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
              "column": 67,
              "line": 1,
              "offset": 66,
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
              "column": 74,
              "line": 1,
              "offset": 73,
            },
            "indent": Array [],
            "start": Object {
              "column": 67,
              "line": 1,
              "offset": 66,
            },
          },
          "type": "text",
          "value": " in it.",
        },
      ],
      "position": Position {
        "end": Object {
          "column": 74,
          "line": 1,
          "offset": 73,
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
      "column": 74,
      "line": 1,
      "offset": 73,
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

  it('should use remark serializer plugins when converting mdast to markdown', () => {
    function withEscapedLessThanChar() {
      if (this.Compiler) {
        this.Compiler.prototype.visitors.text = node => {
          return node.value.replace(/</g, '&lt;');
        };
      }
    }

    const plugins = [withEscapedLessThanChar];
    const result = remarkToMarkdown(
      {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: '<3 Netlify',
              },
            ],
          },
        ],
      },
      plugins,
    );
    expect(result).toMatchInlineSnapshot(`"&lt;3 Netlify"`);
  });

  it('should use remark preset with settings when converting mdast to markdown', () => {
    const settings = {
      emphasis: '_',
      bullet: '-',
    };

    const plugins = [{ settings }];
    const result = remarkToMarkdown(
      {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                value: 'Some ',
              },
              {
                type: 'emphasis',
                children: [
                  {
                    type: 'text',
                    value: 'important',
                  },
                ],
              },
              {
                type: 'text',
                value: ' points:',
              },
            ],
          },
          {
            type: 'list',
            ordered: false,
            start: null,
            spread: false,
            children: [
              {
                type: 'listItem',
                spread: false,
                checked: null,
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        value: 'One',
                      },
                    ],
                  },
                ],
              },
              {
                type: 'listItem',
                spread: false,
                checked: null,
                children: [
                  {
                    type: 'paragraph',
                    children: [
                      {
                        type: 'text',
                        value: 'Two',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
      plugins,
    );
    expect(result).toMatchInlineSnapshot(`
"Some _important_ points:

- One
- Two"
`);
  });
});
