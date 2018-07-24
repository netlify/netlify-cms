import { registerBackend, registerWidget, registerEditorComponent } from 'Lib/registry';
import { GitHubBackend } from 'netlify-cms-backend-github';
import { GitLabBackend } from 'netlify-cms-backend-gitlab';
import { GitGatewayBackend } from 'netlify-cms-backend-git-gateway';
import { TestBackend } from 'netlify-cms-backend-test';
import { BooleanControl } from 'netlify-cms-widget-boolean';
import { StringControl, StringPreview } from 'netlify-cms-widget-string';
// import { NumberControl, NumberPreview } from 'netlify-cms-widget-number';
// import { TextControl, TextPreview } from 'netlify-cms-widget-text';
// import { ImageControl, ImagePreview } from 'netlify-cms-widget-image';
// import { FileControl, FilePreview } from 'netlify-cms-widget-file';
// import { DateControl, DatePreview } from 'netlify-cms-widget-date';
// import { DateTimeControl, DateTimePreview } from 'netlify-cms-widget-datetime';
// import { SelectControl, SelectPreview } from 'netlify-cms-widget-select';
// import { MarkdownControl, MarkdownPreview } from 'netlify-cms-widget-markdown';
// import { ListControl, ListPreview } from 'netlify-cms-widget-list';
// import { ObjectControl, ObjectPreview } from 'netlify-cms-widget-object';
// import { RelationControl, RelationPreview } from 'netlify-cms-widget-relation';
import image from 'netlify-cms-editor-component-image';

registerBackend('git-gateway', GitGatewayBackend);
registerBackend('github', GitHubBackend);
registerBackend('gitlab', GitLabBackend);
registerBackend('test-repo', TestBackend);
registerWidget('boolean', BooleanControl);
registerWidget('string', StringControl, StringPreview);
// registerWidget('text', TextControl, TextPreview);
// registerWidget('number', NumberControl, NumberPreview);
// registerWidget('list', ListControl, ListPreview);
// registerWidget('markdown', MarkdownControl, MarkdownPreview);
// registerWidget('image', ImageControl, ImagePreview);
// registerWidget('file', FileControl, FilePreview);
// registerWidget('date', DateControl, DatePreview);
// registerWidget('datetime', DateTimeControl, DateTimePreview);
// registerWidget('select', SelectControl, SelectPreview);
// registerWidget('object', ObjectControl, ObjectPreview);
// registerWidget('relation', RelationControl, RelationPreview);
registerEditorComponent(image);
