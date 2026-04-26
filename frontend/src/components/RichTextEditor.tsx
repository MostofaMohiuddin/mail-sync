import { useRef } from 'react';

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
import Editor from '@draft-js-plugins/editor';
import createToolbarPlugin from '@draft-js-plugins/static-toolbar';
import { EditorState } from 'draft-js';

import { useThemeMode } from '../hooks/useThemeMode';

const toolbarPlugin = createToolbarPlugin();
const { Toolbar } = toolbarPlugin;
const plugins = [toolbarPlugin];

interface RichTextEditorProps {
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
  height?: number | string;
  hideToolbar?: boolean;
}

const RichTextEditor = ({
  editorState,
  setEditorState,
  height = '25rem',
  hideToolbar = false,
}: RichTextEditorProps) => {
  const editorRef = useRef<Editor>(null);
  const { colors } = useThemeMode();

  const onChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
  };

  const focus = () => {
    editorRef.current?.focus();
  };

  return (
    <div>
      <div
        style={{
          cursor: 'text',
          background: colors.surface,
          color: colors.text,
          height,
          overflow: 'auto',
          padding: '12px 14px',
        }}
        onClick={focus}
      >
        <Editor
          editorState={editorState}
          onChange={onChange}
          plugins={plugins}
          ref={editorRef}
          formatPastedText={(text, html) => ({ html, text })}
        />
      </div>
      {!hideToolbar && (
        <Toolbar>
          {(externalProps) => (
            <>
              <BoldButton {...externalProps} />
              <ItalicButton {...externalProps} />
              <UnderlineButton {...externalProps} />
              <CodeButton {...externalProps} />
              <UnorderedListButton {...externalProps} />
              <OrderedListButton {...externalProps} />
              <BlockquoteButton {...externalProps} />
              <CodeBlockButton {...externalProps} />
            </>
          )}
        </Toolbar>
      )}
    </div>
  );
};

export { Toolbar as RichTextToolbar };
export default RichTextEditor;
