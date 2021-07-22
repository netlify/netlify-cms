import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { fromJS } from 'immutable';
import styled from '@emotion/styled';
import { css as coreCss, ClassNames } from '@emotion/core';
import { get, isEmpty, debounce } from 'lodash';
import { Value, Document, Block, Text } from 'slate';
import { Editor as Slate } from 'slate-react';
import { lengths, fonts, zIndex } from 'netlify-cms-ui-default';

import { editorStyleVars, EditorControlBar } from '../styles';
import { slateToMarkdown, markdownToSlate } from '../serializers';
import Toolbar from '../MarkdownControl/Toolbar';
import { renderBlock, renderInline, renderMark } from './renderers';
import plugins from './plugins/visual';
import schema from './schema';

function visualEditorStyles({ minimal }) {
  return `
  position: relative;
  overflow: hidden;
  overflow-x: auto;
  font-family: ${fonts.primary};
  min-height: ${minimal ? 'auto' : lengths.richTextEditorMinHeight};
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  border-top: 0;
  margin-top: -${editorStyleVars.stickyDistanceBottom};
  padding: 0;
  display: flex;
  flex-direction: column;
  z-index: ${zIndex.zIndex100};
`;
}

const InsertionPoint = styled.div`
  flex: 1 1 auto;
  cursor: text;
`;

function createEmptyRawDoc() {
  const emptyText = Text.create('');
  const emptyBlock = Block.create({ object: 'block', type: 'paragraph', nodes: [emptyText] });
  return { nodes: [emptyBlock] };
}

function createSlateValue(rawValue, { voidCodeBlock }, remarkPlugins) {
  const rawDoc = rawValue && markdownToSlate(rawValue, { voidCodeBlock }, remarkPlugins);
  const rawDocHasNodes = !isEmpty(get(rawDoc, 'nodes'));
  const document = Document.fromJSON(rawDocHasNodes ? rawDoc : createEmptyRawDoc());
  return Value.create({ document });
}

export function mergeMediaConfig(editorComponents, field) {
  // merge editor media library config to image components
  if (editorComponents.has('image')) {
    const imageComponent = editorComponents.get('image');
    const fields = imageComponent?.fields;

    if (fields) {
      imageComponent.fields = fields.update(
        fields.findIndex(f => f.get('widget') === 'image'),
        f => {
          // merge `media_library` config
          if (field.has('media_library')) {
            f = f.set(
              'media_library',
              field.get('media_library').mergeDeep(f.get('media_library')),
            );
          }
          // merge 'media_folder'
          if (field.has('media_folder') && !f.has('media_folder')) {
            f = f.set('media_folder', field.get('media_folder'));
          }
          // merge 'public_folder'
          if (field.has('public_folder') && !f.has('public_folder')) {
            f = f.set('public_folder', field.get('public_folder'));
          }
          return f;
        },
      );
    }
  }
}

export default class Editor extends React.Component {
  constructor(props) {
    super(props);
    const editorComponents = props.getEditorComponents();
    this.shortcodeComponents = editorComponents.filter(({ type }) => type === 'shortcode');
    this.codeBlockComponent = fromJS(editorComponents.find(({ type }) => type === 'code-block'));
    this.editorComponents =
      this.codeBlockComponent || editorComponents.has('code-block')
        ? editorComponents
        : editorComponents.set('code-block', { label: 'Code Block', type: 'code-block' });

    this.remarkPlugins = props.getRemarkPlugins();

    mergeMediaConfig(this.editorComponents, this.props.field);
    this.renderBlock = renderBlock({
      classNameWrapper: props.className,
      resolveWidget: props.resolveWidget,
      codeBlockComponent: this.codeBlockComponent,
    });
    this.renderInline = renderInline();
    this.renderMark = renderMark();
    this.schema = schema({ voidCodeBlock: !!this.codeBlockComponent });
    this.plugins = plugins({
      getAsset: props.getAsset,
      resolveWidget: props.resolveWidget,
      t: props.t,
    });
    this.state = {
      value: createSlateValue(
        this.props.value,
        { voidCodeBlock: !!this.codeBlockComponent },
        this.remarkPlugins,
      ),
    };
  }

  static propTypes = {
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onMode: PropTypes.func.isRequired,
    className: PropTypes.string.isRequired,
    value: PropTypes.string,
    field: ImmutablePropTypes.map.isRequired,
    getEditorComponents: PropTypes.func.isRequired,
    getRemarkPlugins: PropTypes.func.isRequired,
    isShowModeToggle: PropTypes.bool.isRequired,
    t: PropTypes.func.isRequired,
  };

  shouldComponentUpdate(nextProps, nextState) {
    if (!this.state.value.equals(nextState.value)) return true;

    const raw = nextState.value.document.toJS();
    const markdown = slateToMarkdown(
      raw,
      { voidCodeBlock: this.codeBlockComponent },
      this.remarkPlugins,
    );
    return nextProps.value !== markdown;
  }

  componentDidMount() {
    if (this.props.pendingFocus) {
      this.editor.focus();
      this.props.pendingFocus();
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.value !== this.props.value) {
      this.setState({
        value: createSlateValue(
          this.props.value,
          { voidCodeBlock: !!this.codeBlockComponent },
          this.remarkPlugins,
        ),
      });
    }
  }

  handleMarkClick = type => {
    this.editor.toggleMark(type).focus();
  };

  handleBlockClick = type => {
    this.editor.toggleBlock(type).focus();
  };

  handleLinkClick = () => {
    this.editor.toggleLink(oldUrl =>
      window.prompt(this.props.t('editor.editorWidgets.markdown.linkPrompt'), oldUrl),
    );
  };

  hasMark = type => this.editor && this.editor.hasMark(type);
  hasInline = type => this.editor && this.editor.hasInline(type);
  hasBlock = type => this.editor && this.editor.hasBlock(type);
  hasQuote = type => this.editor && this.editor.hasQuote(type);
  hasListItems = type => this.editor && this.editor.hasListItems(type);

  handleToggleMode = () => {
    this.props.onMode('raw');
  };

  handleInsertShortcode = pluginConfig => {
    this.editor.insertShortcode(pluginConfig);
  };

  handleClickBelowDocument = () => {
    this.editor.moveToEndOfDocument();
  };

  handleDocumentChange = debounce(editor => {
    const { onChange } = this.props;
    const raw = editor.value.document.toJS();
    const markdown = slateToMarkdown(
      raw,
      { voidCodeBlock: this.codeBlockComponent },
      this.remarkPlugins,
    );
    onChange(markdown);
  }, 150);

  handleChange = editor => {
    if (!this.state.value.document.equals(editor.value.document)) {
      this.handleDocumentChange(editor);
    }
    this.setState({ value: editor.value });
  };

  processRef = ref => {
    this.editor = ref;
  };

  render() {
    const { onAddAsset, getAsset, className, field, isShowModeToggle, t, isDisabled } = this.props;
    return (
      <div
        css={coreCss`
          position: relative;
        `}
      >
        <EditorControlBar>
          <Toolbar
            onMarkClick={this.handleMarkClick}
            onBlockClick={this.handleBlockClick}
            onLinkClick={this.handleLinkClick}
            onToggleMode={this.handleToggleMode}
            plugins={this.editorComponents}
            onSubmit={this.handleInsertShortcode}
            onAddAsset={onAddAsset}
            getAsset={getAsset}
            buttons={field.get('buttons')}
            editorComponents={field.get('editor_components')}
            hasMark={this.hasMark}
            hasInline={this.hasInline}
            hasBlock={this.hasBlock}
            hasQuote={this.hasQuote}
            hasListItems={this.hasListItems}
            isShowModeToggle={isShowModeToggle}
            t={t}
            disabled={isDisabled}
          />
        </EditorControlBar>
        <ClassNames>
          {({ css, cx }) => (
            <div
              className={cx(
                className,
                css`
                  ${visualEditorStyles({ minimal: field.get('minimal') })}
                `,
              )}
            >
              <Slate
                className={css`
                  padding: 16px 20px 0;
                `}
                value={this.state.value}
                renderBlock={this.renderBlock}
                renderInline={this.renderInline}
                renderMark={this.renderMark}
                schema={this.schema}
                plugins={this.plugins}
                onChange={this.handleChange}
                ref={this.processRef}
                spellCheck
              />
              <InsertionPoint onClick={this.handleClickBelowDocument} />
            </div>
          )}
        </ClassNames>
      </div>
    );
  }
}
