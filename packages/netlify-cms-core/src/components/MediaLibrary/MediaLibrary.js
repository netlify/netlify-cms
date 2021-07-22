import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import { connect } from 'react-redux';
import { orderBy, map } from 'lodash';
import { translate } from 'react-polyglot';
import fuzzy from 'fuzzy';
import { fileExtension } from 'netlify-cms-lib-util';

import {
  loadMedia as loadMediaAction,
  persistMedia as persistMediaAction,
  deleteMedia as deleteMediaAction,
  insertMedia as insertMediaAction,
  loadMediaDisplayURL as loadMediaDisplayURLAction,
  closeMediaLibrary as closeMediaLibraryAction,
} from '../../actions/mediaLibrary';
import { selectMediaFiles } from '../../reducers/mediaLibrary';
import MediaLibraryModal, { fileShape } from './MediaLibraryModal';

/**
 * Extensions used to determine which files to show when the media library is
 * accessed from an image insertion field.
 */
const IMAGE_EXTENSIONS_VIEWABLE = [
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'png',
  'bmp',
  'tiff',
  'svg',
  'avif',
];
const IMAGE_EXTENSIONS = [...IMAGE_EXTENSIONS_VIEWABLE];

class MediaLibrary extends React.Component {
  static propTypes = {
    isVisible: PropTypes.bool,
    loadMediaDisplayURL: PropTypes.func,
    displayURLs: ImmutablePropTypes.map,
    canInsert: PropTypes.bool,
    files: PropTypes.arrayOf(PropTypes.shape(fileShape)).isRequired,
    dynamicSearch: PropTypes.bool,
    dynamicSearchActive: PropTypes.bool,
    forImage: PropTypes.bool,
    isLoading: PropTypes.bool,
    isPersisting: PropTypes.bool,
    isDeleting: PropTypes.bool,
    hasNextPage: PropTypes.bool,
    isPaginating: PropTypes.bool,
    privateUpload: PropTypes.bool,
    config: ImmutablePropTypes.map,
    loadMedia: PropTypes.func.isRequired,
    dynamicSearchQuery: PropTypes.string,
    page: PropTypes.number,
    persistMedia: PropTypes.func.isRequired,
    deleteMedia: PropTypes.func.isRequired,
    insertMedia: PropTypes.func.isRequired,
    closeMediaLibrary: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
  };

  static defaultProps = {
    files: [],
  };

  /**
   * The currently selected file and query are tracked in component state as
   * they do not impact the rest of the application.
   */
  state = {
    selectedFile: {},
    query: '',
  };

  componentDidMount() {
    this.props.loadMedia();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    /**
     * We clear old state from the media library when it's being re-opened
     * because, when doing so on close, the state is cleared while the media
     * library is still fading away.
     */
    const isOpening = !this.props.isVisible && nextProps.isVisible;
    if (isOpening) {
      this.setState({ selectedFile: {}, query: '' });
    }
  }

  componentDidUpdate(prevProps) {
    const isOpening = !prevProps.isVisible && this.props.isVisible;

    if (isOpening && prevProps.privateUpload !== this.props.privateUpload) {
      this.props.loadMedia({ privateUpload: this.props.privateUpload });
    }
  }

  loadDisplayURL = file => {
    const { loadMediaDisplayURL } = this.props;
    loadMediaDisplayURL(file);
  };

  /**
   * Filter an array of file data to include only images.
   */
  filterImages = files => {
    return files.filter(file => {
      const ext = fileExtension(file.name).toLowerCase();
      return IMAGE_EXTENSIONS.includes(ext);
    });
  };

  /**
   * Transform file data for table display.
   */
  toTableData = files => {
    const tableData =
      files &&
      files.map(({ key, name, id, size, path, queryOrder, displayURL, draft }) => {
        const ext = fileExtension(name).toLowerCase();
        return {
          key,
          id,
          name,
          path,
          type: ext.toUpperCase(),
          size,
          queryOrder,
          displayURL,
          draft,
          isImage: IMAGE_EXTENSIONS.includes(ext),
          isViewableImage: IMAGE_EXTENSIONS_VIEWABLE.includes(ext),
        };
      });

    /**
     * Get the sort order for use with `lodash.orderBy`, and always add the
     * `queryOrder` sort as the lowest priority sort order.
     */
    const { sortFields } = this.state;
    const fieldNames = map(sortFields, 'fieldName').concat('queryOrder');
    const directions = map(sortFields, 'direction').concat('asc');
    return orderBy(tableData, fieldNames, directions);
  };

  handleClose = () => {
    this.props.closeMediaLibrary();
  };

  /**
   * Toggle asset selection on click.
   */
  handleAssetClick = asset => {
    const selectedFile = this.state.selectedFile.key === asset.key ? {} : asset;
    this.setState({ selectedFile });
  };

  /**
   * Upload a file.
   */
  handlePersist = async event => {
    /**
     * Stop the browser from automatically handling the file input click, and
     * get the file for upload, and retain the synthetic event for access after
     * the asynchronous persist operation.
     */
    event.persist();
    event.stopPropagation();
    event.preventDefault();
    const { persistMedia, privateUpload, config, t, field } = this.props;
    const { files: fileList } = event.dataTransfer || event.target;
    const files = [...fileList];
    const file = files[0];
    const maxFileSize = config.get('max_file_size');

    if (maxFileSize && file.size > maxFileSize) {
      window.alert(
        t('mediaLibrary.mediaLibrary.fileTooLarge', {
          size: Math.floor(maxFileSize / 1000),
        }),
      );
    } else {
      await persistMedia(file, { privateUpload, field });

      this.setState({ selectedFile: this.props.files[0] });

      this.scrollToTop();
    }

    event.target.value = null;
  };

  /**
   * Stores the public path of the file in the application store, where the
   * editor field that launched the media library can retrieve it.
   */
  handleInsert = () => {
    const { selectedFile } = this.state;
    const { path } = selectedFile;
    const { insertMedia, field } = this.props;
    insertMedia(path, field);
    this.handleClose();
  };

  /**
   * Removes the selected file from the backend.
   */
  handleDelete = () => {
    const { selectedFile } = this.state;
    const { files, deleteMedia, privateUpload, t } = this.props;
    if (!window.confirm(t('mediaLibrary.mediaLibrary.onDelete'))) {
      return;
    }
    const file = files.find(file => selectedFile.key === file.key);
    deleteMedia(file, { privateUpload }).then(() => {
      this.setState({ selectedFile: {} });
    });
  };

  /**
   * Downloads the selected file.
   */
  handleDownload = () => {
    const { selectedFile } = this.state;
    const { displayURLs } = this.props;
    const url = displayURLs.getIn([selectedFile.id, 'url']) || selectedFile.url;
    if (!url) {
      return;
    }

    const filename = selectedFile.name;

    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
    this.setState({ selectedFile: {} });
  };

  /**
   *
   */

  handleLoadMore = () => {
    const { loadMedia, dynamicSearchQuery, page, privateUpload } = this.props;
    loadMedia({ query: dynamicSearchQuery, page: page + 1, privateUpload });
  };

  /**
   * Executes media library search for implementations that support dynamic
   * search via request. For these implementations, the Enter key must be
   * pressed to execute search. If assets are being stored directly through
   * the GitHub backend, search is in-memory and occurs as the query is typed,
   * so this handler has no impact.
   */
  handleSearchKeyDown = async event => {
    const { dynamicSearch, loadMedia, privateUpload } = this.props;
    if (event.key === 'Enter' && dynamicSearch) {
      await loadMedia({ query: this.state.query, privateUpload });
      this.scrollToTop();
    }
  };

  scrollToTop = () => {
    this.scrollContainerRef.scrollTop = 0;
  };

  /**
   * Updates query state as the user types in the search field.
   */
  handleSearchChange = event => {
    this.setState({ query: event.target.value });
  };

  /**
   * Filters files that do not match the query. Not used for dynamic search.
   */
  queryFilter = (query, files) => {
    /**
     * Because file names don't have spaces, typing a space eliminates all
     * potential matches, so we strip them all out internally before running the
     * query.
     */
    const strippedQuery = query.replace(/ /g, '');
    const matches = fuzzy.filter(strippedQuery, files, { extract: file => file.name });
    const matchFiles = matches.map((match, queryIndex) => {
      const file = files[match.index];
      return { ...file, queryIndex };
    });
    return matchFiles;
  };

  render() {
    const {
      isVisible,
      canInsert,
      files,
      dynamicSearch,
      dynamicSearchActive,
      forImage,
      isLoading,
      isPersisting,
      isDeleting,
      hasNextPage,
      isPaginating,
      privateUpload,
      displayURLs,
      t,
      mediaFolder,
    } = this.props;

    return (
      <MediaLibraryModal
        isVisible={isVisible}
        canInsert={canInsert}
        files={files}
        dynamicSearch={dynamicSearch}
        dynamicSearchActive={dynamicSearchActive}
        forImage={forImage}
        isLoading={isLoading}
        isPersisting={isPersisting}
        isDeleting={isDeleting}
        hasNextPage={hasNextPage}
        isPaginating={isPaginating}
        privateUpload={privateUpload}
        query={this.state.query}
        selectedFile={this.state.selectedFile}
        handleFilter={this.filterImages}
        handleQuery={this.queryFilter}
        toTableData={this.toTableData}
        handleClose={this.handleClose}
        handleSearchChange={this.handleSearchChange}
        handleSearchKeyDown={this.handleSearchKeyDown}
        handlePersist={this.handlePersist}
        handleDelete={this.handleDelete}
        handleInsert={this.handleInsert}
        handleDownload={this.handleDownload}
        setScrollContainerRef={ref => (this.scrollContainerRef = ref)}
        handleAssetClick={this.handleAssetClick}
        handleLoadMore={this.handleLoadMore}
        displayURLs={displayURLs}
        loadDisplayURL={this.loadDisplayURL}
        t={t}
        mediaFolder={mediaFolder}
      />
    );
  }
}

function mapStateToProps(state) {
  const { mediaLibrary } = state;
  const mediaFolder = state.config.media_folder;
  const field = mediaLibrary.get('field');
  const mediaLibraryProps = {
    isVisible: mediaLibrary.get('isVisible'),
    canInsert: mediaLibrary.get('canInsert'),
    files: selectMediaFiles(state, field),
    displayURLs: mediaLibrary.get('displayURLs'),
    dynamicSearch: mediaLibrary.get('dynamicSearch'),
    dynamicSearchActive: mediaLibrary.get('dynamicSearchActive'),
    dynamicSearchQuery: mediaLibrary.get('dynamicSearchQuery'),
    forImage: mediaLibrary.get('forImage'),
    isLoading: mediaLibrary.get('isLoading'),
    isPersisting: mediaLibrary.get('isPersisting'),
    isDeleting: mediaLibrary.get('isDeleting'),
    privateUpload: mediaLibrary.get('privateUpload'),
    config: mediaLibrary.get('config'),
    page: mediaLibrary.get('page'),
    hasNextPage: mediaLibrary.get('hasNextPage'),
    isPaginating: mediaLibrary.get('isPaginating'),
    field,
    mediaFolder,
  };
  return { ...mediaLibraryProps };
}

const mapDispatchToProps = {
  loadMedia: loadMediaAction,
  persistMedia: persistMediaAction,
  deleteMedia: deleteMediaAction,
  insertMedia: insertMediaAction,
  loadMediaDisplayURL: loadMediaDisplayURLAction,
  closeMediaLibrary: closeMediaLibraryAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(translate()(MediaLibrary));
