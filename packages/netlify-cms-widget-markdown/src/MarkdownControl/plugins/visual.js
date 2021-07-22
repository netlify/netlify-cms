//import { Text, Inline } from 'slate';
import isHotkey from 'is-hotkey';

import CommandsAndQueries from './CommandsAndQueries';
import ListPlugin from './List';
import LineBreak from './LineBreak';
import BreakToDefaultBlock from './BreakToDefaultBlock';
import CloseBlock from './CloseBlock';
import QuoteBlock from './QuoteBlock';
import SelectAll from './SelectAll';
import CopyPasteVisual from './CopyPasteVisual';
import Link from './Link';
import ForceInsert from './ForceInsert';
import Shortcode from './Shortcode';
import { SLATE_DEFAULT_BLOCK_TYPE as defaultType } from '../../types';
import Hotkey, { HOT_KEY_MAP } from './Hotkey';

function plugins({ getAsset, resolveWidget, t, remarkPlugins }) {
  return [
    {
      onKeyDown(event, editor, next) {
        if (isHotkey('mod+j', event)) {
          console.log(JSON.stringify(editor.value.document.toJS(), null, 2));
        }
        next();
      },
    },
    Hotkey(HOT_KEY_MAP['bold'], e => e.toggleMark('bold')),
    Hotkey(HOT_KEY_MAP['code'], e => e.toggleMark('code')),
    Hotkey(HOT_KEY_MAP['italic'], e => e.toggleMark('italic')),
    Hotkey(HOT_KEY_MAP['strikethrough'], e => e.toggleMark('strikethrough')),
    Hotkey(HOT_KEY_MAP['heading-one'], e => e.toggleBlock('heading-one')),
    Hotkey(HOT_KEY_MAP['heading-two'], e => e.toggleBlock('heading-two')),
    Hotkey(HOT_KEY_MAP['heading-three'], e => e.toggleBlock('heading-three')),
    Hotkey(HOT_KEY_MAP['heading-four'], e => e.toggleBlock('heading-four')),
    Hotkey(HOT_KEY_MAP['heading-five'], e => e.toggleBlock('heading-five')),
    Hotkey(HOT_KEY_MAP['heading-six'], e => e.toggleBlock('heading-six')),
    Hotkey(HOT_KEY_MAP['link'], e =>
      e.toggleLink(() => window.prompt(t('editor.editorWidgets.markdown.linkPrompt'))),
    ),
    CommandsAndQueries({ defaultType }),
    QuoteBlock({ defaultType, type: 'quote' }),
    ListPlugin({
      defaultType,
      unorderedListType: 'bulleted-list',
      orderedListType: 'numbered-list',
    }),
    Link({ type: 'link' }),
    LineBreak(),
    BreakToDefaultBlock({ defaultType }),
    CloseBlock({ defaultType }),
    SelectAll(),
    ForceInsert({ defaultType }),
    CopyPasteVisual({ getAsset, resolveWidget, remarkPlugins }),
    Shortcode({ defaultType }),
  ];
}

export default plugins;
