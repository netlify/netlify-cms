import React from 'react';
import PropTypes from 'prop-types';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { css, ClassNames } from '@emotion/core';
import { List, Map, fromJS } from 'immutable';
import { partial, isEmpty, uniqueId } from 'lodash';
import uuid from 'uuid/v4';
import { SortableContainer, SortableElement, SortableHandle } from 'react-sortable-hoc';
import NetlifyCmsWidgetObject from 'netlify-cms-widget-object';
import {
  ListItemTopBar,
  ObjectWidgetTopBar,
  colors,
  lengths,
  FieldLabel,
} from 'netlify-cms-ui-default';
import { stringTemplate, validations } from 'netlify-cms-lib-widgets';

import {
  TYPES_KEY,
  getTypedFieldForValue,
  resolveFieldKeyType,
  getErrorMessageForTypedFieldAndValue,
} from './typedListHelpers';

const ObjectControl = NetlifyCmsWidgetObject.controlComponent;

const ListItem = styled.div();

const SortableListItem = SortableElement(ListItem);

const StyledListItemTopBar = styled(ListItemTopBar)`
  background-color: ${colors.textFieldBorder};
`;

const NestedObjectLabel = styled.div`
  display: ${props => (props.collapsed ? 'block' : 'none')};
  border-top: 0;
  color: ${props => (props.error ? colors.errorText : 'inherit')};
  background-color: ${colors.textFieldBorder};
  padding: 13px;
  border-radius: 0 0 ${lengths.borderRadius} ${lengths.borderRadius};
`;

const styleStrings = {
  collapsedObjectControl: `
    display: none;
  `,
  objectWidgetTopBarContainer: `
    padding: ${lengths.objectWidgetTopBarContainerPadding};
  `,
};

const styles = {
  listControlItem: css`
    margin-top: 18px;

    &:first-of-type {
      margin-top: 26px;
    }
  `,
  listControlItemCollapsed: css`
    padding-bottom: 0;
  `,
};

const SortableList = SortableContainer(({ items, renderItem }) => {
  return <div>{items.map(renderItem)}</div>;
});

const valueTypes = {
  SINGLE: 'SINGLE',
  MULTIPLE: 'MULTIPLE',
  MIXED: 'MIXED',
};

function handleSummary(summary, entry, label, item) {
  const data = stringTemplate.addFileTemplateFields(
    entry.get('path'),
    item.set('fields.label', label),
  );
  return stringTemplate.compileStringTemplate(summary, null, '', data);
}

function validateItem(field, item) {
  if (!Map.isMap(item)) {
    console.warn(
      `'${field.get('name')}' field item value value should be a map but is a '${typeof item}'`,
    );
    return false;
  }

  return true;
}
function LabelComponent({ field, isActive, hasErrors, uniqueFieldId, isFieldOptional, t }) {
  const label = `${field.get('label', field.get('name'))}`;
  return (
    <FieldLabel isActive={isActive} hasErrors={hasErrors} htmlFor={uniqueFieldId}>
      {label} {`${isFieldOptional ? ` (${t('editor.editorControl.field.optional')})` : ''}`}
    </FieldLabel>
  );
}

export default class ListControl extends React.Component {
  validations = [];

  static propTypes = {
    metadata: ImmutablePropTypes.map,
    onChange: PropTypes.func.isRequired,
    onChangeObject: PropTypes.func.isRequired,
    onValidateObject: PropTypes.func.isRequired,
    validate: PropTypes.func.isRequired,
    value: ImmutablePropTypes.list,
    field: PropTypes.object,
    forID: PropTypes.string,
    controlRef: PropTypes.func,
    mediaPaths: ImmutablePropTypes.map.isRequired,
    getAsset: PropTypes.func.isRequired,
    onOpenMediaLibrary: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveInsertedMedia: PropTypes.func.isRequired,
    classNameWrapper: PropTypes.string.isRequired,
    setActiveStyle: PropTypes.func.isRequired,
    setInactiveStyle: PropTypes.func.isRequired,
    editorControl: PropTypes.elementType.isRequired,
    resolveWidget: PropTypes.func.isRequired,
    clearFieldErrors: PropTypes.func.isRequired,
    fieldsErrors: ImmutablePropTypes.map.isRequired,
    entry: ImmutablePropTypes.map.isRequired,
  };

  static defaultProps = {
    value: List(),
    parentIds: [],
  };

  constructor(props) {
    super(props);
    const { field, value } = props;
    const listCollapsed = field.get('collapsed', true);
    const itemsCollapsed = (value && Array(value.size).fill(listCollapsed)) || [];
    const keys = (value && Array.from({ length: value.size }, () => uuid())) || [];

    this.state = {
      listCollapsed,
      itemsCollapsed,
      value: this.valueToString(value),
      keys,
    };
  }

  valueToString = value => {
    let stringValue;
    if (List.isList(value) || Array.isArray(value)) {
      stringValue = value.join(',');
    } else {
      console.warn(
        `Expected List value to be an array but received '${value}' with type of '${typeof value}'. Please check the value provided to the '${this.props.field.get(
          'name',
        )}' field`,
      );
      stringValue = String(value);
    }
    return stringValue.replace(/,([^\s]|$)/g, ', $1');
  };

  getValueType = () => {
    const { field } = this.props;
    if (field.get('fields')) {
      return valueTypes.MULTIPLE;
    } else if (field.get('field')) {
      return valueTypes.SINGLE;
    } else if (field.get(TYPES_KEY)) {
      return valueTypes.MIXED;
    } else {
      return null;
    }
  };

  uniqueFieldId = uniqueId(`${this.props.field.get('name')}-field-`);
  /**
   * Always update so that each nested widget has the option to update. This is
   * required because ControlHOC provides a default `shouldComponentUpdate`
   * which only updates if the value changes, but every widget must be allowed
   * to override this.
   */
  shouldComponentUpdate() {
    return true;
  }

  handleChange = e => {
    const { onChange } = this.props;
    const oldValue = this.state.value;
    const newValue = e.target.value.trim();
    const listValue = newValue ? newValue.split(',') : [];
    if (newValue.match(/,$/) && oldValue.match(/, $/)) {
      listValue.pop();
    }

    const parsedValue = this.valueToString(listValue);
    this.setState({ value: parsedValue });
    onChange(List(listValue.map(val => val.trim())));
  };

  handleFocus = () => {
    this.props.setActiveStyle();
  };

  handleBlur = e => {
    const listValue = e.target.value
      .split(',')
      .map(el => el.trim())
      .filter(el => el);
    this.setState({ value: this.valueToString(listValue) });
    this.props.setInactiveStyle();
  };

  handleAdd = e => {
    e.preventDefault();
    const { field } = this.props;
    const parsedValue =
      this.getValueType() === valueTypes.SINGLE
        ? this.singleDefault()
        : fromJS(this.multipleDefault(field.get('fields')));
    this.addItem(parsedValue);
  };

  singleDefault = () => {
    return this.props.field.getIn(['field', 'default'], null);
  };

  multipleDefault = fields => {
    return this.getFieldsDefault(fields);
  };

  handleAddType = (type, typeKey) => {
    const parsedValue = fromJS(this.mixedDefault(typeKey, type));
    this.addItem(parsedValue);
  };

  mixedDefault = (typeKey, type) => {
    const selectedType = this.props.field.get(TYPES_KEY).find(f => f.get('name') === type);
    const fields = selectedType.get('fields') || [selectedType.get('field')];

    return this.getFieldsDefault(fields, { [typeKey]: type });
  };

  getFieldsDefault = (fields, initialValue = {}) => {
    return fields.reduce((acc, item) => {
      const subfields = item.get('field') || item.get('fields');
      const object = item.get('widget') == 'object';
      const name = item.get('name');
      const defaultValue = item.get('default', null);

      if (List.isList(subfields) && object) {
        const subDefaultValue = this.getFieldsDefault(subfields);
        !isEmpty(subDefaultValue) && (acc[name] = subDefaultValue);
        return acc;
      }

      if (Map.isMap(subfields) && object) {
        const subDefaultValue = this.getFieldsDefault([subfields]);
        !isEmpty(subDefaultValue) && (acc[name] = subDefaultValue);
        return acc;
      }

      if (defaultValue !== null) {
        acc[name] = defaultValue;
      }

      return acc;
    }, initialValue);
  };

  addItem = parsedValue => {
    const { value, onChange, field } = this.props;
    const addToTop = field.get('add_to_top', false);

    const itemKey = uuid();
    this.setState({
      itemsCollapsed: addToTop
        ? [false, ...this.state.itemsCollapsed]
        : [...this.state.itemsCollapsed, false],
      keys: addToTop ? [itemKey, ...this.state.keys] : [...this.state.keys, itemKey],
    });

    const listValue = value || List();
    if (addToTop) {
      onChange(listValue.unshift(parsedValue));
    } else {
      onChange(listValue.push(parsedValue));
    }
  };

  processControlRef = ref => {
    if (!ref) return;
    const {
      validate,
      props: { validationKey: key },
    } = ref;
    this.validations.push({ key, validate });
  };

  validate = () => {
    if (this.getValueType()) {
      this.validations.forEach(item => {
        item.validate();
      });
    } else {
      this.props.validate();
    }
    this.props.onValidateObject(this.props.forID, this.validateSize());
  };

  validateSize = () => {
    const { field, value, t } = this.props;
    const min = field.get('min');
    const max = field.get('max');
    const required = field.get('required', true);

    if (!required && !value?.size) {
      return [];
    }

    const error = validations.validateMinMax(
      t,
      field.get('label', field.get('name')),
      value,
      min,
      max,
    );

    return error ? [error] : [];
  };

  /**
   * In case the `onChangeObject` function is frozen by a child widget implementation,
   * e.g. when debounced, always get the latest object value instead of using
   * `this.props.value` directly.
   */
  getObjectValue = idx => this.props.value.get(idx) || Map();

  handleChangeFor(index) {
    return (f, newValue, newMetadata) => {
      const { value, metadata, onChange, field } = this.props;
      const collectionName = field.get('name');
      const listFieldObjectWidget = field.getIn(['field', 'widget']) === 'object';
      const withNameKey =
        this.getValueType() !== valueTypes.SINGLE ||
        (this.getValueType() === valueTypes.SINGLE && listFieldObjectWidget);
      const newObjectValue = withNameKey
        ? this.getObjectValue(index).set(f.get('name'), newValue)
        : newValue;
      const parsedMetadata = {
        [collectionName]: Object.assign(metadata ? metadata.toJS() : {}, newMetadata || {}),
      };
      onChange(value.set(index, newObjectValue), parsedMetadata);
    };
  }

  handleRemove = (index, event) => {
    event.preventDefault();
    const { itemsCollapsed } = this.state;
    const { value, metadata, onChange, field, clearFieldErrors } = this.props;
    const collectionName = field.get('name');
    const isSingleField = this.getValueType() === valueTypes.SINGLE;

    const metadataRemovePath = isSingleField ? value.get(index) : value.get(index).valueSeq();
    const parsedMetadata =
      metadata && !metadata.isEmpty()
        ? { [collectionName]: metadata.removeIn(metadataRemovePath) }
        : metadata;

    itemsCollapsed.splice(index, 1);
    // clear validations
    this.validations = [];

    this.setState({
      itemsCollapsed: [...itemsCollapsed],
      keys: Array.from({ length: value.size - 1 }, () => uuid()),
    });

    onChange(value.remove(index), parsedMetadata);
    clearFieldErrors();
  };

  handleItemCollapseToggle = (index, event) => {
    event.preventDefault();
    const { itemsCollapsed } = this.state;
    const newItemsCollapsed = itemsCollapsed.map((collapsed, itemIndex) => {
      if (index === itemIndex) {
        return !collapsed;
      }
      return collapsed;
    });
    this.setState({
      itemsCollapsed: newItemsCollapsed,
    });
  };

  handleCollapseAllToggle = e => {
    e.preventDefault();
    const { value, field } = this.props;
    const { itemsCollapsed, listCollapsed } = this.state;
    const minimizeCollapsedItems = field.get('minimize_collapsed', false);
    const listCollapsedByDefault = field.get('collapsed', true);
    const allItemsCollapsed = itemsCollapsed.every(val => val === true);

    if (minimizeCollapsedItems) {
      let updatedItemsCollapsed = itemsCollapsed;
      // Only allow collapsing all items in this mode but not opening all at once
      if (!listCollapsed || !listCollapsedByDefault) {
        updatedItemsCollapsed = Array(value.size).fill(!listCollapsed);
      }
      this.setState({ listCollapsed: !listCollapsed, itemsCollapsed: updatedItemsCollapsed });
    } else {
      this.setState({ itemsCollapsed: Array(value.size).fill(!allItemsCollapsed) });
    }
  };

  objectLabel(item) {
    const { field, entry } = this.props;
    const valueType = this.getValueType();
    switch (valueType) {
      case valueTypes.MIXED: {
        if (!validateItem(field, item)) {
          return;
        }
        const itemType = getTypedFieldForValue(field, item);
        const label = itemType.get('label', itemType.get('name'));
        // each type can have its own summary, but default to the list summary if exists
        const summary = itemType.get('summary', field.get('summary'));
        const labelReturn = summary ? handleSummary(summary, entry, label, item) : label;
        return labelReturn;
      }
      case valueTypes.SINGLE: {
        const singleField = field.get('field');
        const label = singleField.get('label', singleField.get('name'));
        const summary = field.get('summary');
        const data = fromJS({ [singleField.get('name')]: item });
        const labelReturn = summary ? handleSummary(summary, entry, label, data) : label;
        return labelReturn;
      }
      case valueTypes.MULTIPLE: {
        if (!validateItem(field, item)) {
          return;
        }
        const multiFields = field.get('fields');
        const labelField = multiFields && multiFields.first();
        const value = item.get(labelField.get('name'));
        const summary = field.get('summary');
        const labelReturn = summary ? handleSummary(summary, entry, value, item) : value;
        return (labelReturn || `No ${labelField.get('name')}`).toString();
      }
    }
    return '';
  }

  onSortEnd = ({ oldIndex, newIndex }) => {
    const { value, clearFieldErrors } = this.props;
    const { itemsCollapsed, keys } = this.state;

    // Update value
    const item = value.get(oldIndex);
    const newValue = value.delete(oldIndex).insert(newIndex, item);
    this.props.onChange(newValue);

    // Update collapsing
    const collapsed = itemsCollapsed[oldIndex];
    itemsCollapsed.splice(oldIndex, 1);
    const updatedItemsCollapsed = [...itemsCollapsed];
    updatedItemsCollapsed.splice(newIndex, 0, collapsed);

    // Reset item to ensure updated state
    const updatedKeys = keys.map((key, keyIndex) => {
      if (keyIndex === oldIndex || keyIndex === newIndex) {
        return uuid();
      }
      return key;
    });
    this.setState({ itemsCollapsed: updatedItemsCollapsed, keys: updatedKeys });

    //clear error fields and remove old validations
    clearFieldErrors();
    this.validations = this.validations.filter(item => updatedKeys.includes(item.key));
  };

  hasError = index => {
    const { fieldsErrors } = this.props;
    if (fieldsErrors && fieldsErrors.size > 0) {
      return Object.values(fieldsErrors.toJS()).some(arr =>
        arr.some(err => err.parentIds && err.parentIds.includes(this.state.keys[index])),
      );
    }
  };

  // eslint-disable-next-line react/display-name
  renderItem = (item, index) => {
    const {
      classNameWrapper,
      editorControl,
      onValidateObject,
      metadata,
      clearFieldErrors,
      fieldsErrors,
      controlRef,
      resolveWidget,
      parentIds,
      forID,
      t,
    } = this.props;

    const { itemsCollapsed, keys } = this.state;
    const collapsed = itemsCollapsed[index];
    const key = keys[index];
    let field = this.props.field;
    const hasError = this.hasError(index);
    const isVariableTypesList = this.getValueType() === valueTypes.MIXED;
    if (isVariableTypesList) {
      field = getTypedFieldForValue(field, item);
      if (!field) {
        return this.renderErroneousTypedItem(index, item);
      }
    }
    return (
      <SortableListItem
        css={[styles.listControlItem, collapsed && styles.listControlItemCollapsed]}
        index={index}
        key={key}
      >
        {isVariableTypesList && (
          <LabelComponent
            field={field}
            isActive={false}
            hasErrors={hasError}
            uniqueFieldId={this.uniqueFieldId}
            isFieldOptional={field.get('required') === false}
            t={t}
          />
        )}
        <StyledListItemTopBar
          collapsed={collapsed}
          onCollapseToggle={partial(this.handleItemCollapseToggle, index)}
          onRemove={partial(this.handleRemove, index)}
          dragHandleHOC={SortableHandle}
          data-testid={`styled-list-item-top-bar-${key}`}
        />
        <NestedObjectLabel collapsed={collapsed} error={hasError}>
          {this.objectLabel(item)}
        </NestedObjectLabel>
        <ClassNames>
          {({ css, cx }) => (
            <ObjectControl
              classNameWrapper={cx(classNameWrapper, {
                [css`
                  ${styleStrings.collapsedObjectControl};
                `]: collapsed,
              })}
              value={item}
              field={field}
              onChangeObject={this.handleChangeFor(index)}
              editorControl={editorControl}
              resolveWidget={resolveWidget}
              metadata={metadata}
              forList
              onValidateObject={onValidateObject}
              clearFieldErrors={clearFieldErrors}
              fieldsErrors={fieldsErrors}
              ref={this.processControlRef}
              controlRef={controlRef}
              validationKey={key}
              collapsed={collapsed}
              data-testid={`object-control-${key}`}
              hasError={hasError}
              parentIds={[...parentIds, forID, key]}
            />
          )}
        </ClassNames>
      </SortableListItem>
    );
  };

  renderErroneousTypedItem(index, item) {
    const field = this.props.field;
    const errorMessage = getErrorMessageForTypedFieldAndValue(field, item);
    const key = `item-${index}`;
    return (
      <SortableListItem
        css={[styles.listControlItem, styles.listControlItemCollapsed]}
        index={index}
        key={key}
      >
        <StyledListItemTopBar
          onCollapseToggle={null}
          onRemove={partial(this.handleRemove, index, key)}
          dragHandleHOC={SortableHandle}
        />
        <NestedObjectLabel collapsed={true} error={true}>
          {errorMessage}
        </NestedObjectLabel>
      </SortableListItem>
    );
  }

  renderListControl() {
    const { value, forID, field, classNameWrapper } = this.props;
    const { itemsCollapsed, listCollapsed } = this.state;
    const items = value || List();
    const label = field.get('label', field.get('name'));
    const labelSingular = field.get('label_singular') || field.get('label', field.get('name'));
    const listLabel = items.size === 1 ? labelSingular.toLowerCase() : label.toLowerCase();
    const minimizeCollapsedItems = field.get('minimize_collapsed', false);
    const allItemsCollapsed = itemsCollapsed.every(val => val === true);
    const selfCollapsed = allItemsCollapsed && (listCollapsed || !minimizeCollapsedItems);

    return (
      <ClassNames>
        {({ cx, css }) => (
          <div
            id={forID}
            className={cx(
              classNameWrapper,
              css`
                ${styleStrings.objectWidgetTopBarContainer}
              `,
            )}
          >
            <ObjectWidgetTopBar
              allowAdd={field.get('allow_add', true)}
              onAdd={this.handleAdd}
              types={field.get(TYPES_KEY, null)}
              onAddType={type => this.handleAddType(type, resolveFieldKeyType(field))}
              heading={`${items.size} ${listLabel}`}
              label={labelSingular.toLowerCase()}
              onCollapseToggle={this.handleCollapseAllToggle}
              collapsed={selfCollapsed}
            />
            {(!selfCollapsed || !minimizeCollapsedItems) && (
              <SortableList
                items={items}
                renderItem={this.renderItem}
                onSortEnd={this.onSortEnd}
                useDragHandle
                lockAxis="y"
              />
            )}
          </div>
        )}
      </ClassNames>
    );
  }

  renderInput() {
    const { forID, classNameWrapper } = this.props;
    const { value } = this.state;

    return (
      <input
        type="text"
        id={forID}
        value={value}
        onChange={this.handleChange}
        onFocus={this.handleFocus}
        onBlur={this.handleBlur}
        className={classNameWrapper}
      />
    );
  }

  render() {
    if (this.getValueType() !== null) {
      return this.renderListControl();
    } else {
      return this.renderInput();
    }
  }
}
