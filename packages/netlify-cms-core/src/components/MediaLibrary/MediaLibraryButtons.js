import React from 'react';
import PropTypes from 'prop-types';
import { css } from '@emotion/core';
import styled from '@emotion/styled';
import copyToClipboard from 'copy-text-to-clipboard';
import { isAbsolutePath } from 'netlify-cms-lib-util';
import { buttons, shadows, zIndex } from 'netlify-cms-ui-default';

import { FileUploadButton } from '../UI';

const styles = {
  button: css`
    ${buttons.button};
    ${buttons.default};
    display: inline-block;
    margin-left: 15px;
    margin-right: 2px;

    &[disabled] {
      ${buttons.disabled};
      cursor: default;
    }
  `,
};

export const UploadButton = styled(FileUploadButton)`
  ${styles.button};
  ${buttons.gray};
  ${shadows.dropMain};
  margin-bottom: 0;

  span {
    font-size: 14px;
    font-weight: 500;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  input {
    height: 0.1px;
    width: 0.1px;
    margin: 0;
    padding: 0;
    opacity: 0;
    overflow: hidden;
    position: absolute;
    z-index: ${zIndex.zIndex0};
    outline: none;
  }
`;

export const DeleteButton = styled.button`
  ${styles.button};
  ${buttons.lightRed};
`;

export const InsertButton = styled.button`
  ${styles.button};
  ${buttons.green};
`;

const ActionButton = styled.button`
  ${styles.button};
  ${props =>
    !props.disabled &&
    css`
      ${buttons.gray}
    `}
`;

export const DownloadButton = ActionButton;

export class CopyToClipBoardButton extends React.Component {
  mounted = false;
  timeout;

  state = {
    copied: false,
  };

  componentDidMount() {
    this.mounted = true;
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  handleCopy = () => {
    clearTimeout(this.timeout);
    const { draft, name, mediaFolder } = this.props;
    let path = this.props.path;
    if (isAbsolutePath(path)) {
      copyToClipboard(path);
    } else {
      path = mediaFolder.charAt(0) === '/' && path.charAt(0) !== '/' ? `/${path}` : path;
      copyToClipboard(!draft ? path : name);
    }
    this.setState({ copied: true });
    this.timeout = setTimeout(() => this.mounted && this.setState({ copied: false }), 1500);
  };

  getTitle = () => {
    const { t, path, draft } = this.props;
    if (this.state.copied) {
      return t('mediaLibrary.mediaLibraryCard.copied');
    }

    if (!path) {
      return t('mediaLibrary.mediaLibraryCard.copy');
    }

    if (isAbsolutePath(path)) {
      return t('mediaLibrary.mediaLibraryCard.copyUrl');
    }

    if (draft) {
      return t('mediaLibrary.mediaLibraryCard.copyName');
    }

    return t('mediaLibrary.mediaLibraryCard.copyPath');
  };

  render() {
    const { disabled } = this.props;

    return (
      <ActionButton disabled={disabled} onClick={this.handleCopy}>
        {this.getTitle()}
      </ActionButton>
    );
  }
}

CopyToClipBoardButton.propTypes = {
  disabled: PropTypes.bool.isRequired,
  draft: PropTypes.bool,
  path: PropTypes.string,
  name: PropTypes.string,
  t: PropTypes.func.isRequired,
};
