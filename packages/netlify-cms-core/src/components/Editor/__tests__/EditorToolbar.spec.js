import React from 'react';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

import { EditorToolbar } from '../EditorToolbar';

jest.mock('../../UI', () => ({
  // eslint-disable-next-line react/display-name
  SettingsDropdown: props => <mock-settings-dropdown {...props} />,
}));
jest.mock('react-router-dom', () => {
  return {
    // eslint-disable-next-line react/display-name
    Link: props => <mock-link {...props} />,
  };
});

describe('EditorToolbar', () => {
  const props = {
    isPersisting: false,
    isPublishing: false,
    isUpdatingStatus: false,
    isDeleting: false,
    onPersist: jest.fn(),
    onPersistAndNew: jest.fn(),
    onPersistAndDuplicate: jest.fn(),
    showDelete: true,
    onDelete: jest.fn(),
    onDeleteUnpublishedChanges: jest.fn(),
    onChangeStatus: jest.fn(),
    onPublish: jest.fn(),
    unPublish: jest.fn(),
    onDuplicate: jest.fn(),
    onPublishAndNew: jest.fn(),
    onPublishAndDuplicate: jest.fn(),
    hasChanged: false,
    collection: fromJS({ name: 'posts' }),
    hasWorkflow: false,
    useOpenAuthoring: false,
    hasUnpublishedChanges: false,
    isNewEntry: false,
    isModification: false,
    onLogoutClick: jest.fn(),
    loadDeployPreview: jest.fn(),
    t: jest.fn(key => key),
    editorBackLink: '',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default props', () => {
    const { asFragment } = render(<EditorToolbar {...props} />);
    expect(asFragment()).toMatchSnapshot();
  });

  [false, true].forEach(useOpenAuthoring => {
    it(`should render with workflow controls hasUnpublishedChanges=true,isNewEntry=false,isModification=true,useOpenAuthoring=${useOpenAuthoring}`, () => {
      const { asFragment } = render(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          hasUnpublishedChanges={true}
          isNewEntry={false}
          isModification={true}
          useOpenAuthoring={useOpenAuthoring}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it(`should render with workflow controls hasUnpublishedChanges=true,isNewEntry=false,isModification=false,useOpenAuthoring=${useOpenAuthoring}`, () => {
      const { asFragment } = render(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          hasUnpublishedChanges={true}
          isNewEntry={false}
          isModification={false}
          useOpenAuthoring={useOpenAuthoring}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it(`should render with workflow controls hasUnpublishedChanges=false,isNewEntry=false,isModification=false,useOpenAuthoring=${useOpenAuthoring}`, () => {
      const { asFragment } = render(
        <EditorToolbar
          {...props}
          hasWorkflow={true}
          hasUnpublishedChanges={false}
          isNewEntry={false}
          isModification={false}
          useOpenAuthoring={useOpenAuthoring}
        />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    ['draft', 'pending_review', 'pending_publish'].forEach(status => {
      it(`should render with status=${status},useOpenAuthoring=${useOpenAuthoring}`, () => {
        const { asFragment } = render(
          <EditorToolbar
            {...props}
            hasWorkflow={true}
            currentStatus={status}
            useOpenAuthoring={useOpenAuthoring}
          />,
        );
        expect(asFragment()).toMatchSnapshot();
      });
    });

    it(`should not render changes saved message`, () => {
      const { asFragment } = render(
        <EditorToolbar {...props} hasUnpublishedChanges={false} hasChanged={false} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });

    it(`should render normal save button`, () => {
      const { asFragment } = render(<EditorToolbar {...props} hasChanged={true} />);
      expect(asFragment()).toMatchSnapshot();
    });

    it(`should render changes saved message`, () => {
      const { asFragment } = render(
        <EditorToolbar {...props} hasUnpublishedChanges={true} hasChanged={false} />,
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });
});
