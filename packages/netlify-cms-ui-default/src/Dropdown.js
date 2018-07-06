import React from 'react';
import PropTypes from 'prop-types';
import styled, { css } from 'react-emotion';
import { Wrapper, Button as DropdownButton, Menu, MenuItem } from 'react-aria-menubutton';
import { shadows, colors, colorsRaw, lengths, buttons, components } from './styles';
import Icon from './Icon';

const StyledWrapper = styled(Wrapper)`
  position: relative;
  font-size: 14px;
  user-select: none;
`

const StyledDropdownButton = styled(DropdownButton)`
  ${buttons.button};
  ${buttons.default};
  display: block;
  padding-left: 20px;
  padding-right: 40px;

  &:after {
    ${components.caretDown};
    content: '';
    display: block;
    position: absolute;
    top: 16px;
    right: 16px;
    color: currentColor;
  }
`

const DropdownList = styled.ul`
  ${shadows.dropDeep};
  background-color: ${colorsRaw.white};
  border-radius: ${lengths.borderRadius};
  overflow: hidden;
  margin: 0;
  position: absolute;
  top: 0;
  left: 0;
  min-width: 100%;
  z-index: 1;

  ${props => css`
    width: ${props.width};
    top: ${props.top};
    left: ${props.position === 'left' ? 0 : 'auto'};
    right: ${props.position === 'right' ? 0 : 'auto'};
  `}
`

const StyledMenuItem = styled(MenuItem)`
  ${buttons.button};
  background-color: transparent;
  border-radius: 0;
  color: ${colorsRaw.gray};
  font-weight: 500;
  border-bottom: 1px solid #eaebf1;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:last-of-type {
    border-bottom: 0;
  }

  &:hover,
  &:active,
  &:focus {
    color: ${colors.active};
    background-color: ${colors.activeBackground};
  }
`

const MenuItemIconContainer = styled.div`
  flex: 1 0 32px;
  text-align: right;
  position: relative;
  top: 2px;
`

const Dropdown = ({
  renderButton,
  dropdownWidth = 'auto',
  dropdownPosition = 'left',
  dropdownTopOverlap = '0',
  children,
}) => {
  return (
    <StyledWrapper onSelection={handler => handler()}>
      {renderButton()}
      <Menu>
        <DropdownList width={dropdownWidth} top={dropdownTopOverlap} position={dropdownPosition}>
          {children}
        </DropdownList>
      </Menu>
    </StyledWrapper>
  );
};

const DropdownItem = ({ label, icon, iconDirection, onClick }) => (
  <StyledMenuItem value={onClick}>
    <span>{label}</span>
    {
      icon
        ? <MenuItemIconContainer>
            <Icon type={icon} direction={iconDirection} size="small"/>
          </MenuItemIconContainer>
        : null
    }
  </StyledMenuItem>
);

export { Dropdown as default, DropdownItem, DropdownButton, StyledDropdownButton };
