import React from 'react';
import styled from '@emotion/styled';

const CreateNoteContainer = styled.div`
  height: 64px;
  padding: 8px 16px;
  display: flex;
  background-color: #f6f8fa;
`;

const CreateNoteInput = styled.textarea`
  min-height: 48px;
  border-radius: 8px;
  flex: 1;
  padding: 12px 8px;
  font-size: 14px;
`;

const CreateNoteButton = styled.button`
  border-radius: 100%;
  height: 48px;
  width: 48px;
  margin: 0 0 0 8px;
  padding: 0;
`;

export default function CreateNote() {
  return (
    <CreateNoteContainer>
      <CreateNoteInput height="32px" placeholder="Create Note"></CreateNoteInput>
      <CreateNoteButton>Create</CreateNoteButton>
    </CreateNoteContainer>
  );
}
