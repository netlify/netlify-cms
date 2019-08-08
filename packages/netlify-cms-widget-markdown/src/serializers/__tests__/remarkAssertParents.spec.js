import u from 'unist-builder';
import remarkAssertParents from '../remarkAssertParents';

const transform = remarkAssertParents();

describe('remarkAssertParents', () => {
  it('should unnest invalidly nested blocks', () => {
    const input = u('root', [
      u('paragraph', [
        u('paragraph', [u('text', 'Paragraph text.')]),
        u('heading', { depth: 1 }, [u('text', 'Heading text.')]),
        u('code', 'someCode()'),
        u('blockquote', [u('text', 'Quote text.')]),
        u('list', [u('listItem', [u('text', 'A list item.')])]),
        u('table', [u('tableRow', [u('tableCell', [u('text', 'Text in a table cell.')])])]),
        u('thematicBreak'),
      ]),
    ]);

    const output = u('root', [
      u('paragraph', [u('text', 'Paragraph text.')]),
      u('heading', { depth: 1 }, [u('text', 'Heading text.')]),
      u('code', 'someCode()'),
      u('blockquote', [u('text', 'Quote text.')]),
      u('list', [u('listItem', [u('text', 'A list item.')])]),
      u('table', [u('tableRow', [u('tableCell', [u('text', 'Text in a table cell.')])])]),
      u('thematicBreak'),
    ]);

    expect(transform(input)).toEqual(output);
  });

  it('should unnest deeply nested blocks', () => {
    const input = u('root', [
      u('paragraph', [
        u('paragraph', [
          u('paragraph', [
            u('paragraph', [u('text', 'Paragraph text.')]),
            u('heading', { depth: 1 }, [u('text', 'Heading text.')]),
            u('code', 'someCode()'),
            u('blockquote', [
              u('paragraph', [u('strong', [u('heading', [u('text', 'Quote text.')])])]),
            ]),
            u('list', [u('listItem', [u('text', 'A list item.')])]),
            u('table', [u('tableRow', [u('tableCell', [u('text', 'Text in a table cell.')])])]),
            u('thematicBreak'),
          ]),
        ]),
      ]),
    ]);

    const output = u('root', [
      u('paragraph', [u('text', 'Paragraph text.')]),
      u('heading', { depth: 1 }, [u('text', 'Heading text.')]),
      u('code', 'someCode()'),
      u('blockquote', [u('heading', [u('text', 'Quote text.')])]),
      u('list', [u('listItem', [u('text', 'A list item.')])]),
      u('table', [u('tableRow', [u('tableCell', [u('text', 'Text in a table cell.')])])]),
      u('thematicBreak'),
    ]);

    expect(transform(input)).toEqual(output);
  });

  it('should remove blocks that are emptied as a result of denesting', () => {
    const input = u('root', [
      u('paragraph', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])]),
    ]);

    const output = u('root', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])]);

    expect(transform(input)).toEqual(output);
  });

  it('should remove blocks that are emptied as a result of denesting', () => {
    const input = u('root', [
      u('paragraph', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])]),
    ]);

    const output = u('root', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])]);

    expect(transform(input)).toEqual(output);
  });

  it('should handle asymmetrical splits', () => {
    const input = u('root', [
      u('paragraph', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])]),
    ]);

    const output = u('root', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])]);

    expect(transform(input)).toEqual(output);
  });

  it('should nest invalidly nested blocks in the nearest valid ancestor', () => {
    const input = u('root', [
      u('paragraph', [
        u('blockquote', [u('strong', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])])]),
      ]),
    ]);

    const output = u('root', [
      u('blockquote', [u('heading', { depth: 1 }, [u('text', 'Heading text.')])]),
    ]);

    expect(transform(input)).toEqual(output);
  });

  it('should preserve validly nested siblings of invalidly nested blocks', () => {
    const input = u('root', [
      u('paragraph', [
        u('blockquote', [
          u('strong', [
            u('text', 'Deep validly nested text a.'),
            u('heading', { depth: 1 }, [u('text', 'Heading text.')]),
            u('text', 'Deep validly nested text b.'),
          ]),
        ]),
        u('text', 'Validly nested text.'),
      ]),
    ]);

    const output = u('root', [
      u('blockquote', [
        u('strong', [u('text', 'Deep validly nested text a.')]),
        u('heading', { depth: 1 }, [u('text', 'Heading text.')]),
        u('strong', [u('text', 'Deep validly nested text b.')]),
      ]),
      u('paragraph', [u('text', 'Validly nested text.')]),
    ]);

    expect(transform(input)).toEqual(output);
  });

  it('should allow intermediate parents like list and table to contain required block children', () => {
    const input = u('root', [
      u('blockquote', [
        u('list', [
          u('listItem', [
            u('table', [
              u('tableRow', [
                u('tableCell', [
                  u('heading', { depth: 1 }, [u('text', 'Validly nested heading text.')]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);

    const output = u('root', [
      u('blockquote', [
        u('list', [
          u('listItem', [
            u('table', [
              u('tableRow', [
                u('tableCell', [
                  u('heading', { depth: 1 }, [u('text', 'Validly nested heading text.')]),
                ]),
              ]),
            ]),
          ]),
        ]),
      ]),
    ]);

    expect(transform(input)).toEqual(output);
  });
});
