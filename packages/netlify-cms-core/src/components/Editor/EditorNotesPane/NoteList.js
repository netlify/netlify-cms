import React from 'react';
import styled from '@emotion/styled';

const NoteListContainer = styled.div`
  flex: 1;
  padding: 16px;
`;

const NoteContainer = styled.div`
  display: flex;
  min-height: 56px;
  width: 100%;
  margin-bottom: 24px;
`;

const ImageContainer = styled.div`
  border-radius: 100%;
  height: 32px;
  width: 32px;
  border: 1px solid black;
  margin: 8px;
  padding: 6px 0 0 1px;
`;

const NoteInfoContainer = styled.div`
  border: 1px solid black;
  flex: 1;
  border-radius: 4px;
`;

const NoteToolbarContainer = styled.div`
  height: 48px;
  padding: 12px 8px;
  display: flex;
  background-color: #f6f8fa;
  color: #586069;
  p {
    margin-right: 8px;
  }
`;

const NoteTextContainer = styled.div`
  min-height: 48px;
  padding: 12px 8px;
`;

export function AuthorImage() {
  return <ImageContainer>Img</ImageContainer>;
}

export function NoteToolbar(props) {
  const { author, createdAt } = props;
  return (
    <NoteToolbarContainer>
      <p>{author}</p>
      <p>commented on</p>
      <p>{createdAt}</p>
    </NoteToolbarContainer>
  );
}

export class Note extends React.Component {
  render() {
    const {
      note: { key, value, author, createdAt },
    } = this.props;
    return (
      <NoteContainer key={key}>
        <AuthorImage author={author} />
        <NoteInfoContainer>
          <NoteToolbar author={author} createdAt={createdAt} />
          <NoteTextContainer>{value}</NoteTextContainer>
        </NoteInfoContainer>
      </NoteContainer>
    );
  }
}

class NoteList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      notes: [],
    };
  }

  componentDidMount() {}

  render() {
    const notes = [
      {
        key: 1,
        author: 'Bob',
        createdAt: '2021:04:21T00:00:00.000Z',
        value: 'This is a comment',
      },
      {
        key: 2,
        author: 'Bob',
        createdAt: '2021:04:21T00:00:00.000Z',
        value: 'This is a comment',
      },
      {
        key: 3,
        author: 'Bob',
        createdAt: '2021:04:21T00:00:00.000Z',
        value: 'This is a comment',
      },
      {
        key: 4,
        author: 'Bob',
        createdAt: '2021:04:21T00:00:00.000Z',
        value: 'This is a comment',
      },
    ];
    return (
      <NoteListContainer>
        {notes.map(note => (
          <Note key={note.key} note={note} />
        ))}
      </NoteListContainer>
    );
  }
}

export default NoteList;
