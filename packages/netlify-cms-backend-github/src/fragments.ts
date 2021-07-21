import { gql } from 'graphql-tag';

export const repository = gql`
  fragment RepositoryParts on Repository {
    id
    isFork
  }
`;

export const blobWithText = gql`
  fragment BlobWithTextParts on Blob {
    id
    text
    is_binary: isBinary
  }
`;

export const object = gql`
  fragment ObjectParts on GitObject {
    id
    sha: oid
  }
`;

export const branch = gql`
  fragment BranchParts on Ref {
    commit: target {
      ...ObjectParts
    }
    id
    name
    prefix
    repository {
      ...RepositoryParts
    }
  }
  ${object}
  ${repository}
`;

export const pullRequest = gql`
  fragment PullRequestParts on PullRequest {
    id
    baseRefName
    baseRefOid
    body
    headRefName
    headRefOid
    number
    state
    title
    merged_at: mergedAt
    updated_at: updatedAt
    repository {
      ...RepositoryParts
    }
    labels(last: 100) {
      nodes {
        name
      }
    }
  }
  ${repository}
`;

export const treeEntry = gql`
  fragment TreeEntryParts on TreeEntry {
    path: name
    sha: oid
    type
    mode
  }
`;

export const fileEntry = gql`
  fragment FileEntryParts on TreeEntry {
    name
    sha: oid
    type
    blob: object {
      ... on Blob {
        size: byteSize
      }
    }
  }
`;
