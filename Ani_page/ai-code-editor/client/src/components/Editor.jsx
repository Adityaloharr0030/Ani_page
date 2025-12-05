import React, { useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { sql } from '@codemirror/lang-sql';
import { json } from '@codemirror/lang-json';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';

const getLanguageExtension = (language) => {
  const langMap = {
    javascript: javascript(),
    html: html(),
    css: css(),
    sql: sql(),
    json: json(),
    markdown: markdown()
  };
  return langMap[language] || javascript();
};

export default function Editor({ value, onChange, language = 'javascript', theme = 'dark' }) {
  return (
    <div className="editor">
      <CodeMirror
        value={value}
        height="100%"
        theme={theme === 'dark' ? oneDark : 'light'}
        extensions={[getLanguageExtension(language)]}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
          foldKeymap: true,
          completionKeymap: true,
          lintKeymap: true
        }}
      />
    </div>
  );
}

