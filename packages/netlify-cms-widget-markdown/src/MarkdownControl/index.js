import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { List } from 'immutable';

import RawEditor from './RawEditor';
import VisualEditor from './VisualEditor';

const MODE_STORAGE_KEY = 'cms.md-mode';

// TODO: passing the editorControl and components like this is horrible, should
// be handled through Redux and a separate registry store for instances
let editorControl;
// eslint-disable-next-line func-style
let _getEditorComponents = () => [];

export function getEditorControl() {
  return editorControl;
}

export function getEditorComponents() {
  return _getEditorComponents();
}

export default class MarkdownControl extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    editorControl: PropTypes.elementType.isRequired,
    value: PropTypes.string,
    field: ImmutablePropTypes.map.isRequired,
    getEditorComponents: PropTypes.func,
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    value: '',
  };

  constructor(props) {
    super(props);
    editorControl = props.editorControl;
    const preferredMode = localStorage.getItem(MODE_STORAGE_KEY) ?? 'rich_text';

    _getEditorComponents = props.getEditorComponents;
    this.state = {
      mode:
        this.getAllowedModes().indexOf(preferredMode) !== -1
          ? preferredMode
          : this.getAllowedModes()[0],
      pendingFocus: false,
    };
  }

  handleMode = mode => {
    this.setState({ mode, pendingFocus: true });
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  };

  processRef = ref => (this.ref = ref);

  setFocusReceived = () => {
    this.setState({ pendingFocus: false });
  };

  getAllowedModes = () => this.props.field.get('modes', List(['rich_text', 'raw'])).toArray();

  render() {
    const {
      onChange,
      onAddAsset,
      getAsset,
      value,
      classNameWrapper,
      field,
      getEditorComponents,
      getRemarkPlugins,
      resolveWidget,
      t,
      isDisabled,
    } = this.props;

    const { mode, pendingFocus } = this.state;
    const isShowModeToggle = this.getAllowedModes().length > 1;
    const visualEditor = (
      <div className="cms-editor-visual" ref={this.processRef}>
        <VisualEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          isShowModeToggle={isShowModeToggle}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={classNameWrapper}
          value={value}
          field={field}
          getEditorComponents={getEditorComponents}
          getRemarkPlugins={getRemarkPlugins}
          resolveWidget={resolveWidget}
          pendingFocus={pendingFocus && this.setFocusReceived}
          t={t}
          isDisabled={isDisabled}
        />
      </div>
    );
    const rawEditor = (
      <div className="cms-editor-raw" ref={this.processRef}>
        <RawEditor
          onChange={onChange}
          onAddAsset={onAddAsset}
          isShowModeToggle={isShowModeToggle}
          onMode={this.handleMode}
          getAsset={getAsset}
          className={classNameWrapper}
          value={value}
          field={field}
          pendingFocus={pendingFocus && this.setFocusReceived}
          t={t}
        />
      </div>
    );
    return mode === 'rich_text' ? visualEditor : rawEditor;
  }
}
