import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { fromJS } from 'immutable';

import ListControl from '../ListControl';

jest.mock('netlify-cms-widget-object', () => {
  const React = require('react');

  class MockObjectControl extends React.Component {
    render() {
      return <mock-object-control {...this.props}>{this.props.children}</mock-object-control>;
    }
  }

  return {
    controlComponent: MockObjectControl,
  };
});
jest.mock('netlify-cms-ui-default', () => {
  const actual = jest.requireActual('netlify-cms-ui-default');

  function ListItemTopBar(props) {
    return (
      <mock-list-item-top-bar {...props} onClick={props.onCollapseToggle}>
        <button onClick={props.onRemove}>Remove</button>
        {props.children}
      </mock-list-item-top-bar>
    );
  }

  return {
    ...actual,
    ListItemTopBar,
  };
});
jest.mock('uuid/v4');

describe('ListControl', () => {
  const props = {
    onChange: jest.fn(),
    onChangeObject: jest.fn(),
    onValidateObject: jest.fn(),
    validate: jest.fn(),
    mediaPaths: fromJS({}),
    getAsset: jest.fn(),
    onOpenMediaLibrary: jest.fn(),
    onAddAsset: jest.fn(),
    onRemoveInsertedMedia: jest.fn(),
    classNameWrapper: 'classNameWrapper',
    setActiveStyle: jest.fn(),
    setInactiveStyle: jest.fn(),
    editorControl: jest.fn(),
    resolveWidget: jest.fn(),
    clearFieldErrors: jest.fn(),
    fieldsErrors: fromJS({}),
    entry: fromJS({
      path: 'posts/index.md',
    }),
    forID: 'forID',
    t: key => key,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    const uuid = require('uuid/v4');
    let id = 0;
    uuid.mockImplementation(() => {
      return id++;
    });
  });
  it('should render empty list', () => {
    const field = fromJS({ name: 'list', label: 'List' });
    const { asFragment } = render(<ListControl {...props} field={field} />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with string array', () => {
    const field = fromJS({ name: 'list', label: 'List' });
    const { asFragment } = render(
      <ListControl {...props} field={field} value={fromJS(['item 1', 'item 2'])} />,
    );

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with nested object', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { asFragment, getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with nested object with collapse = false', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { asFragment, getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should collapse all items on top bar collapse click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');
  });

  it('should collapse a single item on collapse item click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    fireEvent.click(getByTestId('styled-list-item-top-bar-0'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');
  });

  it('should expand all items on top bar expand click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');
  });

  it('should expand a single item on expand item click', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      field: {
        name: 'object',
        widget: 'object',
        label: 'Object',
        fields: [{ name: 'title', widget: 'string', label: 'Title' }],
      },
    });
    const { getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ object: { title: 'item 1' } }, { object: { title: 'item 2' } }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');

    fireEvent.click(getByTestId('styled-list-item-top-bar-0'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');
  });

  it('should use widget name when no summary or label are configured for mixed types', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      types: [
        {
          name: 'type_1_object',
          widget: 'object',
          fields: [
            { label: 'First Name', name: 'first_name', widget: 'string' },
            { label: 'Last Name', name: 'last_name', widget: 'string' },
          ],
        },
      ],
    });

    const { getAllByText } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ first_name: 'hello', last_name: 'world', type: 'type_1_object' }])}
      />,
    );
    expect(getAllByText('type_1_object')[1]).toBeInTheDocument();
  });

  it('should use label when no summary is configured for mixed types', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      types: [
        {
          label: 'Type 1 Object',
          name: 'type_1_object',
          widget: 'object',
          fields: [
            { label: 'First Name', name: 'first_name', widget: 'string' },
            { label: 'Last Name', name: 'last_name', widget: 'string' },
          ],
        },
      ],
    });

    const { getAllByText } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ first_name: 'hello', last_name: 'world', type: 'type_1_object' }])}
      />,
    );
    expect(getAllByText('Type 1 Object')[1]).toBeInTheDocument();
  });

  it('should use summary when configured for mixed types', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      types: [
        {
          label: 'Type 1 Object',
          name: 'type_1_object',
          summary: '{{first_name}} - {{last_name}} - {{filename}}.{{extension}}',
          widget: 'object',
          fields: [
            { label: 'First Name', name: 'first_name', widget: 'string' },
            { label: 'Last Name', name: 'last_name', widget: 'string' },
          ],
        },
      ],
    });

    const { getByText } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ first_name: 'hello', last_name: 'world', type: 'type_1_object' }])}
      />,
    );
    expect(getByText('hello - world - index.md')).toBeInTheDocument();
  });

  it('should use widget name when no summary or label are configured for a single field', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      field: { name: 'name', widget: 'string' },
    });

    const { getByText } = render(<ListControl {...props} field={field} value={fromJS(['Name'])} />);
    expect(getByText('name')).toBeInTheDocument();
  });

  it('should use label when no summary is configured for a single field', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      field: { name: 'name', widget: 'string', label: 'Name' },
    });

    const { getByText } = render(<ListControl {...props} field={field} value={fromJS(['Name'])} />);
    expect(getByText('Name')).toBeInTheDocument();
  });

  it('should use summary when configured for a single field', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      summary: 'Name - {{fields.name}}',
      field: { name: 'name', widget: 'string', label: 'Name' },
    });

    const { getByText } = render(<ListControl {...props} field={field} value={fromJS(['Name'])} />);
    expect(getByText('Name - Name')).toBeInTheDocument();
  });

  it('should use first field value when no summary or label are configured for multiple fields', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      fields: [
        { name: 'first_name', widget: 'string', label: 'First Name' },
        { name: 'last_name', widget: 'string', label: 'Last Name' },
      ],
    });

    const { getByText } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ first_name: 'hello', last_name: 'world' }])}
      />,
    );
    expect(getByText('hello')).toBeInTheDocument();
  });

  it('should show `No <field>` when value is missing from first field for multiple fields', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      fields: [
        { name: 'first_name', widget: 'string', label: 'First Name' },
        { name: 'last_name', widget: 'string', label: 'Last Name' },
      ],
    });

    const { getByText } = render(
      <ListControl {...props} field={field} value={fromJS([{ last_name: 'world' }])} />,
    );
    expect(getByText('No first_name')).toBeInTheDocument();
  });

  it('should use summary when configured for multiple fields', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: true,
      summary: '{{first_name}} - {{last_name}} - {{filename}}.{{extension}}',
      fields: [
        { name: 'first_name', widget: 'string', label: 'First Name' },
        { name: 'last_name', widget: 'string', label: 'Last Name' },
      ],
    });

    const { getByText } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ first_name: 'hello', last_name: 'world' }])}
      />,
    );
    expect(getByText('hello - world - index.md')).toBeInTheDocument();
  });

  it('should render list with fields with default collapse ("true") and minimize_collapsed ("false")', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const { asFragment, getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ string: 'item 1' }, { string: 'item 2' }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with fields with collapse = "false" and default minimize_collapsed ("false")', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const { asFragment, getByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ string: 'item 1' }, { string: 'item 2' }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should render list with fields with default collapse ("true") and minimize_collapsed = "true"', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      minimize_collapsed: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const { asFragment, getByTestId, queryByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ string: 'item 1' }, { string: 'item 2' }])}
      />,
    );

    expect(queryByTestId('styled-list-item-top-bar-0')).toBeNull();
    expect(queryByTestId('styled-list-item-top-bar-1')).toBeNull();

    expect(queryByTestId('object-control-0')).toBeNull();
    expect(queryByTestId('object-control-1')).toBeNull();

    expect(asFragment()).toMatchSnapshot();

    fireEvent.click(getByTestId('expand-button'));

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'true');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'true');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'true');
  });

  it('should render list with fields with collapse = "false" and default minimize_collapsed = "true"', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const { asFragment, getByTestId, queryByTestId } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ string: 'item 1' }, { string: 'item 2' }])}
      />,
    );

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('styled-list-item-top-bar-1')).toHaveAttribute('collapsed', 'false');

    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-1')).toHaveAttribute('collapsed', 'false');

    expect(asFragment()).toMatchSnapshot();

    fireEvent.click(getByTestId('expand-button'));

    expect(queryByTestId('styled-list-item-top-bar-0')).toBeNull();
    expect(queryByTestId('styled-list-item-top-bar-1')).toBeNull();

    expect(queryByTestId('object-control-0')).toBeNull();
    expect(queryByTestId('object-control-1')).toBeNull();
  });

  it('should add to list when add button is clicked', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const { asFragment, getByText, queryByTestId, rerender, getByTestId } = render(
      <ListControl {...props} field={field} value={fromJS([])} />,
    );

    expect(queryByTestId('object-control-0')).toBeNull();

    fireEvent.click(getByText('Add list'));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith(fromJS([{}]));

    rerender(<ListControl {...props} field={field} value={fromJS([{}])} />);

    expect(getByTestId('styled-list-item-top-bar-0')).toHaveAttribute('collapsed', 'false');
    expect(getByTestId('object-control-0')).toHaveAttribute('collapsed', 'false');

    expect(asFragment()).toMatchSnapshot();
  });

  it('should remove from list when remove button is clicked', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const { asFragment, getAllByText, rerender } = render(
      <ListControl
        {...props}
        field={field}
        value={fromJS([{ string: 'item 1' }, { string: 'item 2' }])}
      />,
    );

    expect(asFragment()).toMatchSnapshot();

    let mock;
    try {
      mock = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      const items = getAllByText('Remove');
      fireEvent.click(items[0]);

      expect(props.onChange).toHaveBeenCalledTimes(1);
      expect(props.onChange).toHaveBeenCalledWith(fromJS([{ string: 'item 2' }]), undefined);

      rerender(<ListControl {...props} field={field} value={fromJS([{ string: 'item 2' }])} />);

      expect(asFragment()).toMatchSnapshot();
    } finally {
      mock.mockRestore();
    }
  });

  it('should give validation error if below min elements', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const listControl = new ListControl({
      ...props,
      field,
      value: fromJS([{ string: 'item 1' }]),
    });

    listControl.validate();
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeCount',
        type: 'RANGE',
      },
    ]);
  });

  it('should give min validation error if below min elements', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const listControl = new ListControl({
      ...props,
      field,
      value: fromJS([{ string: 'item 1' }]),
    });

    listControl.validate();
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeMin',
        type: 'RANGE',
      },
    ]);
  });

  it('should give validation error if above max elements', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const listControl = new ListControl({
      ...props,
      field,
      value: fromJS([
        { string: 'item 1' },
        { string: 'item 2' },
        { string: 'item 3' },
        { string: 'item 4' },
      ]),
    });

    listControl.validate();
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeCount',
        type: 'RANGE',
      },
    ]);
  });

  it('should give max validation error if above max elements', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const listControl = new ListControl({
      ...props,
      field,
      value: fromJS([
        { string: 'item 1' },
        { string: 'item 2' },
        { string: 'item 3' },
        { string: 'item 4' },
      ]),
    });

    listControl.validate();
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', [
      {
        message: 'editor.editorControlPane.widget.rangeMax',
        type: 'RANGE',
      },
    ]);
  });

  it('should give no validation error if between min and max elements', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: true,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const listControl = new ListControl({
      ...props,
      field,
      value: fromJS([{ string: 'item 1' }, { string: 'item 2' }, { string: 'item 3' }]),
    });

    listControl.validate();
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', []);
  });

  it('should give no validation error if no elements and optional', () => {
    const field = fromJS({
      name: 'list',
      label: 'List',
      collapsed: false,
      minimize_collapsed: true,
      required: false,
      min: 2,
      max: 3,
      fields: [{ label: 'String', name: 'string', widget: 'string' }],
    });
    const listControl = new ListControl({
      ...props,
      field,
      value: fromJS([]),
    });

    listControl.validate();
    expect(props.onValidateObject).toHaveBeenCalledWith('forID', []);
  });
});
