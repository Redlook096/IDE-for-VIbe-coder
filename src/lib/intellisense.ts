import { Monaco } from '@monaco-editor/react';

export function setupIntelliSense(monaco: Monaco) {
  // Python completions
  monaco.languages.registerCompletionItemProvider('python', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [
        // Keywords
        ...['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'with', 'as', 'try', 'except', 'finally', 'raise', 'lambda', 'yield', 'async', 'await', 'pass', 'break', 'continue', 'True', 'False', 'None', 'self', '__init__'].map(k => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range
        })),
        // Built-ins
        ...['print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'list', 'dict', 'set', 'tuple', 'isinstance', 'type', 'open'].map(b => ({
          label: b,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: b + '($1)',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        })),
        // Snippets
        {
          label: 'def',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['def ${1:function_name}(${2:params}):', '\t${3:pass}'].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Function definition',
          range
        },
        {
          label: 'class',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: ['class ${1:ClassName}:', '\tdef __init__(self):', '\t\t${2:pass}'].join('\n'),
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Class definition',
          range
        }
      ];

      return { suggestions };
    }
  });

  // SQL completions
  monaco.languages.registerCompletionItemProvider('sql', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [
        ...['SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'INDEX', 'DISTINCT', 'AS', 'LIKE', 'IN', 'NOT IN', 'IS NULL', 'IS NOT NULL', 'LIMIT', 'OFFSET'].map(k => ({
          label: k,
          kind: monaco.languages.CompletionItemKind.Keyword,
          insertText: k,
          range
        })),
        ...['COUNT', 'SUM', 'AVG', 'MAX', 'MIN'].map(f => ({
          label: f,
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: f + '($1)',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range
        }))
      ];
      return { suggestions };
    }
  });

  // JS/TS Snippets (Monaco already provides keywords and symbols natively)
  const jsTsProvider = {
    provideCompletionItems: (model: any, position: any) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };

      const suggestions = [
        {
          label: 'arrow',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'const ${1:name} = (${2:params}) => {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Arrow function',
          range
        },
        {
          label: 'try',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: 'try {\n\t$1\n} catch (${2:error}) {\n\tconsole.error(${2:error});\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Try/Catch block',
          range
        }
      ];
      return { suggestions };
    }
  };

  monaco.languages.registerCompletionItemProvider('javascript', jsTsProvider);
  monaco.languages.registerCompletionItemProvider('typescript', jsTsProvider);
  
  // HTML Snippets
  monaco.languages.registerCompletionItemProvider('html', {
    provideCompletionItems: (model, position) => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      };
      
      const suggestions = [
        {
          label: 'html5',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'HTML5 Boilerplate',
          range
        },
        {
          label: '!',
          kind: monaco.languages.CompletionItemKind.Snippet,
          insertText: '<!DOCTYPE html>\n<html lang="en">\n<head>\n\t<meta charset="UTF-8">\n\t<meta name="viewport" content="width=device-width, initial-scale=1.0">\n\t<title>${1:Document}</title>\n</head>\n<body>\n\t$0\n</body>\n</html>',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'HTML5 Boilerplate',
          range
        }
      ];
      return { suggestions };
    }
  });
}
