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

const toolbarPlugin = createToolbarPlugin({
  theme: {
    toolbarStyles: { toolbar: 'ms-rt-toolbar' },
    buttonStyles: {
      button: 'ms-rt-btn',
      buttonWrapper: 'ms-rt-btn-wrapper',
      active: 'ms-rt-btn-active',
    },
  },
});
const { Toolbar } = toolbarPlugin;
const plugins = [toolbarPlugin];

interface RichTextEditorProps {
  editorState: EditorState;
  setEditorState: (editorState: EditorState) => void;
  height?: number | string;
  hideToolbar?: boolean;
  placeholder?: string;
}

const RichTextEditor = ({
  editorState,
  setEditorState,
  height = '25rem',
  hideToolbar = false,
  placeholder,
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
    <div style={{ height, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          cursor: 'text',
          background: colors.surface,
          color: colors.text,
          flex: 1,
          minHeight: 0,
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
          placeholder={placeholder}
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
