import React, { Component, PropTypes } from 'react';
import ReactDOM from 'react-dom';
import ImmutablePropTypes from 'react-immutable-proptypes';
import registry from '../../lib/registry';
import { resolveWidget } from '../Widgets';
import { Map } from 'immutable';
import controlStyles from '../ControlPanel/ControlPane.css';

export default class BlockControl extends Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onAddAsset: PropTypes.func.isRequired,
    onRemoveAsset: PropTypes.func.isRequired,
    getAsset: PropTypes.func.isRequired,
    value: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.object,
      PropTypes.bool,
    ]),
    field: PropTypes.object,
    forID: PropTypes.string,
  };

  constructor(props) {
    super(props);

    const fieldValue = this.props.value && Map.isMap(this.props.value) ? this.props.value.get(this.props.field.get('name')) : this.props.value;
    console.log(fieldValue);
    if(!fieldValue)  {
      this.state = {
        widget: null,
      };
    } else {
      this.state = {
        widget: resolveWidget(fieldValue),
      };
    }

  }

  handleChange = (e) => {
    this.props.onChange(Map().set(e.target.id, e.target.value));

    if (!e.target.value) {
      this.setState({
        widget: null,
      });
    } else {
      this.setState({
        widget: resolveWidget(e.target.value),
      });
    }
  };

  render() {
    const { field, value, forID, onChange, onAddAsset, onRemoveAsset, getAsset } = this.props;
    // const { onAddAsset, onRemoveAsset, getAsset, value, onChange } = this.props;
    const { widget } = this.state;
    const fieldValue = value && Map.isMap(value) ? value.get(field.get('name')) : value;
    const fieldValueSelected = value && Map.isMap(value) ? value.get(field.get('name') + '_selected') : value;

    // console.log(fieldValue);
    // console.log(fieldValueSelected);
    // console.log(value);

    const fieldOptions = [
      '',
      'string',
      'text',
    ];

    const options = fieldOptions.map((option) => {
      if (typeof option === 'string') {
        return { label: option, value: option };
      }
      return option;
    });

    return (
      <div>
        <div>
          <select id={forID} value={fieldValue || ''} onChange={this.handleChange}>
            {options.map((option, idx) => <option key={idx} value={option.value}>
              {option.label}
            </option>)}
          </select>
        </div>
        <div>
          {
            widget ?
              <div className={controlStyles.widget} key={field.get('name')}>
                <div className={controlStyles.control} key={field.get('name')}>
                  <label className={controlStyles.label} htmlFor={field.get('name')}>{field.get('label')}</label>
                  {
                    React.createElement(widget.control, {
                      id: field.get('name') + '_selected',
                      field,
                      value: fieldValueSelected,
                      onChange: (val, metadata) => {
                        onChange((value || Map()).set(field.get('name') + '_selected', val), metadata);
                      },
                      onAddAsset,
                      onRemoveAsset,
                      getAsset,
                      forID: field.get('name') + '_selected',
                    })
                  }
                </div>
              </div>
            :
              ''
          }
        </div>
      </div>
    );
  }
}
