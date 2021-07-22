import PropTypes from 'prop-types';
import React from 'react';
import { hot } from 'react-hot-loader';
import { translate } from 'react-polyglot';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styled from '@emotion/styled';
import { connect } from 'react-redux';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Notifs } from 'redux-notifications';
import TopBarProgress from 'react-topbar-progress-indicator';
import { Loader, colors } from 'netlify-cms-ui-default';

import { loginUser, logoutUser } from '../../actions/auth';
import { currentBackend } from '../../backend';
import { createNewEntry } from '../../actions/collections';
import { openMediaLibrary } from '../../actions/mediaLibrary';
import MediaLibrary from '../MediaLibrary/MediaLibrary';
import { Toast } from '../UI';
import { history } from '../../routing/history';
import { SIMPLE, EDITORIAL_WORKFLOW } from '../../constants/publishModes';
import Collection from '../Collection/Collection';
import Workflow from '../Workflow/Workflow';
import Editor from '../Editor/Editor';
import NotFoundPage from './NotFoundPage';
import Header from './Header';

TopBarProgress.config({
  barColors: {
    0: colors.active,
    '1.0': colors.active,
  },
  shadowBlur: 0,
  barThickness: 2,
});

const AppMainContainer = styled.div`
  min-width: 800px;
  max-width: 1440px;
  margin: 0 auto;
`;

const ErrorContainer = styled.div`
  margin: 20px;
`;

const ErrorCodeBlock = styled.pre`
  margin-left: 20px;
  font-size: 15px;
  line-height: 1.5;
`;

function getDefaultPath(collections) {
  const first = collections.filter(collection => collection.get('hide') !== true).first();
  if (first) {
    return `/collections/${first.get('name')}`;
  } else {
    throw new Error('Could not find a non hidden collection');
  }
}

function RouteInCollection({ collections, render, ...props }) {
  const defaultPath = getDefaultPath(collections);
  return (
    <Route
      {...props}
      render={routeProps => {
        const collectionExists = collections.get(routeProps.match.params.name);
        return collectionExists ? render(routeProps) : <Redirect to={defaultPath} />;
      }}
    />
  );
}

class App extends React.Component {
  static propTypes = {
    auth: PropTypes.object.isRequired,
    config: PropTypes.object.isRequired,
    collections: ImmutablePropTypes.map.isRequired,
    loginUser: PropTypes.func.isRequired,
    logoutUser: PropTypes.func.isRequired,
    user: PropTypes.object,
    isFetching: PropTypes.bool.isRequired,
    publishMode: PropTypes.oneOf([SIMPLE, EDITORIAL_WORKFLOW]),
    siteId: PropTypes.string,
    useMediaLibrary: PropTypes.bool,
    openMediaLibrary: PropTypes.func.isRequired,
    showMediaButton: PropTypes.bool,
    t: PropTypes.func.isRequired,
  };

  configError(config) {
    const t = this.props.t;
    return (
      <ErrorContainer>
        <h1>{t('app.app.errorHeader')}</h1>
        <div>
          <strong>{t('app.app.configErrors')}:</strong>
          <ErrorCodeBlock>{config.error}</ErrorCodeBlock>
          <span>{t('app.app.checkConfigYml')}</span>
        </div>
      </ErrorContainer>
    );
  }

  handleLogin(credentials) {
    this.props.loginUser(credentials);
  }

  authenticating() {
    const { auth, t } = this.props;
    const backend = currentBackend(this.props.config);

    if (backend == null) {
      return (
        <div>
          <h1>{t('app.app.waitingBackend')}</h1>
        </div>
      );
    }

    return (
      <div>
        <Notifs CustomComponent={Toast} />
        {React.createElement(backend.authComponent(), {
          onLogin: this.handleLogin.bind(this),
          error: auth.error,
          inProgress: auth.isFetching,
          siteId: this.props.config.backend.site_domain,
          base_url: this.props.config.backend.base_url,
          authEndpoint: this.props.config.backend.auth_endpoint,
          config: this.props.config,
          clearHash: () => history.replace('/'),
          t,
        })}
      </div>
    );
  }

  handleLinkClick(event, handler, ...args) {
    event.preventDefault();
    handler(...args);
  }

  render() {
    const {
      user,
      config,
      collections,
      logoutUser,
      isFetching,
      publishMode,
      useMediaLibrary,
      openMediaLibrary,
      t,
      showMediaButton,
    } = this.props;

    if (config === null) {
      return null;
    }

    if (config.error) {
      return this.configError(config);
    }

    if (config.isFetching) {
      return <Loader active>{t('app.app.loadingConfig')}</Loader>;
    }

    if (user == null) {
      return this.authenticating(t);
    }

    const defaultPath = getDefaultPath(collections);
    const hasWorkflow = publishMode === EDITORIAL_WORKFLOW;

    return (
      <>
        <Notifs CustomComponent={Toast} />
        <Header
          user={user}
          collections={collections}
          onCreateEntryClick={createNewEntry}
          onLogoutClick={logoutUser}
          openMediaLibrary={openMediaLibrary}
          hasWorkflow={hasWorkflow}
          displayUrl={config.display_url}
          logoUrl={config.logo_url}
          isTestRepo={config.backend.name === 'test-repo'}
          showMediaButton={showMediaButton}
        />
        <AppMainContainer>
          {isFetching && <TopBarProgress />}
          <Switch>
            <Redirect exact from="/" to={defaultPath} />
            <Redirect exact from="/search/" to={defaultPath} />
            <RouteInCollection
              exact
              collections={collections}
              path="/collections/:name/search/"
              render={({ match }) => <Redirect to={`/collections/${match.params.name}`} />}
            />
            <Redirect
              // This happens on Identity + Invite Only + External Provider email not matching
              // the registered user
              from="/error=access_denied&error_description=Signups+not+allowed+for+this+instance"
              to={defaultPath}
            />
            {hasWorkflow ? <Route path="/workflow" component={Workflow} /> : null}
            <RouteInCollection
              exact
              collections={collections}
              path="/collections/:name"
              render={props => <Collection {...props} />}
            />
            <RouteInCollection
              path="/collections/:name/new"
              collections={collections}
              render={props => <Editor {...props} newRecord />}
            />
            <RouteInCollection
              path="/collections/:name/entries/*"
              collections={collections}
              render={props => <Editor {...props} />}
            />
            <RouteInCollection
              path="/collections/:name/search/:searchTerm"
              collections={collections}
              render={props => <Collection {...props} isSearchResults isSingleSearchResult />}
            />
            <RouteInCollection
              collections={collections}
              path="/collections/:name/filter/:filterTerm*"
              render={props => <Collection {...props} />}
            />
            <Route
              path="/search/:searchTerm"
              render={props => <Collection {...props} isSearchResults />}
            />
            <RouteInCollection
              path="/edit/:name/:entryName"
              collections={collections}
              render={({ match }) => {
                const { name, entryName } = match.params;
                return <Redirect to={`/collections/${name}/entries/${entryName}`} />;
              }}
            />
            <Route component={NotFoundPage} />
          </Switch>
          {useMediaLibrary ? <MediaLibrary /> : null}
        </AppMainContainer>
      </>
    );
  }
}

function mapStateToProps(state) {
  const { auth, config, collections, globalUI, mediaLibrary } = state;
  const user = auth.user;
  const isFetching = globalUI.isFetching;
  const publishMode = config.publish_mode;
  const useMediaLibrary = !mediaLibrary.get('externalLibrary');
  const showMediaButton = mediaLibrary.get('showMediaButton');
  return {
    auth,
    config,
    collections,
    user,
    isFetching,
    publishMode,
    showMediaButton,
    useMediaLibrary,
  };
}

const mapDispatchToProps = {
  openMediaLibrary,
  loginUser,
  logoutUser,
};

export default hot(module)(connect(mapStateToProps, mapDispatchToProps)(translate()(App)));
