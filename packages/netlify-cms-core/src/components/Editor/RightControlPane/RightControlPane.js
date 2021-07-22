import React, { useState } from 'react';
import styled from '@emotion/styled';

const RightControlPanelContainer = styled.div`
  display: flex;
  padding: 12px 8px 0 8px;
  border-bottom: 1px solid black;
  height: 48px;
`;

const Tab = styled.div`
  border: 1px solid black;
  padding: 8px;
  border-radius: 4px;
  cursor: pointer;
  line-height: 1;
  text-align: center;
  color: ${props => (props.isActive ? '#fff' : '#3a69c7')};
  background-color: ${props => (props.isActive ? '#149fff' : '#fff')};
`;

export default function RightControlPane(props) {
  const { tabs } = props;
  const [activeTab, setActiveTab] = useState(tabs[0].key);

  function handleTabClick(key) {
    setActiveTab(key);
  }

  const activeTabContent = tabs.find(tab => tab.key === activeTab)?.content;

  return (
    <>
      <RightControlPanelContainer>
        {tabs.map(tab => (
          <Tab
            key={tab.key}
            isActive={tab.key === activeTab}
            onClick={() => handleTabClick(tab.key)}
          >
            {tab.title}
          </Tab>
        ))}
      </RightControlPanelContainer>
      {activeTabContent ? activeTabContent : null}
    </>
  );
}
