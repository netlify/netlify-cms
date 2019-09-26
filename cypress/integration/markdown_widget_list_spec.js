import '../utils/dismiss-local-backup';

describe('Markdown widget', () => {
  describe('list', () => {
    before(() => {
      cy.loginAndNewPost();
    });

    beforeEach(() => {
      cy.clearMarkdownEditorContent();
    });

    describe('toolbar buttons', () => {
      it('creates and focuses empty list', () => {
        cy.clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('removes list', () => {
        cy.clickUnorderedListButton({ times: 2 })
          .confirmMarkdownEditorContent(`
            <p></p>
          `);
      });

      it('creates nested list when selection is collapsed in non-first block of list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p></p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .type('bar')
          .enter()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p></p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `);
      });

      it('converts empty nested list item to empty block in parent list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .clickUnorderedListButton()
          .type('bar')
          .enter()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p></p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <p></p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .backspace({ times: 4 })
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('moves nested list item content to parent list item when in first block', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .clickUnorderedListButton()
          .type('bar')
          .enter()
          .clickUnorderedListButton()
          .type('baz')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <p>baz</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p>bar</p>
                <p>baz</p>
              </li>
            </ul>
          `)
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <p>bar</p>
            <p>baz</p>
          `);
      });

      it('affects only the current block with collapsed selection', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <p>foo</p>
            <ul>
              <li>
                <p>bar</p>
              </li>
            </ul>
            <p>baz</p>
          `);
      });

      it('combines adjacent same-typed lists, not differently typed lists', () => {
        cy.focused()
          .type('foo')
          .enter()
          .type('bar')
          .enter()
          .type('baz')
          .up()
          .clickUnorderedListButton()
          .up()
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
            </ul>
            <p>baz</p>
          `)
          .down({ times: 2 })
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .up()
          .enter()
          .type('qux')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ul>
                  <li>
                    <p>qux</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .up()
          .enter()
          .type('quux')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ul>
                  <li>
                    <p>quux</p>
                  </li>
                  <li>
                    <p>qux</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .clickOrderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ol>
                  <li>
                    <p>quux</p>
                  </li>
                </ol>
                <ul>
                  <li>
                    <p>qux</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .setSelection({
            anchorQuery: 'ul > li > ol p',
            anchorOffset: 1,
            focusQuery: 'ul > li > ul:last-child p',
            focusOffset: 2,
          });
      });

      it('affects only selected list items', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .type('bar')
          .enter({ times: 2 })
          .type('baz')
          .setSelection('bar')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p>bar</p>
            <ul>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
          .clickUnorderedListButton()
          .setSelection('bar', 'baz')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p>bar</p>
            <p>baz</p>
          `)
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <p>baz</p>
              </li>
            </ul>
          `)
          .setSelection('baz')
          .clickUnorderedListButton()
          .setCursorAfter('baz')
          .enter()
          .clickUnorderedListButton()
          .type('qux')
          .setSelection('baz')
          .clickOrderedListButton()
          .setCursorAfter('qux')
          .enter({ times: 4 })
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <ol>
                  <li>
                    <p>baz</p>
                    <ul>
                      <li>
                        <p>qux</p>
                      </li>
                    </ul>
                  </li>
                </ol>
                <ul>
                  <li>
                    <p></p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
      });

      it.only('wraps nested structure into list item', () => {
        cy.clickQuoteButton()
          .clickUnorderedListButton()
          .type('foo')
          .clickHeadingOneButton()
          .enter({ times: 3 })
          .clickQuoteButton()
          .type('bar')
          .setSelection('foo', 'bar')
          .clickUnorderedListButton()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <blockquote>
                  <ul>
                    <li>
                      <h1>foo</h1>
                    </li>
                  </ul>
                  <blockquote>
                    <p>bar</p>
                  </blockquote>
                </blockquote>
              </li>
            </ul>
          `);
      });
    });

    describe('on Enter', () => {
      it('removes the list item and list if empty', () => {
        cy.clickUnorderedListButton()
          .enter()
          .confirmMarkdownEditorContent(`
            <p></p>
          `);
      });

      it('creates a new paragraph in a non-empty paragraph within a list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p></p>
              </li>
            </ul>
          `)
          .type('bar')
          .enter()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p>bar</p>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('creates a new list item in an empty paragraph within a non-empty list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p></p>
              </li>
            </ul>
          `)
          .type('bar')
          .enter()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p>bar</p>
                <p></p>
              </li>
            </ul>
          `);
      });

      it('creates a new block below list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 3 })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
            <p></p>
          `);
      });
    });

    describe('on Backspace', () => {
      it('removes the list item and list if empty', () => {
        cy.clickUnorderedListButton()
          .backspace()
          .confirmMarkdownEditorContent(`
            <p></p>
          `);
      });

      it('removes empty block in non-empty list item', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter()
          .backspace()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
          `);
      });

      it('removes the list item if list not empty', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .backspace()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <p></p>
              </li>
            </ul>
          `);
      });
    });

    describe('on Tab', () => {
      it('does nothing in top level list', () => {
        cy.clickUnorderedListButton()
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p></p>
              </li>
            </ul>
          `)
          .type('foo')
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
            </ul>
          `)
      });

      it('indents nested list items', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .type('bar')
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .enter({ times: 2 })
          .tabkey()
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p></p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `)
      });

      it('only nests up to one level down from the parent list', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .tabkey({ times: 5 })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p></p>
                  </li>
                </ul>
              </li>
            </ul>
          `);
      });

      it('unindents nested list items with shift', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .tabkey()
          .tabkey({ shift: true })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
              </li>
              <li>
                <p></p>
              </li>
            </ul>
          `)
      });

      it('indents and unindents from one level below parent back to document root', () => {
        cy.clickUnorderedListButton()
          .type('foo')
          .enter({ times: 2 })
          .tabkey()
          .type('bar')
          .enter({ times: 2 })
          .tabkey()
          .type('baz')
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                    <ul>
                      <li>
                        <p>baz</p>
                      </li>
                    </ul>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .tabkey({ shift: true })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                  </li>
                  <li>
                    <p>baz</p>
                  </li>
                </ul>
              </li>
            </ul>
          `)
          .tabkey({ shift: true })
          .confirmMarkdownEditorContent(`
            <ul>
              <li>
                <p>foo</p>
                <ul>
                  <li>
                    <p>bar</p>
                  </li>
                </ul>
              </li>
              <li>
                <p>baz</p>
              </li>
            </ul>
          `)
      });
    });
  });
});