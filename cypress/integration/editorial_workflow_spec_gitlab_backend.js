import fixture from './common/editorial_workflow';
import * as specUtils from './common/spec_utils';
import { entry1, entry2, entry3 } from './common/entries';

const backend = 'gitlab';

describe('GitLab Backend Editorial Workflow', () => {
  let taskResult = { data: {} };

  before(() => {
    specUtils.before(taskResult, { publish_mode: 'editorial_workflow' }, backend);
  });

  after(() => {
    specUtils.after(taskResult, backend);
  });

  beforeEach(() => {
    if (
      Cypress.mocha.getRunner().suite.ctx.currentTest.title ===
      'can change status on and publish multiple entries'
    ) {
      Cypress.mocha.getRunner().suite.ctx.currentTest.skip();
    }
    specUtils.beforeEach(taskResult, backend);
  });

  afterEach(() => {
    specUtils.afterEach(taskResult, backend);
  });

  fixture({
    entries: [entry1, entry2, entry3],
    getUser: () => taskResult.data.user,
  });
});
