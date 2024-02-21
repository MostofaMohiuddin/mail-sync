import { useRef, useState } from 'react';

import {
  BoldButton,
  ItalicButton,
  UnderlineButton,
  CodeButton,
  UnorderedListButton,
  OrderedListButton,
  BlockquoteButton,
  CodeBlockButton,
} from '@draft-js-plugins/buttons';
import Editor, { createEditorStateWithText } from '@draft-js-plugins/editor';
import createToolbarPlugin from '@draft-js-plugins/static-toolbar';
import { EditorState } from 'draft-js';
import { stateToHTML } from 'draft-js-export-html';

const toolbarPlugin = createToolbarPlugin();
const { Toolbar } = toolbarPlugin;
const plugins = [toolbarPlugin];

const RichTextEditor = ({ setHtmlValue }: { setHtmlValue: (htmlContent: string) => void }) => {
  const [editorState, setEditorState] = useState<EditorState>(createEditorStateWithText(''));
  const editorRef = useRef<Editor>(null);

  const onChange = (newEditorState: EditorState) => {
    setHtmlValue(stateToHTML(newEditorState.getCurrentContent()));
    setEditorState(newEditorState);
  };

  const focus = () => {
    editorRef.current?.focus();
  };

  return (
    <div>
      <div
        style={{
          border: '1px solid #ddd',
          cursor: 'text',
          // borderRadius: '8px 8px 0 0',
          marginBottom: '',
          background: ' #fefefe',
          height: '25rem',
          overflow: 'scroll',
          padding: '8px',
        }}
        onClick={focus}
      >
        <Editor
          editorState={editorState}
          onChange={onChange}
          plugins={plugins}
          ref={editorRef}
          formatPastedText={(text, html) => {
            console.log('text', text);
            console.log('html', html);

            // if (!html) {
            //   return {
            //     text: text,
            //     html: text,
            //   };
            // }
            return { html: html, text: text };
          }}
        />
      </div>
      <Toolbar>
        {(externalProps) => (
          <>
            <BoldButton {...externalProps} />
            <ItalicButton {...externalProps} />
            <UnderlineButton {...externalProps} />
            <CodeButton {...externalProps} />
            {/* <Separator {...externalProps} /> */}
            <UnorderedListButton {...externalProps} />
            <OrderedListButton {...externalProps} />
            <BlockquoteButton {...externalProps} />
            <CodeBlockButton {...externalProps} />
          </>
        )}
      </Toolbar>
    </div>
  );
};

export default RichTextEditor;
