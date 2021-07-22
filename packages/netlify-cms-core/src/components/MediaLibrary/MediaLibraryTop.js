import React from 'react';
import PropTypes from 'prop-types';
import styled from '@emotion/styled';

import MediaLibrarySearch from './MediaLibrarySearch';
import MediaLibraryHeader from './MediaLibraryHeader';
import {
  UploadButton,
  DeleteButton,
  DownloadButton,
  CopyToClipBoardButton,
  InsertButton,
} from './MediaLibraryButtons';

const LibraryTop = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
`;

const RowContainer = styled.div`
  display: flex;
  justify-content: space-between;
`;

const ButtonsContainer = styled.div`
  flex-shrink: 0;
`;

function MediaLibraryTop({
  t,
  onClose,
  privateUpload,
  forImage,
  onDownload,
  onUpload,
  query,
  onSearchChange,
  onSearchKeyDown,
  searchDisabled,
  onDelete,
  canInsert,
  onInsert,
  hasSelection,
  isPersisting,
  isDeleting,
  selectedFile,
  mediaFolder,
}) {
  const shouldShowButtonLoader = isPersisting || isDeleting;
  const uploadEnabled = !shouldShowButtonLoader;
  const deleteEnabled = !shouldShowButtonLoader && hasSelection;

  const uploadButtonLabel = isPersisting
    ? t('mediaLibrary.mediaLibraryModal.uploading')
    : t('mediaLibrary.mediaLibraryModal.upload');
  const deleteButtonLabel = isDeleting
    ? t('mediaLibrary.mediaLibraryModal.deleting')
    : t('mediaLibrary.mediaLibraryModal.deleteSelected');
  const downloadButtonLabel = t('mediaLibrary.mediaLibraryModal.download');
  const insertButtonLabel = t('mediaLibrary.mediaLibraryModal.chooseSelected');

  return (
    <LibraryTop>
      <RowContainer>
        <MediaLibraryHeader
          onClose={onClose}
          title={`${privateUpload ? t('mediaLibrary.mediaLibraryModal.private') : ''}${
            forImage
              ? t('mediaLibrary.mediaLibraryModal.images')
              : t('mediaLibrary.mediaLibraryModal.mediaAssets')
          }`}
          isPrivate={privateUpload}
        />
        <ButtonsContainer>
          <CopyToClipBoardButton
            disabled={!hasSelection}
            path={selectedFile.path}
            name={selectedFile.name}
            draft={selectedFile.draft}
            t={t}
            mediaFolder={mediaFolder}
          />
          <DownloadButton onClick={onDownload} disabled={!hasSelection}>
            {downloadButtonLabel}
          </DownloadButton>
          <UploadButton
            label={uploadButtonLabel}
            imagesOnly={forImage}
            onChange={onUpload}
            disabled={!uploadEnabled}
          />
        </ButtonsContainer>
      </RowContainer>
      <RowContainer>
        <MediaLibrarySearch
          value={query}
          onChange={onSearchChange}
          onKeyDown={onSearchKeyDown}
          placeholder={t('mediaLibrary.mediaLibraryModal.search')}
          disabled={searchDisabled}
        />
        <ButtonsContainer>
          <DeleteButton onClick={onDelete} disabled={!deleteEnabled}>
            {deleteButtonLabel}
          </DeleteButton>
          {!canInsert ? null : (
            <InsertButton onClick={onInsert} disabled={!hasSelection}>
              {insertButtonLabel}
            </InsertButton>
          )}
        </ButtonsContainer>
      </RowContainer>
    </LibraryTop>
  );
}

MediaLibraryTop.propTypes = {
  t: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  privateUpload: PropTypes.bool,
  forImage: PropTypes.bool,
  onDownload: PropTypes.func.isRequired,
  onUpload: PropTypes.func.isRequired,
  query: PropTypes.string,
  onSearchChange: PropTypes.func.isRequired,
  onSearchKeyDown: PropTypes.func.isRequired,
  searchDisabled: PropTypes.bool.isRequired,
  onDelete: PropTypes.func.isRequired,
  canInsert: PropTypes.bool,
  onInsert: PropTypes.func.isRequired,
  hasSelection: PropTypes.bool.isRequired,
  isPersisting: PropTypes.bool,
  isDeleting: PropTypes.bool,
  selectedFile: PropTypes.oneOfType([
    PropTypes.shape({
      path: PropTypes.string.isRequired,
      draft: PropTypes.bool.isRequired,
      name: PropTypes.string.isRequired,
    }),
    PropTypes.shape({}),
  ]),
  mediaFolder: PropTypes.string,
};

export default MediaLibraryTop;
