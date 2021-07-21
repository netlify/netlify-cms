import { ApolloClient } from 'apollo-client';
import {
  InMemoryCache,
  defaultDataIdFromObject,
  IntrospectionFragmentMatcher,
} from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import {
  APIError,
  readFile,
  localForage,
  DEFAULT_PR_BODY,
  branchFromContentKey,
  CMS_BRANCH_PREFIX,
  throwOnConflictingBranches,
} from 'netlify-cms-lib-util';
import { trim, trimStart } from 'lodash';

import introspectionQueryResultData from './fragmentTypes';
import API, { API_NAME, PullRequestState, MOCK_PULL_REQUEST } from './API';
import * as queries from './queries';
import * as mutations from './mutations';

import type { Config, BlobArgs } from './API';
import type { NormalizedCacheObject } from 'apollo-cache-inmemory';
import type { QueryOptions, MutationOptions, OperationVariables } from 'apollo-client';
import type { GraphQLError } from 'graphql';
import type { Octokit } from '@octokit/rest';

const NO_CACHE = 'no-cache';
const CACHE_FIRST = 'cache-first';

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData,
});

interface TreeEntry {
  object?: {
    entries: TreeEntry[];
  };
  type: 'blob' | 'tree';
  name: string;
  sha: string;
  blob?: {
    size: number;
  };
}

interface TreeFile {
  path: string;
  id: string;
  size: number;
  type: string;
  name: string;
}

type GraphQLPullRequest = {
  id: string;
  baseRefName: string;
  baseRefOid: string;
  body: string;
  headRefName: string;
  headRefOid: string;
  number: number;
  state: string;
  title: string;
  mergedAt: string | null;
  updatedAt: string | null;
  labels: { nodes: { name: string }[] };
  repository: {
    id: string;
    isFork: boolean;
  };
};

function transformPullRequest(pr: GraphQLPullRequest) {
  return {
    ...pr,
    labels: pr.labels.nodes,
    head: { ref: pr.headRefName, sha: pr.headRefOid, repo: { fork: pr.repository.isFork } },
    base: { ref: pr.baseRefName, sha: pr.baseRefOid },
  };
}

type Error = GraphQLError & { type: string };

export default class GraphQLAPI extends API {
  client: ApolloClient<NormalizedCacheObject>;

  constructor(config: Config) {
    super(config);

    this.client = this.getApolloClient();
  }

  getApolloClient() {
    const authLink = setContext((_, { headers }) => {
      return {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          ...headers,
          authorization: this.token ? `token ${this.token}` : '',
        },
      };
    });
    const httpLink = createHttpLink({ uri: `${this.apiRoot}/graphql` });
    return new ApolloClient({
      link: authLink.concat(httpLink),
      cache: new InMemoryCache({ fragmentMatcher }),
      defaultOptions: {
        watchQuery: {
          fetchPolicy: NO_CACHE,
          errorPolicy: 'ignore',
        },
        query: {
          fetchPolicy: NO_CACHE,
          errorPolicy: 'all',
        },
      },
    });
  }

  reset() {
    return this.client.resetStore();
  }

  async getRepository(owner: string, name: string) {
    const { data } = await this.query({
      query: queries.repository,
      variables: { owner, name },
      fetchPolicy: CACHE_FIRST, // repository id doesn't change
    });
    return data.repository;
  }

  query(options: QueryOptions<OperationVariables>) {
    return this.client.query(options).catch(error => {
      throw new APIError(error.message, 500, 'GitHub');
    });
  }

  async mutate(options: MutationOptions<OperationVariables>) {
    try {
      const result = await this.client.mutate(options);
      return result;
    } catch (error) {
      const errors = error.graphQLErrors;
      if (Array.isArray(errors) && errors.some(e => e.message === 'Ref cannot be created.')) {
        const refName = options?.variables?.createRefInput?.name || '';
        const branchName = trimStart(refName, 'refs/heads/');
        if (branchName) {
          await throwOnConflictingBranches(branchName, name => this.getBranch(name), API_NAME);
        }
      } else if (
        Array.isArray(errors) &&
        errors.some(e =>
          new RegExp(
            `A ref named "refs/heads/${CMS_BRANCH_PREFIX}/.+?" already exists in the repository.`,
          ).test(e.message),
        )
      ) {
        const refName = options?.variables?.createRefInput?.name || '';
        const sha = options?.variables?.createRefInput?.oid || '';
        const branchName = trimStart(refName, 'refs/heads/');
        if (branchName && branchName.startsWith(`${CMS_BRANCH_PREFIX}/`) && sha) {
          try {
            // this can happen if the branch wasn't deleted when the PR was merged
            // we backup the existing branch just in case an re-run the mutation
            await this.backupBranch(branchName);
            await this.deleteBranch(branchName);
            const result = await this.client.mutate(options);
            return result;
          } catch (e) {
            console.log(e);
          }
        }
      }
      throw new APIError(error.message, 500, 'GitHub');
    }
  }

  async hasWriteAccess() {
    const { repoOwner: owner, repoName: name } = this;
    try {
      const { data } = await this.query({
        query: queries.repoPermission,
        variables: { owner, name },
        fetchPolicy: CACHE_FIRST, // we can assume permission doesn't change often
      });
      // https://developer.github.com/v4/enum/repositorypermission/
      const { viewerPermission } = data.repository;
      return ['ADMIN', 'MAINTAIN', 'WRITE'].includes(viewerPermission);
    } catch (error) {
      console.error('Problem fetching repo data from GitHub');
      throw error;
    }
  }

  async user() {
    const { data } = await this.query({
      query: queries.user,
      fetchPolicy: CACHE_FIRST, // we can assume user details don't change often
    });
    return data.viewer;
  }

  async retrieveBlobObject(owner: string, name: string, expression: string, options = {}) {
    const { data } = await this.query({
      query: queries.blob,
      variables: { owner, name, expression },
      ...options,
    });
    // https://developer.github.com/v4/object/blob/
    if (data.repository.object) {
      const { is_binary: isBinary, text } = data.repository.object;
      return { isNull: false, isBinary, text };
    } else {
      return { isNull: true };
    }
  }

  getOwnerAndNameFromRepoUrl(repoURL: string) {
    let { repoOwner: owner, repoName: name } = this;

    if (repoURL === this.originRepoURL) {
      ({ originRepoOwner: owner, originRepoName: name } = this);
    }

    return { owner, name };
  }

  async readFile(
    path: string,
    sha?: string | null,
    {
      branch = this.branch,
      repoURL = this.repoURL,
      parseText = true,
    }: {
      branch?: string;
      repoURL?: string;
      parseText?: boolean;
    } = {},
  ) {
    if (!sha) {
      sha = await this.getFileSha(path, { repoURL, branch });
    }
    const fetchContent = () => this.fetchBlobContent({ sha: sha as string, repoURL, parseText });
    const content = await readFile(sha, fetchContent, localForage, parseText);
    return content;
  }

  async fetchBlobContent({ sha, repoURL, parseText }: BlobArgs) {
    if (!parseText) {
      return super.fetchBlobContent({ sha, repoURL, parseText });
    }
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { isNull, isBinary, text } = await this.retrieveBlobObject(
      owner,
      name,
      sha,
      { fetchPolicy: CACHE_FIRST }, // blob sha is derived from file content
    );

    if (isNull) {
      throw new APIError('Not Found', 404, 'GitHub');
    } else if (!isBinary) {
      return text;
    } else {
      return super.fetchBlobContent({ sha, repoURL, parseText });
    }
  }

  async getPullRequests(
    head: string | undefined,
    state: PullRequestState,
    predicate: (pr: Octokit.PullsListResponseItem) => boolean,
  ) {
    const { originRepoOwner: owner, originRepoName: name } = this;
    let states;
    if (state === PullRequestState.Open) {
      states = ['OPEN'];
    } else if (state === PullRequestState.Closed) {
      states = ['CLOSED', 'MERGED'];
    } else {
      states = ['OPEN', 'CLOSED', 'MERGED'];
    }
    const { data } = await this.query({
      query: queries.pullRequests,
      variables: {
        owner,
        name,
        ...(head ? { head } : {}),
        states,
      },
    });
    const {
      pullRequests,
    }: {
      pullRequests: {
        nodes: GraphQLPullRequest[];
      };
    } = data.repository;

    const mapped = pullRequests.nodes.map(transformPullRequest);

    return (mapped as unknown as Octokit.PullsListResponseItem[]).filter(
      pr => pr.head.ref.startsWith(`${CMS_BRANCH_PREFIX}/`) && predicate(pr),
    );
  }

  async getOpenAuthoringBranches() {
    const { repoOwner: owner, repoName: name } = this;
    const { data } = await this.query({
      query: queries.openAuthoringBranches,
      variables: {
        owner,
        name,
        refPrefix: `refs/heads/cms/${this.repo}/`,
      },
    });

    return data.repository.refs.nodes.map(({ name, prefix }: { name: string; prefix: string }) => ({
      ref: `${prefix}${name}`,
    }));
  }

  async getStatuses(collectionName: string, slug: string) {
    const contentKey = this.generateContentKey(collectionName, slug);
    const branch = branchFromContentKey(contentKey);
    const pullRequest = await this.getBranchPullRequest(branch);
    const sha = pullRequest.head.sha;
    const { originRepoOwner: owner, originRepoName: name } = this;
    const { data } = await this.query({ query: queries.statues, variables: { owner, name, sha } });
    if (data.repository.object) {
      const { status } = data.repository.object;
      const { contexts } = status || { contexts: [] };
      return contexts;
    } else {
      return [];
    }
  }

  getAllFiles(entries: TreeEntry[], path: string) {
    const allFiles: TreeFile[] = entries.reduce((acc, item) => {
      if (item.type === 'tree') {
        const entries = item.object?.entries || [];
        return [...acc, ...this.getAllFiles(entries, `${path}/${item.name}`)];
      } else if (item.type === 'blob') {
        return [
          ...acc,
          {
            name: item.name,
            type: item.type,
            id: item.sha,
            path: `${path}/${item.name}`,
            size: item.blob ? item.blob.size : 0,
          },
        ];
      }

      return acc;
    }, [] as TreeFile[]);
    return allFiles;
  }

  async listFiles(path: string, { repoURL = this.repoURL, branch = this.branch, depth = 1 } = {}) {
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const folder = trim(path, '/');
    const { data } = await this.query({
      query: queries.files(depth),
      variables: { owner, name, expression: `${branch}:${folder}` },
    });

    if (data.repository.object) {
      const allFiles = this.getAllFiles(data.repository.object.entries, folder);
      return allFiles;
    } else {
      return [];
    }
  }

  getBranchQualifiedName(branch: string) {
    return `refs/heads/${branch}`;
  }

  getBranchQuery(branch: string, owner: string, name: string) {
    return {
      query: queries.branch,
      variables: {
        owner,
        name,
        qualifiedName: this.getBranchQualifiedName(branch),
      },
    };
  }

  async getDefaultBranch() {
    const { data } = await this.query({
      ...this.getBranchQuery(this.branch, this.originRepoOwner, this.originRepoName),
    });
    return data.repository.branch;
  }

  async getBranch(branch: string) {
    const { data } = await this.query({
      ...this.getBranchQuery(branch, this.repoOwner, this.repoName),
      fetchPolicy: CACHE_FIRST,
    });
    if (!data.repository.branch) {
      throw new APIError('Branch not found', 404, API_NAME);
    }
    return data.repository.branch;
  }

  async patchRef(type: string, name: string, sha: string, opts: { force?: boolean } = {}) {
    if (type !== 'heads') {
      return super.patchRef(type, name, sha, opts);
    }

    const force = opts.force || false;

    const branch = await this.getBranch(name);
    const { data } = await this.mutate({
      mutation: mutations.updateBranch,
      variables: {
        input: { oid: sha, refId: branch.id, force },
      },
    });
    return data!.updateRef.branch;
  }

  async deleteBranch(branchName: string) {
    const branch = await this.getBranch(branchName);
    const { data } = await this.mutate({
      mutation: mutations.deleteBranch,
      variables: {
        deleteRefInput: { refId: branch.id },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      update: (store: any) => store.data.delete(defaultDataIdFromObject(branch)),
    });

    return data!.deleteRef;
  }

  getPullRequestQuery(number: number) {
    const { originRepoOwner: owner, originRepoName: name } = this;

    return {
      query: queries.pullRequest,
      variables: { owner, name, number },
    };
  }

  async getPullRequest(number: number) {
    const { data } = await this.query({
      ...this.getPullRequestQuery(number),
      fetchPolicy: CACHE_FIRST,
    });

    // https://developer.github.com/v4/enum/pullrequeststate/
    // GraphQL state: [CLOSED, MERGED, OPEN]
    // REST API state: [closed, open]
    const state =
      data.repository.pullRequest.state === 'OPEN'
        ? PullRequestState.Open
        : PullRequestState.Closed;
    return {
      ...data.repository.pullRequest,
      state,
    };
  }

  getPullRequestAndBranchQuery(branch: string, number: number) {
    const { repoOwner: owner, repoName: name } = this;
    const { originRepoOwner, originRepoName } = this;
    return {
      query: queries.pullRequestAndBranch,
      variables: {
        owner,
        name,
        originRepoOwner,
        originRepoName,
        number,
        qualifiedName: this.getBranchQualifiedName(branch),
      },
    };
  }

  async getPullRequestAndBranch(branch: string, number: number) {
    const { data } = await this.query({
      ...this.getPullRequestAndBranchQuery(branch, number),
      fetchPolicy: CACHE_FIRST,
    });

    const { repository, origin } = data;
    return { branch: repository.branch, pullRequest: origin.pullRequest };
  }

  async openPR(number: number) {
    const pullRequest = await this.getPullRequest(number);

    const { data } = await this.mutate({
      mutation: mutations.reopenPullRequest,
      variables: {
        reopenPullRequestInput: { pullRequestId: pullRequest.id },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult!.reopenPullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });

    return data!.reopenPullRequest;
  }

  async closePR(number: number) {
    const pullRequest = await this.getPullRequest(number);

    const { data } = await this.mutate({
      mutation: mutations.closePullRequest,
      variables: {
        closePullRequestInput: { pullRequestId: pullRequest.id },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult!.closePullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });

    return data!.closePullRequest;
  }

  async deleteUnpublishedEntry(collectionName: string, slug: string) {
    try {
      const contentKey = this.generateContentKey(collectionName, slug);
      const branchName = branchFromContentKey(contentKey);
      const pr = await this.getBranchPullRequest(branchName);
      if (pr.number !== MOCK_PULL_REQUEST) {
        const { branch, pullRequest } = await this.getPullRequestAndBranch(branchName, pr.number);

        const { data } = await this.mutate({
          mutation: mutations.closePullRequestAndDeleteBranch,
          variables: {
            deleteRefInput: { refId: branch.id },
            closePullRequestInput: { pullRequestId: pullRequest.id },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          update: (store: any) => {
            store.data.delete(defaultDataIdFromObject(branch));
            store.data.delete(defaultDataIdFromObject(pullRequest));
          },
        });

        return data!.closePullRequest;
      } else {
        return await this.deleteBranch(branchName);
      }
    } catch (e) {
      const { graphQLErrors } = e;
      if (graphQLErrors && graphQLErrors.length > 0) {
        const branchNotFound = graphQLErrors.some((e: Error) => e.type === 'NOT_FOUND');
        if (branchNotFound) {
          return;
        }
      }
      throw e;
    }
  }

  async createPR(title: string, head: string) {
    const [repository, headReference] = await Promise.all([
      this.getRepository(this.originRepoOwner, this.originRepoName),
      this.useOpenAuthoring ? `${(await this.user()).login}:${head}` : head,
    ]);
    const { data } = await this.mutate({
      mutation: mutations.createPullRequest,
      variables: {
        createPullRequestInput: {
          baseRefName: this.branch,
          body: DEFAULT_PR_BODY,
          title,
          headRefName: headReference,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { pullRequest } = mutationResult!.createPullRequest;
        const pullRequestData = { repository: { ...pullRequest.repository, pullRequest } };

        store.writeQuery({
          ...this.getPullRequestQuery(pullRequest.number),
          data: pullRequestData,
        });
      },
    });
    const { pullRequest } = data!.createPullRequest;
    return { ...pullRequest, head: { sha: pullRequest.headRefOid } };
  }

  async createBranch(branchName: string, sha: string) {
    const owner = this.repoOwner;
    const name = this.repoName;
    const repository = await this.getRepository(owner, name);
    const { data } = await this.mutate({
      mutation: mutations.createBranch,
      variables: {
        createRefInput: {
          name: this.getBranchQualifiedName(branchName),
          oid: sha,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { branch } = mutationResult!.createRef;
        const branchData = { repository: { ...branch.repository, branch } };

        store.writeQuery({
          ...this.getBranchQuery(branchName, owner, name),
          data: branchData,
        });
      },
    });
    const { branch } = data!.createRef;
    return { ...branch, ref: `${branch.prefix}${branch.name}` };
  }

  async createBranchAndPullRequest(branchName: string, sha: string, title: string) {
    const owner = this.originRepoOwner;
    const name = this.originRepoName;
    const repository = await this.getRepository(owner, name);
    const { data } = await this.mutate({
      mutation: mutations.createBranchAndPullRequest,
      variables: {
        createRefInput: {
          name: this.getBranchQualifiedName(branchName),
          oid: sha,
          repositoryId: repository.id,
        },
        createPullRequestInput: {
          baseRefName: this.branch,
          body: DEFAULT_PR_BODY,
          title,
          headRefName: branchName,
          repositoryId: repository.id,
        },
      },
      update: (store, { data: mutationResult }) => {
        const { branch } = mutationResult!.createRef;
        const { pullRequest } = mutationResult!.createPullRequest;
        const branchData = { repository: { ...branch.repository, branch } };
        const pullRequestData = {
          repository: { ...pullRequest.repository, branch },
          origin: { ...pullRequest.repository, pullRequest },
        };

        store.writeQuery({
          ...this.getBranchQuery(branchName, owner, name),
          data: branchData,
        });

        store.writeQuery({
          ...this.getPullRequestAndBranchQuery(branchName, pullRequest.number),
          data: pullRequestData,
        });
      },
    });
    const { pullRequest } = data!.createPullRequest;
    return transformPullRequest(pullRequest) as unknown as Octokit.PullsCreateResponse;
  }

  async getFileSha(path: string, { repoURL = this.repoURL, branch = this.branch } = {}) {
    const { owner, name } = this.getOwnerAndNameFromRepoUrl(repoURL);
    const { data } = await this.query({
      query: queries.fileSha,
      variables: { owner, name, expression: `${branch}:${path}` },
    });

    if (data.repository.file) {
      return data.repository.file.sha;
    }
    throw new APIError('Not Found', 404, API_NAME);
  }
}
