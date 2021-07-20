const {
  notifications,
  workflowStatus,
  editorStatus,
  publishTypes,
  colorError,
  colorNormal,
  textColorNormal,
} = require('./constants');

function login(user) {
  cy.viewport(1200, 1200);
  if (user) {
    cy.visit('/', {
      onBeforeLoad: () => {
        // https://github.com/cypress-io/cypress/issues/1208
        window.indexedDB.deleteDatabase('localforage');
        window.localStorage.setItem('netlify-cms-user', JSON.stringify(user));
        if (user.netlifySiteURL) {
          window.localStorage.setItem('netlifySiteURL', user.netlifySiteURL);
        }
      },
    });
    if (user.netlifySiteURL && user.email && user.password) {
      cy.get('input[name="email"]')
        .clear()
        .type(user.email);
      cy.get('input[name="password"]')
        .clear()
        .type(user.password);
      cy.contains('button', 'Login').click();
    }
  } else {
    cy.visit('/');
    cy.contains('button', 'Login').click();
  }
  cy.contains('a', 'New Post');
}

function assertNotification(message) {
  cy.get('.notif__container').within(() => {
    cy.contains(message);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
    cy.contains(message).invoke('hide');
  });
}

function assertColorOn(cssProperty, color, opts) {
  if (opts.type && opts.type === 'label') {
    (opts.scope ? opts.scope : cy).contains('label', opts.label).should($el => {
      expect($el).to.have.css(cssProperty, color);
    });
  } else if (opts.type && opts.type === 'field') {
    const assertion = $el => expect($el).to.have.css(cssProperty, color);
    if (opts.isMarkdown) {
      (opts.scope ? opts.scope : cy)
        .contains('label', opts.label)
        .next()
        .children()
        .eq(0)
        .children()
        .eq(1)
        .should(assertion);
    } else {
      (opts.scope ? opts.scope : cy)
        .contains('label', opts.label)
        .next()
        .should(assertion);
    }
  } else if (opts.el) {
    opts.el.should($el => {
      expect($el).to.have.css(cssProperty, color);
    });
  }
}

function exitEditor() {
  cy.contains('a', 'Writing in').click();
}

function goToWorkflow() {
  cy.contains('a', 'Workflow').click();
}

function goToCollections() {
  cy.contains('a', 'Content').click();
}

function goToMediaLibrary() {
  cy.contains('button', 'Media').click();
}

function assertUnpublishedEntryInEditor() {
  cy.contains('button', 'Delete unpublished entry');
}

function assertPublishedEntryInEditor() {
  cy.contains('button', 'Delete published entry');
}

function assertUnpublishedChangesInEditor() {
  cy.contains('button', 'Delete unpublished changes');
}

function goToEntry(entry) {
  goToCollections();
  cy.get('a h2')
    .first()
    .contains(entry.title)
    .click();
}

function updateWorkflowStatus({ title }, fromColumnHeading, toColumnHeading) {
  cy.contains('h2', fromColumnHeading)
    .parent()
    .contains('a', title)
    .drag();
  cy.contains('h2', toColumnHeading)
    .parent()
    .drop();
  assertNotification(notifications.updated);
}

function publishWorkflowEntry({ title }, timeout) {
  cy.contains('h2', workflowStatus.ready, { timeout })
    .parent()
    .within(() => {
      cy.contains('a', title)
        .parent()
        .within(() => {
          cy.contains('button', 'Publish new entry').click({ force: true });
        });
    });
  assertNotification(notifications.published);
}

function deleteWorkflowEntry({ title }) {
  cy.contains('a', title)
    .parent()
    .within(() => {
      cy.contains('button', 'Delete new entry').click({ force: true });
    });

  assertNotification(notifications.deletedUnpublished);
}

const STATUS_BUTTON_TEXT = 'Status:';

function assertWorkflowStatusInEditor(status) {
  cy.contains('[role="button"]', STATUS_BUTTON_TEXT).as('setStatusButton');
  cy.get('@setStatusButton')
    .parent()
    .within(() => {
      cy.get('@setStatusButton').click();
      cy.contains('[role="menuitem"] span', status)
        .parent()
        .within(() => {
          cy.get('svg');
        });
      cy.get('@setStatusButton').click();
    });
}

function assertPublishedEntry(entry) {
  if (Array.isArray(entry)) {
    const entries = entry.reverse();
    cy.get('a h2').then(els => {
      cy.wrap(els.slice(0, entries.length)).each((el, idx) => {
        cy.wrap(el).contains(entries[idx].title);
      });
    });
  } else {
    cy.get('a h2')
      .first()
      .contains(entry.title);
  }
}

function deleteEntryInEditor() {
  cy.contains('button', 'Delete').click();
  assertNotification(notifications.deletedUnpublished);
}

function assertOnCollectionsPage() {
  cy.url().should('contain', '/#/collections/posts');
}

function assertEntryDeleted(entry) {
  cy.get('body').then($body => {
    const entriesHeaders = $body.find('a h2');
    if (entriesHeaders.length > 0) {
      if (Array.isArray(entry)) {
        const titles = entry.map(e => e.title);
        cy.get('a h2').each(el => {
          expect(titles).not.to.include(el.text());
        });
      } else {
        cy.get('a h2').each(el => {
          expect(entry.title).not.to.equal(el.text());
        });
      }
    }
  });
}

function assertWorkflowStatus({ title }, status) {
  cy.contains('h2', status)
    .parent()
    .contains('a', title);
}

function updateWorkflowStatusInEditor(newStatus) {
  selectDropdownItem(STATUS_BUTTON_TEXT, newStatus);
  assertNotification(notifications.updated);
}

function publishEntryInEditor(publishType) {
  selectDropdownItem('Publish', publishType);
  assertNotification(notifications.published);
}

function publishAndCreateNewEntryInEditor() {
  selectDropdownItem('Publish', publishTypes.publishAndCreateNew);
  assertNotification(notifications.published);
  cy.url().should('eq', `http://localhost:8080/#/collections/posts/new`);
  cy.get('[id^="title-field"]').should('have.value', '');
}

function publishAndDuplicateEntryInEditor(entry) {
  selectDropdownItem('Publish', publishTypes.publishAndDuplicate);
  assertNotification(notifications.published);
  cy.url().should('eq', `http://localhost:8080/#/collections/posts/new`);
  cy.get('[id^="title-field"]').should('have.value', entry.title);
}

function selectDropdownItem(label, item) {
  cy.contains('[role="button"]', label).as('dropDownButton');
  cy.get('@dropDownButton')
    .parent()
    .within(() => {
      cy.get('@dropDownButton').click();
      cy.contains('[role="menuitem"] span', item).click();
    });
}

function flushClockAndSave() {
  cy.clock().then(clock => {
    // some input fields are de-bounced thus require advancing the clock
    if (clock) {
      // https://github.com/cypress-io/cypress/issues/1273
      clock.tick(150);
      clock.tick(150);
      // eslint-disable-next-line cypress/no-unnecessary-waiting
      cy.wait(500);
    }

    cy.contains('button', 'Save').click();
    assertNotification(notifications.saved);
  });
}

function populateEntry(entry, onDone = flushClockAndSave) {
  const keys = Object.keys(entry);
  for (const key of keys) {
    const value = entry[key];
    if (key === 'body') {
      cy.getMarkdownEditor()
        .first()
        .click()
        .clear({ force: true })
        .type(value, { force: true });
    } else {
      cy.get(`[id^="${key}-field"]`)
        .first()
        .clear({ force: true });
      cy.get(`[id^="${key}-field"]`)
        .first()
        .type(value, { force: true });
    }
  }

  onDone();
}

function newPost() {
  cy.contains('a', 'New Post').click();
}

function createPost(entry) {
  newPost();
  populateEntry(entry);
}

function createPostAndExit(entry) {
  createPost(entry);
  exitEditor();
}

function advanceClock(clock) {
  if (clock) {
    // https://github.com/cypress-io/cypress/issues/1273
    clock.tick(150);
    clock.tick(150);
    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
  }
}

function publishEntry({ createNew = false, duplicate = false } = {}) {
  cy.clock().then(clock => {
    // some input fields are de-bounced thus require advancing the clock
    advanceClock(clock);

    if (createNew) {
      advanceClock(clock);
      selectDropdownItem('Publish', publishTypes.publishAndCreateNew);
      advanceClock(clock);
    } else if (duplicate) {
      advanceClock(clock);
      selectDropdownItem('Publish', publishTypes.publishAndDuplicate);
      advanceClock(clock);
    } else {
      selectDropdownItem('Publish', publishTypes.publishNow);
    }

    // eslint-disable-next-line cypress/no-unnecessary-waiting
    cy.wait(500);
  });
}

function createPostAndPublish(entry) {
  newPost();
  populateEntry(entry, publishEntry);
  exitEditor();
}

function createPostPublishAndCreateNew(entry) {
  newPost();
  populateEntry(entry, () => publishEntry({ createNew: true }));
  cy.url().should('eq', `http://localhost:8080/#/collections/posts/new`);
  cy.get('[id^="title-field"]').should('have.value', '');

  exitEditor();
}

function createPostPublishAndDuplicate(entry) {
  newPost();
  populateEntry(entry, () => publishEntry({ duplicate: true }));
  cy.url().should('eq', `http://localhost:8080/#/collections/posts/new`);
  cy.get('[id^="title-field"]').should('have.value', entry.title);

  exitEditor();
}

function editPostAndPublish(entry1, entry2) {
  goToEntry(entry1);
  cy.contains('button', 'Delete entry');
  cy.contains('span', 'Published');

  populateEntry(entry2, publishEntry);
  // existing entry slug should remain the same after save
  cy.url().should(
    'eq',
    `http://localhost:8080/#/collections/posts/entries/1970-01-01-${entry1.title
      .toLowerCase()
      .replace(/\s/, '-')}`,
  );
}

function editPostPublishAndCreateNew(entry1, entry2) {
  goToEntry(entry1);
  cy.contains('button', 'Delete entry');
  cy.contains('span', 'Published');

  populateEntry(entry2, () => publishEntry({ createNew: true }));
  cy.url().should('eq', `http://localhost:8080/#/collections/posts/new`);
  cy.get('[id^="title-field"]').should('have.value', '');
}

function editPostPublishAndDuplicate(entry1, entry2) {
  goToEntry(entry1);
  cy.contains('button', 'Delete entry');
  cy.contains('span', 'Published');

  populateEntry(entry2, () => publishEntry({ duplicate: true }));
  cy.url().should('eq', `http://localhost:8080/#/collections/posts/new`);
  cy.get('[id^="title-field"]').should('have.value', entry2.title);
}

function duplicatePostAndPublish(entry1) {
  goToEntry(entry1);
  cy.contains('button', 'Delete entry');
  selectDropdownItem('Published', 'Duplicate');
  publishEntry();

  cy.url().should(
    'eq',
    `http://localhost:8080/#/collections/posts/entries/1970-01-01-${entry1.title
      .toLowerCase()
      .replace(/\s/, '-')}-1`,
  );
}

function updateExistingPostAndExit(fromEntry, toEntry) {
  goToWorkflow();
  cy.contains('h2', fromEntry.title)
    .parent()
    .click({ force: true });
  populateEntry(toEntry);
  exitEditor();
  goToWorkflow();
  cy.contains('h2', toEntry.title);
}

function unpublishEntry(entry) {
  goToCollections();
  cy.contains('h2', entry.title)
    .parent()
    .click({ force: true });
  selectDropdownItem('Published', 'Unpublish');
  assertNotification(notifications.unpublished);
  goToWorkflow();
  assertWorkflowStatus(entry, workflowStatus.ready);
}

function duplicateEntry(entry) {
  selectDropdownItem('Published', 'Duplicate');
  cy.url().should('contain', '/#/collections/posts/new');
  flushClockAndSave();
  updateWorkflowStatusInEditor(editorStatus.ready);
  publishEntryInEditor(publishTypes.publishNow);
  exitEditor();
  cy.get('a h2').should($h2s => {
    expect($h2s.eq(0)).to.contain(entry.title);
    expect($h2s.eq(1)).to.contain(entry.title);
  });
}

function validateObjectFields({ limit, author }) {
  cy.get('a[href^="#/collections/settings"]').click();
  cy.get('a[href^="#/collections/settings/entries/general"]').click();
  cy.get('input[type=number]').type(limit);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);
  assertFieldErrorStatus('Default Author', colorError);
  cy.contains('label', 'Default Author').click();
  cy.focused().type(author);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.saved);
  assertFieldErrorStatus('Default Author', colorNormal);
}

function validateNestedObjectFields({ limit, author }) {
  cy.get('a[href^="#/collections/settings"]').click();
  cy.get('a[href^="#/collections/settings/entries/general"]').click();
  cy.contains('label', 'Default Author').click();
  cy.focused().type(author);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);
  cy.get('input[type=number]').type(limit + 1);
  cy.contains('button', 'Save').click();
  assertFieldValidationError(notifications.validation.range);
  cy.get('input[type=number]')
    .clear()
    .type(-1);
  cy.contains('button', 'Save').click();
  assertFieldValidationError(notifications.validation.range);
  cy.get('input[type=number]')
    .clear()
    .type(limit);
  cy.contains('button', 'Save').click();
  assertNotification(notifications.saved);
}

function validateListFields({ name, description }) {
  cy.get('a[href^="#/collections/settings"]').click();
  cy.get('a[href^="#/collections/settings/entries/authors"]').click();
  cy.contains('button', 'Add').click();
  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);
  assertFieldErrorStatus('Authors', colorError);
  cy.get('div[class*=ListControl]')
    .eq(2)
    .as('listControl');
  assertFieldErrorStatus('Name', colorError, { scope: cy.get('@listControl') });
  assertColorOn('background-color', colorError, {
    type: 'label',
    label: 'Description',
    scope: cy.get('@listControl'),
    isMarkdown: true,
  });
  assertListControlErrorStatus([colorError, colorError], '@listControl');
  cy.get('input')
    .eq(2)
    .type(name);
  cy.getMarkdownEditor()
    .eq(2)
    .type(description);
  flushClockAndSave();
  assertNotification(notifications.saved);
  assertFieldErrorStatus('Authors', colorNormal);
}

function validateNestedListFields() {
  cy.get('a[href^="#/collections/settings"]').click();
  cy.get('a[href^="#/collections/settings/entries/hotel_locations"]').click();

  // add first city list item
  cy.contains('button', 'hotel locations').click();
  cy.contains('button', 'cities').click();
  cy.contains('label', 'City')
    .next()
    .type('Washington DC');
  cy.contains('label', 'Number of Hotels in City')
    .next()
    .type('5');
  cy.contains('button', 'city locations').click();

  // add second city list item
  cy.contains('button', 'cities').click();
  cy.contains('label', 'Cities')
    .next()
    .find('div[class*=ListControl]')
    .eq(2)
    .as('secondCitiesListControl');
  cy.get('@secondCitiesListControl')
    .contains('label', 'City')
    .next()
    .type('Boston');
  cy.get('@secondCitiesListControl')
    .contains('button', 'city locations')
    .click();

  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);

  // assert on fields
  assertFieldErrorStatus('Hotel Locations', colorError);
  assertFieldErrorStatus('Cities', colorError);
  assertFieldErrorStatus('City', colorNormal);
  assertFieldErrorStatus('City', colorNormal, { scope: cy.get('@secondCitiesListControl') });
  assertFieldErrorStatus('Number of Hotels in City', colorNormal);
  assertFieldErrorStatus('Number of Hotels in City', colorError, {
    scope: cy.get('@secondCitiesListControl'),
  });
  assertFieldErrorStatus('City Locations', colorError);
  assertFieldErrorStatus('City Locations', colorError, {
    scope: cy.get('@secondCitiesListControl'),
  });
  assertFieldErrorStatus('Hotel Name', colorError);
  assertFieldErrorStatus('Hotel Name', colorError, { scope: cy.get('@secondCitiesListControl') });

  // list control aliases
  cy.contains('label', 'Hotel Locations')
    .next()
    .find('div[class*=ListControl]')
    .first()
    .as('hotelLocationsListControl');
  cy.contains('label', 'Cities')
    .next()
    .find('div[class*=ListControl]')
    .eq(0)
    .as('firstCitiesListControl');
  cy.contains('label', 'City Locations')
    .next()
    .find('div[class*=ListControl]')
    .eq(0)
    .as('firstCityLocationsListControl');
  cy.contains('label', 'Cities')
    .next()
    .find('div[class*=ListControl]')
    .eq(3)
    .as('secondCityLocationsListControl');

  // assert on list controls
  assertListControlErrorStatus([colorError, colorError], '@hotelLocationsListControl');
  assertListControlErrorStatus([colorError, colorError], '@firstCitiesListControl');
  assertListControlErrorStatus([colorError, colorError], '@secondCitiesListControl');
  assertListControlErrorStatus([colorError, colorError], '@firstCityLocationsListControl');
  assertListControlErrorStatus([colorError, colorError], '@secondCityLocationsListControl');

  cy.contains('label', 'Hotel Name')
    .next()
    .type('The Ritz Carlton');
  cy.contains('button', 'Save').click();
  assertNotification(notifications.error.missingField);
  assertListControlErrorStatus([colorNormal, textColorNormal], '@firstCitiesListControl');

  // fill out rest of form and save
  cy.get('@secondCitiesListControl')
    .contains('label', 'Number of Hotels in City')
    .type(3);
  cy.get('@secondCitiesListControl')
    .contains('label', 'Hotel Name')
    .type('Grand Hyatt');
  cy.contains('label', 'Country')
    .next()
    .type('United States');
  flushClockAndSave();
  assertNotification(notifications.saved);
}

function validateObjectFieldsAndExit(setting) {
  validateObjectFields(setting);
  exitEditor();
}

function validateNestedObjectFieldsAndExit(setting) {
  validateNestedObjectFields(setting);
  exitEditor();
}

function validateListFieldsAndExit(setting) {
  validateListFields(setting);
  exitEditor();
}

function validateNestedListFieldsAndExit(setting) {
  validateNestedListFields(setting);
  exitEditor();
}

function assertFieldValidationError({ message, fieldLabel }) {
  cy.contains('label', fieldLabel)
    .siblings('ul[class*=ControlErrorsList]')
    .contains(message);
  assertFieldErrorStatus(fieldLabel, colorError);
}

function assertFieldErrorStatus(label, color, opts = { isMarkdown: false }) {
  assertColorOn('background-color', color, {
    type: 'label',
    label,
    scope: opts.scope,
    isMarkdown: opts.isMarkdown,
  });
  assertColorOn('border-color', color, {
    type: 'field',
    label,
    scope: opts.scope,
    isMarkdown: opts.isMarkdown,
  });
}

function assertListControlErrorStatus(colors = ['', ''], alias) {
  cy.get(alias).within(() => {
    // assert list item border has correct color
    assertColorOn('border-right-color', colors[0], {
      el: cy
        .root()
        .children()
        .eq(2),
    });
    // collapse list item
    cy.get('button[class*=TopBarButton-button]')
      .first()
      .click();
    // assert list item label text has correct color
    assertColorOn('color', colors[1], { el: cy.get('div[class*=NestedObjectLabel]').first() });
    // uncollapse list item
    cy.get('button[class*=TopBarButton-button]')
      .first()
      .click();
  });
}

module.exports = {
  login,
  createPost,
  createPostAndExit,
  createPostAndPublish,
  updateExistingPostAndExit,
  exitEditor,
  goToWorkflow,
  goToCollections,
  goToMediaLibrary,
  updateWorkflowStatus,
  publishWorkflowEntry,
  deleteWorkflowEntry,
  assertWorkflowStatusInEditor,
  assertPublishedEntry,
  deleteEntryInEditor,
  assertOnCollectionsPage,
  assertEntryDeleted,
  assertWorkflowStatus,
  updateWorkflowStatusInEditor,
  validateObjectFieldsAndExit,
  validateNestedObjectFieldsAndExit,
  validateListFieldsAndExit,
  validateNestedListFieldsAndExit,
  unpublishEntry,
  publishEntryInEditor,
  duplicateEntry,
  newPost,
  populateEntry,
  goToEntry,
  publishEntry,
  createPostPublishAndCreateNew,
  createPostPublishAndDuplicate,
  editPostAndPublish,
  editPostPublishAndCreateNew,
  editPostPublishAndDuplicate,
  duplicatePostAndPublish,
  publishAndCreateNewEntryInEditor,
  publishAndDuplicateEntryInEditor,
  assertNotification,
  assertFieldValidationError,
  flushClockAndSave,
  assertPublishedEntryInEditor,
  assertUnpublishedEntryInEditor,
  assertUnpublishedChangesInEditor,
};
