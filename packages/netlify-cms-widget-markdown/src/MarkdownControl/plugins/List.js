import { List } from 'immutable';
import { castArray, throttle, get } from 'lodash';
import { Range, Block } from 'slate';
import isHotkey from 'is-hotkey';
import { assertType } from './util';

/**
 * TODO:
 * - make sure nested empty list items (can be read in from markdown) don't cause list handling to break
 * - closing a block in a nested list item via backspace should only close the
 *   immediate block
 * - backspace should close a list item without opening a new list item in the
 *   ancestor list, and next backspace should do the norm, move selection to end
 *   of previous list item
 * - tab pressed inside of nested block within list item, eg. quote, but with
 *   the cursor at the very beginning of the block, should indent the parent
 *   list item
 * - other tab handlers (should only be code block) should be registered before
 *   this, as it will attempt to tab expanded selections where the entire
 *   selection shares a common list item ancestor
 * - handle enter when it's pressed in a block child of a list item?
 * - handle expanded enter
 * - ideally you'd put list plugin last so others can intercept keyboard actions
 *   for nested types, but a list can be nested in a quote, so how do we ensure
 *   the action only hits the closest of the two (quote or list item)?
 * - handle list button/tab/enter inside of quote (and eventually table, should be same though)
 * - test multiple subsequent lists of same and different types
 * - tab multiple list items when selection is expanded
 * - tab multiple nested lists and items when selection is expanded
 * - empty new list item is parsed as a literal asterisk in markdown until non-empty
 */
const ListPlugin = ({ defaultType, unorderedListType, orderedListType }) => {
  const LIST_TYPES = [orderedListType, unorderedListType];

  function oppositeListType(type) {
    switch (type) {
      case LIST_TYPES[0]:
        return LIST_TYPES[1];
      case LIST_TYPES[1]:
        return LIST_TYPES[0];
    }
  }

  return {
    queries: {
      getCurrentListItem(editor) {
        const { startBlock, endBlock } = editor.value;
        const ancestor = editor.value.document.getCommonAncestor(startBlock.key, endBlock.key);
        if (ancestor && ancestor.type === 'list-item') {
          return ancestor;
        }
        return editor.value.document.getClosest(ancestor.key, node => node.type === 'list-item');
      },
      getListOrListItem(editor, { node, ...opts } = {}) {
        const listContextNode = editor.getListContextNode(node);
        if (!listContextNode) {
          return;
        }
        if (['bulleted-list', 'numbered-list', 'list-item'].includes(listContextNode.type)) {
          return listContextNode;
        }
        if (opts.force) {
          return editor.getListOrListItem({ node: listContextNode, ...opts });
        }
      },
      getListContextNode(editor, node) {
        const targetTypes = ['bulleted-list', 'numbered-list', 'list-item', 'quote', 'table-cell'];
        const { startBlock, selection } = editor.value;
        const target = node
          ? editor.value.document.getParent(node.key)
          : (selection.isCollapsed && startBlock) || editor.getCommonAncestor();
        if (!target) {
          return;
        }
        if (targetTypes.includes(target.type)) {
          return target;
        }
        return editor.getListContextNode(target);
      },
      isList(editor, node) {
        return node && LIST_TYPES.includes(node.type);
      },
      getLowestListItem(editor, list) {
        assertType(list, LIST_TYPES);
        const lastItem = list.nodes.last();
        const lastItemLastChild = lastItem.nodes.last();
        if (editor.isList(lastItemLastChild)) {
          return editor.getLowestListItem(lastItemLastChild);
        }
        return lastItem;
      },
    },
    commands: {
      wrapInList(editor, type) {
        editor.withoutNormalizing(() => {
          editor.wrapBlock(type).wrapBlock('list-item');
        });
      },
      unwrapListItem(editor, node) {
        assertType(node, 'list-item');
        editor.withoutNormalizing(() => {
          editor.unwrapNodeByKey(node.key).unwrapBlockChildren(node);
        });
      },
      indentListItems: throttle(function indentListItem(editor, listItemsArg) {
        const listItems = List.isList(listItemsArg) ? listItemsArg : List(castArray(listItemsArg));
        const firstListItem = listItems.first();
        const firstListItemIndex = editor.value.document.getPath(firstListItem.key).last();
        const list = editor.value.document.getParent(firstListItem.key);

        /**
         * If the first list item in the list is in the selection, and the list
         * previous sibling is a list of the opposite type, we should still indent
         * the list items as children of the last item in the previous list, as
         * the behavior otherwise for first items is to do nothing on tab, while
         * in this case the user would expect indenting via tab to "just work".
         */
        if (firstListItemIndex === 0) {
          const listPreviousSibling = editor.value.document.getPreviousSibling(list.key);
          if (!listPreviousSibling || listPreviousSibling.type !== oppositeListType(list.type)) {
            return;
          }
          editor.withoutNormalizing(() => {
            listItems.forEach((listItem, idx) => {
              const index = listPreviousSibling.nodes.size + idx;
              editor.moveNodeByKey(listItem.key, listPreviousSibling.key, index);
            });
          });
        }

        /**
         * Wrap all selected list items into a new list item and list, then merge
         * the new parent list item into the previous list item in the list.
         */
        const newListItem = Block.create('list-item');
        const newList = Block.create(list.type);
        editor.withoutNormalizing(() => {
          editor
            .insertNodeByKey(list.key, firstListItemIndex, newListItem)
            .insertNodeByKey(newListItem.key, 0, newList);

          listItems.forEach((listItem, index) => {
            editor.moveNodeByKey(listItem.key, newList.key, index);
          });

          editor.mergeNodeByKey(newListItem.key);
        });
      }, 100),
      unindentListItems: throttle(function unindentListItems(editor, listItemsArg) {
        // Ensure that `listItems` are children of a list.
        const listItems = List.isList(listItemsArg) ? listItemsArg : List(castArray(listItemsArg));
        const list = editor.value.document.getParent(listItems.first().key);
        if (!editor.isList(list)) {
          return;
        }

        // If the current list isn't nested under a list, we cannot unindent.
        const parentListItem = editor.value.document.getParent(list.key);
        if (!parentListItem || parentListItem.type !== 'list-item') {
          return;
        }

        // Check if there are more list items after the items being indented.
        const nextSibling = editor.value.document.getNextSibling(listItems.last().key);

        // Unwrap each selected list item into the parent list.
        editor.withoutNormalizing(() => {
          listItems.forEach(listItem => editor.unwrapNodeToDepth(listItem, 2));
        });

        // If there were other list items after the selected items, use the last
        // of the unindented list items as the new parent of the remaining items
        // list.
        if (nextSibling) {
          const nextSiblingParentListItem = editor.value.document.getNextSibling(
            listItems.last().key,
          );
          editor.mergeNodeByKey(nextSiblingParentListItem.key);
        }
      }, 100),
      toggleListItemType(editor, listItem) {
        assertType(listItem, 'list-item');
        const list = editor.value.document.getParent(listItem.key);
        const newListType = oppositeListType(list.type);
        editor.withoutNormalizing(() => {
          editor.unwrapNodeByKey(listItem.key).wrapBlockByKey(listItem.key, newListType);
        });
      },
      toggleList(editor, type) {
        if (!LIST_TYPES.includes(type)) {
          throw Error(`${type} is not a valid list type, must be one of: ${LIST_TYPES}`);
        }
        const { startBlock } = editor.value;
        const target = editor.getListContextNode();

        switch (get(target, 'type')) {
          case 'bulleted-list':
          case 'numbered-list': {
            const list = target;
            if (list.type !== type) {
              const newListType = oppositeListType(target.type);
              const newList = Block.create(newListType);
              editor.withoutNormalizing(() => {
                editor.wrapBlock(newList).unwrapNodeByKey(newList.key);
              });
            } else {
              editor.withoutNormalizing(() => {
                list.nodes.forEach(listItem => {
                  if (editor.isSelected(listItem)) {
                    editor.unwrapListItem(listItem);
                  }
                });
              });
            }
            break;
          }

          case 'list-item': {
            const listItem = target;
            const list = editor.value.document.getParent(listItem.key);
            if (!editor.isFirstChild(startBlock)) {
              editor.wrapInList(type);
            } else if (list.type !== type) {
              editor.toggleListItemType(listItem);
            } else {
              editor.unwrapListItem(listItem);
            }
            break;
          }

          default: {
            editor.wrapInList(type);
            break;
          }
        }
      },
    },
    onKeyDown(event, editor, next) {
      if (isHotkey('backspace', event) && editor.value.selection.isCollapsed) {

        // Backspace
        const listOrListItem = editor.getListOrListItem();
        const isListItem = listOrListItem && listOrListItem.type === 'list-item';
        if (isListItem && editor.value.selection.start.isAtStartOfNode(listOrListItem)) {
          const listItem = listOrListItem;
          const previousSibling = editor.value.document.getPreviousSibling(listItem.key);
          if (previousSibling && previousSibling.type === 'list-item') {
            return editor.mergeNodeByKey(listItem.key);
          }
          return editor.unwrapListItem(listItem);
        }

        const block = editor.value.startBlock;
        const previousSibling = editor.value.document.getPreviousSibling(block.key);
        const isAtStart = editor.value.selection.start.isAtStartOfNode(block);
        if (block.type === defaultType && isAtStart && editor.isList(previousSibling)) {
          return editor.wrapInList(previousSibling.type);
        }
        return next();

      } else if (isHotkey('tab', event) || isHotkey('shift+tab', event)) {

        // Tab, Shift+Tab
        const isTab = isHotkey('tab', event);
        const isShiftTab = !isTab;
        event.preventDefault();

        const listOrListItem = editor.getListOrListItem({ force: true });
        if (!listOrListItem) {
          return next();
        }

        if (listOrListItem.type === 'list-item') {
          const listItem = listOrListItem;
          if (isTab) {
            return editor.indentListItems(listItem);
          }
          if (isShiftTab) {
            return editor.unindentListItems(listItem);
          }
        } else {
          const list = listOrListItem;
          if (isTab) {
            const listItems = editor.getSelectedChildren(list);
            return editor.indentListItems(listItems);
          }
          if (isShiftTab) {
            const listItems = editor.getSelectedChildren(list);
            return editor.unindentListItems(listItems);
          }
        }
        return next();
      } else if (isHotkey('enter', event)) {

        // Enter
        const listOrListItem = editor.getListOrListItem();
        if (!listOrListItem) {
          return next();
        }

        if (editor.value.selection.isExpanded) {
          editor.delete();
        }

        if (listOrListItem.type === 'list-item') {
          const listItem = listOrListItem;

          // If focus is at start of list item, unwrap the entire list item.
          if (editor.atStartOf(listItem)) {
            return editor.unwrapListItem(listItem);
          }

          // If focus is at start of a subsequent block in the list item, move
          // everything after the cursor in the current list item to a new list
          // item.
          if (editor.atStartOf(editor.value.startBlock)) {
            const newListItem = Block.create('list-item');
            const range = Range.create(editor.value.selection).moveEndToEndOfNode(listItem);

            return editor.withoutNormalizing(() => {
              editor.wrapBlockAtRange(range, newListItem).unwrapNodeByKey(newListItem.key);
            });
          }

          return next();
        } else {
          const list = listOrListItem;
          if (list.nodes.size === 0) {
            return editor.removeNodeByKey(list.key);
          }
        }
        return next();
      }
      return next();
    },
  };
};

export default ListPlugin;