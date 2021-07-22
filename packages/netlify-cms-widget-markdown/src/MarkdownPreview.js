import React from 'react';
import PropTypes from 'prop-types';
import { WidgetPreviewContainer } from 'netlify-cms-ui-default';
import DOMPurify from 'dompurify';

import { markdownToHtml } from './serializers';
class MarkdownPreview extends React.Component {
  static propTypes = {
    getAsset: PropTypes.func.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    value: PropTypes.string,
  };

  render() {
    const { value, getAsset, resolveWidget, field, getRemarkPlugins } = this.props;
    if (value === null) {
      return null;
    }

    const html = markdownToHtml(value, { getAsset, resolveWidget }, getRemarkPlugins?.());
    const toRender = field?.get('sanitize_preview', false) ? DOMPurify.sanitize(html) : html;

    return <WidgetPreviewContainer dangerouslySetInnerHTML={{ __html: toRender }} />;
  }
}

export default MarkdownPreview;
