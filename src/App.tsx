import React, { useState, useEffect, useRef } from 'react';
import { 
  Files, Search, Settings, User, X, Plus, 
  Play, TerminalSquare, Terminal as TerminalIcon, LayoutPanelLeft, PanelBottom, PanelRight, 
  Bell, ChevronRight, ChevronDown, MoreHorizontal, SplitSquareHorizontal, Trash2, Edit2, Info, HardDrive, Code2,
  RotateCw, Lock, ChevronLeft
} from 'lucide-react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { setupIntelliSense } from './lib/intellisense';
import {
  SiJavascript, SiTypescript, SiPython, SiHtml5, SiCss, SiReact,
  SiJson, SiMarkdown, SiGnubash, SiCplusplus, SiDotnet, SiGo,
  SiRust, SiPhp, SiRuby, SiMysql, SiYaml
} from 'react-icons/si';
import { VscFile } from 'react-icons/vsc';

type FileNode = {
  id: string;
  name: string;
  content: string;
  language: string;
};

const getLanguageFromExtension = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'json': return 'json';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'md': return 'markdown';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'c': return 'c';
    case 'cpp': return 'cpp';
    case 'cs': return 'csharp';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'sql': return 'sql';
    case 'xml': return 'xml';
    case 'yaml':
    case 'yml': return 'yaml';
    case 'sh': return 'shell';
    default: return 'typescript'; // Default to typescript for rich intellisense before saving
  }
};

const detectLanguage = (content: string): { lang: string, ext: string } | null => {
  if (!content || content.trim() === '') return null;
  if (/^\s*(<!DOCTYPE html>|<html)/i.test(content)) return { lang: 'html', ext: 'html' };
  if (/^\s*<\?php/i.test(content)) return { lang: 'php', ext: 'php' };
  if (/^\s*#include\s*[<"]/m.test(content)) return { lang: 'cpp', ext: 'cpp' };
  if (/^\s*package main/m.test(content)) return { lang: 'go', ext: 'go' };
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\s+/i.test(content)) return { lang: 'sql', ext: 'sql' };
  if (/import\s+React/m.test(content) || /className=/m.test(content) || /<\w+>.*<\/\w+>/m.test(content)) return { lang: 'typescript', ext: 'tsx' };
  if (/^\s*(def|class)\s+\w+\s*\(/m.test(content) || /^\s*import\s+[a-zA-Z0-9_]+(\s+as\s+[a-zA-Z0-9_]+)?\s*$/m.test(content) || /^\s*from\s+[a-zA-Z0-9_]+\s+import\s+/m.test(content) || /print\s*\(/m.test(content)) return { lang: 'python', ext: 'py' };
  if (/^\s*(const|let|var|function)\s+/m.test(content) || /console\.log/m.test(content) || /=>/m.test(content)) return { lang: 'javascript', ext: 'js' };
  if (/^\s*\{\s*"[a-zA-Z0-9_-]+"\s*:/m.test(content)) return { lang: 'json', ext: 'json' };
  if (/^\s*(\.[a-zA-Z0-9_-]+|#[a-zA-Z0-9_-]+|[a-zA-Z0-9_-]+)\s*\{/m.test(content) && !content.includes('function')) return { lang: 'css', ext: 'css' };
  return null;
};

const getFileIcon = (filename: string, className: string = "w-4 h-4") => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!filename.includes('.')) return <VscFile className={`${className} text-[#cccccc]`} />;
  
  switch (ext) {
    case 'js': return <SiJavascript className={`${className} text-[#f7df1e]`} />;
    case 'jsx':
    case 'tsx': return <SiReact className={`${className} text-[#61dafb]`} />;
    case 'ts': return <SiTypescript className={`${className} text-[#3178c6]`} />;
    case 'py': return <SiPython className={`${className} text-[#3776ab]`} />;
    case 'html': return <SiHtml5 className={`${className} text-[#e34f26]`} />;
    case 'css': return <SiCss className={`${className} text-[#1572b6]`} />;
    case 'json': return <SiJson className={`${className} text-[#cbcb41]`} />;
    case 'md': return <SiMarkdown className={`${className} text-[#ffffff]`} />;
    case 'sh': return <SiGnubash className={`${className} text-[#4eaa25]`} />;
    case 'cpp':
    case 'c': return <SiCplusplus className={`${className} text-[#00599c]`} />;
    case 'cs': return <SiDotnet className={`${className} text-[#239120]`} />;
    case 'go': return <SiGo className={`${className} text-[#00add8]`} />;
    case 'rs': return <SiRust className={`${className} text-[#dea584]`} />;
    case 'php': return <SiPhp className={`${className} text-[#777bb4]`} />;
    case 'rb': return <SiRuby className={`${className} text-[#cc342d]`} />;
    case 'sql': return <SiMysql className={`${className} text-[#4479a1]`} />;
    case 'yaml':
    case 'yml': return <SiYaml className={`${className} text-[#cb171e]`} />;
    default: return <VscFile className={`${className} text-[#cccccc]`} />;
  }
};

const EDITOR_OPTIONS: any = {
  minimap: { enabled: true },
  fontSize: 14,
  wordWrap: 'on',
  automaticLayout: true,
  padding: { top: 16 },
  fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
  fontLigatures: true,
  formatOnPaste: true,
  formatOnType: true,
  cursorBlinking: "smooth",
  cursorSmoothCaretAnimation: "on",
  smoothScrolling: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: "on",
  quickSuggestions: { other: true, comments: true, strings: true },
  quickSuggestionsDelay: 0,
  snippetSuggestions: "inline",
  wordBasedSuggestions: "allDocuments",
  suggest: {
    showIcons: true,
    showSnippets: true,
    showWords: true,
    showColors: true,
    showFiles: true,
    showReferences: true,
    showFolders: true,
    showTypeParameters: true,
    showIssues: true,
    showUsers: true,
    showEvents: true,
    showOperators: true,
    preview: true,
  }
};

export default function App() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const [openFileIds, setOpenFileIds] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'explorer' | 'search'>('explorer');
  const [newFileName, setNewFileName] = useState('');
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Lyra AI Workspace');
  const [projectDescription, setProjectDescription] = useState('A modern, AI-powered development environment.');
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [isRenamingProject, setIsRenamingProject] = useState(false);
  const [isRenamingDescription, setIsRenamingDescription] = useState(false);
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const [editorInstance, setEditorInstance] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'split' | 'full'>('split');

  const getPreviewContent = (file: FileNode | undefined) => {
    if (!file) return '';
    if (file.language === 'html') return file.content;
    if (file.language === 'markdown') {
      return `<html><body style="font-family: system-ui, sans-serif; padding: 20px; line-height: 1.5; color: #333;">
        <h2>Markdown Preview</h2>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${file.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      </body></html>`;
    }
    if (file.language === 'javascript' || file.language === 'typescript') {
      return `<html><body style="font-family: system-ui, sans-serif; padding: 20px; background: #1e1e1e; color: #fff;">
        <h3 style="color: #4ade80; margin-top: 0;">Console Output</h3>
        <pre id="out" style="font-family: monospace; white-space: pre-wrap;"></pre>
        <script>
          const out = document.getElementById('out');
          const originalLog = console.log;
          const originalError = console.error;
          console.log = (...args) => {
            out.textContent += args.join(' ') + '\\n';
            originalLog(...args);
          };
          console.error = (...args) => {
            out.innerHTML += '<span style="color: #f87171;">' + args.join(' ') + '</span>\\n';
            originalError(...args);
          };
          try {
            ${file.content}
          } catch(e) {
            console.error(e.message);
          }
        </script>
      </body></html>`;
    }
    if (file.language === 'json') {
      return `<html><body style="font-family: monospace; padding: 20px; background: #1e1e1e; color: #d4d4d4; white-space: pre-wrap;">${file.content}</body></html>`;
    }
    return `<html><body style="font-family: system-ui, sans-serif; padding: 40px; background: #09090b; color: #a1a1aa; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
      <div style="background: #18181b; padding: 30px; border-radius: 12px; border: 1px solid #27272a; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
        <h3 style="color: #f4f4f5; margin-top: 0; margin-bottom: 8px; font-size: 18px; font-weight: 600;">Preview not available for ${file.language}</h3>
        <p style="margin: 0; font-size: 14px; line-height: 1.5;">Vibe code with the AI to build a frontend interface or run this code in the terminal below.</p>
      </div>
    </body></html>`;
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    setEditorInstance(editor);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(event.target as Node)) {
        setProjectDropdownOpen(false);
        setIsRenamingProject(false);
        setIsRenamingDescription(false);
      }
    };

    if (projectDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [projectDropdownOpen]);
  
  type TerminalInstance = {
    id: string;
    type: 'cmd' | 'powershell' | 'bash';
    name: string;
    history: {type: 'input'|'output', text: string, isError?: boolean}[];
    input: string;
  };

  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminals, setTerminals] = useState<TerminalInstance[]>([
    {
      id: '1',
      type: 'cmd',
      name: 'cmd',
      history: [
        { type: 'output', text: 'Microsoft Windows [Version 10.0.26200.7840]' },
        { type: 'output', text: '(c) Microsoft Corporation. All rights reserved.\n' }
      ],
      input: ''
    }
  ]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('1');
  const [terminalDropdownOpen, setTerminalDropdownOpen] = useState(false);
  const [editingTerminalId, setEditingTerminalId] = useState<string | null>(null);
  const [editingTerminalName, setEditingTerminalName] = useState('');
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const terminalOutputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight;
    }
  }, [terminals, terminalOpen]);

  const handlePlay = () => {
    let fileToRun = files.find(f => f.id === activeFileId);
    
    if (!fileToRun && files.length > 0) {
      // Auto-detect entry point if no file is active
      fileToRun = files.find(f => f.name.endsWith('index.html')) || 
                  files.find(f => f.name.endsWith('main.py')) ||
                  files.find(f => f.name.endsWith('App.tsx')) ||
                  files.find(f => f.name.endsWith('index.js')) ||
                  files.find(f => f.name.endsWith('index.ts')) ||
                  files[0];
    }

    if (!fileToRun) return;
    const activeFile = fileToRun;

    // Ensure the file is open in the editor so the preview/terminal can render
    if (!openFileIds.includes(activeFile.id)) {
      setOpenFileIds(prev => [...prev, activeFile.id]);
    }
    setActiveFileId(activeFile.id);

    const webLangs = ['html', 'css', 'markdown'];
    const isFrontendJs = (activeFile.language === 'javascript' || activeFile.language === 'typescript') && 
                         (activeFile.content.includes('<html') || activeFile.content.includes('document.') || activeFile.content.includes('react'));

    // If it's a React/Vite project, default to preview
    const isWebProject = files.some(f => f.name.endsWith('package.json') && (f.content.includes('react') || f.content.includes('vite')));

    if (webLangs.includes(activeFile.language) || isFrontendJs || isWebProject) {
      setPreviewMode('full');
      setPreviewOpen(true);
    } else {
      // Run in terminal
      let targetTerminalId = activeTerminalId;
      if (!terminalOpen && terminals.length === 0) {
        const newId = Date.now().toString();
        setTerminals([{
          id: newId,
          type: 'bash',
          name: 'bash',
          history: [
            { type: 'output', text: 'user@lyra:~/workspace$ ' }
          ],
          input: ''
        }]);
        setActiveTerminalId(newId);
        targetTerminalId = newId;
      }
      setTerminalOpen(true);
      
      const runCmd = activeFile.language === 'python' ? `python3 ${activeFile.name}` : 
                     activeFile.language === 'shell' ? `bash ${activeFile.name}` : 
                     activeFile.language === 'javascript' ? `node ${activeFile.name}` :
                     activeFile.language === 'typescript' ? `ts-node ${activeFile.name}` :
                     activeFile.language === 'java' ? `javac ${activeFile.name} && java ${activeFile.name.split('.')[0]}` :
                     activeFile.language === 'cpp' ? `g++ ${activeFile.name} && ./a.out` :
                     activeFile.language === 'rust' ? `rustc ${activeFile.name} && ./${activeFile.name.split('.')[0]}` :
                     `./${activeFile.name}`;
                     
      // Execute mock
      let outputText = '';
      let isError = false;
      if (activeFile.language === 'python') {
        try {
          const lines = activeFile.content.split('\n');
          for (const line of lines) {
            if (line.trim() === '') continue;
            // Simple syntax check for python mock
            if (!line.startsWith('print') && !line.includes('=') && !line.startsWith('def') && !line.startsWith('import') && !line.startsWith('from') && !line.startsWith('#')) {
              throw new Error(`SyntaxError: invalid syntax at '${line.trim()}'`);
            }
            const stringMatch = line.match(/print\s*\(\s*(['"])(.*?)\1\s*\)/);
            if (stringMatch) {
              outputText += stringMatch[2] + '\n';
              continue;
            }
            const varMatch = line.match(/print\s*\(\s*([^'"]+?)\s*\)/);
            if (varMatch) {
              outputText += `[Value of ${varMatch[1]}]\n`;
            }
          }
          if (!outputText) outputText = '(No output)\n';
        } catch (e: any) {
          outputText = e.toString() + '\n';
          isError = true;
        }
      } else if (activeFile.language === 'javascript' || activeFile.language === 'typescript') {
        let captured = '';
        const originalLog = console.log;
        console.log = (...args) => { captured += args.join(' ') + '\n'; };
        try {
          // eslint-disable-next-line no-eval
          eval(activeFile.content);
        } catch (e: any) {
          captured += e.toString() + '\n';
          isError = true;
        }
        console.log = originalLog;
        outputText = captured || '(No output)\n';
      } else {
        outputText = `> Executing ${activeFile.name}...\n> Process completed with exit code 0.\n`;
      }
      
      setTerminals(prev => prev.map(t => {
        if (t.id === targetTerminalId) {
          const prompt = t.type === 'cmd' ? 'C:\\workspace> ' : t.type === 'powershell' ? 'PS C:\\workspace> ' : 'user@lyra:~/workspace$ ';
          return {
            ...t,
            history: [
              ...t.history,
              { type: 'input', text: `${prompt}${runCmd}` },
              { type: 'output', text: outputText.trim(), isError }
            ]
          };
        }
        return t;
      }));
    }
  };

  const monaco = useMonaco();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setActiveMenu(null);
      if (!(e.target as Element).closest('.terminal-dropdown-trigger')) {
        setTerminalDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (monaco) {
      // Configure Monaco editor settings globally if needed
      monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
      });
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.Latest,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
        reactNamespace: "React",
        allowJs: true,
        typeRoots: ["node_modules/@types"]
      });
      
      // Define modern dark theme
      monaco.editor.defineTheme('modern-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { background: '09090B' }
        ],
        colors: {
          'editor.background': '#09090B',
          'editor.foreground': '#D4D4D8',
          'editorLineNumber.foreground': '#52525B',
          'editorLineNumber.activeForeground': '#FAFAFA',
          'editor.selectionBackground': '#27272A',
          'editor.inactiveSelectionBackground': '#18181B',
          'editorSuggestWidget.background': '#18181B',
          'editorSuggestWidget.border': '#27272A',
          'editorSuggestWidget.foreground': '#D4D4D8',
          'editorSuggestWidget.selectedBackground': '#27272A',
          'editorSuggestWidget.highlightForeground': '#FAFAFA',
          'editorWidget.background': '#18181B',
          'editorWidget.border': '#27272A',
          'editorIndentGuide.background': '#27272A',
          'editorIndentGuide.activeBackground': '#3F3F46',
        }
      });
      
      // Setup our custom IntelliSense snippets and keywords
      setupIntelliSense(monaco);
    }
  }, [monaco]);

  const handleCreateFile = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newFileName.trim()) {
      const newFile: FileNode = {
        id: Date.now().toString(),
        name: newFileName.trim(),
        content: '',
        language: getLanguageFromExtension(newFileName.trim())
      };
      setFiles([...files, newFile]);
      setOpenFileIds([...openFileIds, newFile.id]);
      setActiveFileId(newFile.id);
      setIsCreatingFile(false);
      setNewFileName('');
    } else if (e.key === 'Escape') {
      setIsCreatingFile(false);
      setNewFileName('');
    }
  };

  const handleTerminalCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const activeTerminal = terminals.find(t => t.id === activeTerminalId);
      if (!activeTerminal) return;

      const prompt = activeTerminal.type === 'cmd' ? 'C:\\Users\\Luke\\Downloads\\Lyra AI>' : 
                     activeTerminal.type === 'powershell' ? 'PS C:\\Users\\Luke\\Downloads\\Lyra AI>' :
                     'luke@lyra-ai:~/workspace$';
                     
      const newHistory = [...activeTerminal.history, { type: 'input' as const, text: `${prompt} ${activeTerminal.input}` }];
      
      let output = '';
      const cmd = activeTerminal.input.trim().toLowerCase();
      if (cmd === 'dir' || cmd === 'ls') {
        output = files.length > 0 ? files.map(f => f.name).join('\n') : 'Directory is empty';
      } else if (cmd === 'clear' || cmd === 'cls') {
        setTerminals(terminals.map(t => t.id === activeTerminalId ? { ...t, history: [], input: '' } : t));
        return;
      } else if (cmd.startsWith('echo ')) {
        output = activeTerminal.input.substring(5);
      } else if (cmd !== '') {
        output = `'${activeTerminal.input.split(' ')[0]}' is not recognized as an internal or external command,\noperable program or batch file.`;
      }

      if (output) {
        newHistory.push({ type: 'output' as const, text: output });
      }
      
      setTerminals(terminals.map(t => t.id === activeTerminalId ? { ...t, history: newHistory, input: '' } : t));
    }
  };

  const addTerminal = (type: 'cmd' | 'powershell' | 'bash') => {
    const newId = Date.now().toString();
    const initialHistory = type === 'bash' ? 
      [{ type: 'output' as const, text: 'bash-5.1$ ' }] : 
      [
        { type: 'output' as const, text: 'Microsoft Windows [Version 10.0.26200.7840]' },
        { type: 'output' as const, text: '(c) Microsoft Corporation. All rights reserved.\n' }
      ];
      
    setTerminals([...terminals, { id: newId, type, name: type, history: initialHistory, input: '' }]);
    setActiveTerminalId(newId);
    setTerminalDropdownOpen(false);
  };

  const removeTerminal = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newTerminals = terminals.filter(t => t.id !== id);
    if (newTerminals.length === 0) {
      setTerminalOpen(false);
      setTerminals([]);
    } else {
      setTerminals(newTerminals);
      if (activeTerminalId === id) {
        setActiveTerminalId(newTerminals[newTerminals.length - 1].id);
      }
    }
  };

  const startRenamingTerminal = (e: React.MouseEvent, t: TerminalInstance) => {
    e.stopPropagation();
    setEditingTerminalId(t.id);
    setEditingTerminalName(t.name);
  };

  const saveTerminalName = () => {
    if (editingTerminalId) {
      setTerminals(terminals.map(t => 
        t.id === editingTerminalId 
          ? { ...t, name: editingTerminalName.trim() || t.type } 
          : t
      ));
      setEditingTerminalId(null);
    }
  };

  const openFile = (id: string) => {
    if (!openFileIds.includes(id)) {
      setOpenFileIds([...openFileIds, id]);
    }
    setActiveFileId(id);
  };

  const closeFile = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newOpenFileIds = openFileIds.filter(fileId => fileId !== id);
    setOpenFileIds(newOpenFileIds);
    if (activeFileId === id) {
      setActiveFileId(newOpenFileIds.length > 0 ? newOpenFileIds[newOpenFileIds.length - 1] : null);
    }
  };

  const updateFileContent = (value: string | undefined) => {
    if (activeFileId && value !== undefined) {
      setFiles(files.map(f => {
        if (f.id === activeFileId) {
          let newName = f.name;
          let newLang = f.language;
          
          if (!f.name.includes('.')) {
            const detected = detectLanguage(value);
            if (detected) {
              newName = `${f.name}.${detected.ext}`;
              newLang = detected.lang;
            }
          }
          
          return { ...f, content: value, name: newName, language: newLang };
        }
        return f;
      }));
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    Array.from(uploadedFiles).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const ext = file.name.split('.').pop() || '';
        const language = ext === 'js' ? 'javascript' :
                         ext === 'ts' ? 'typescript' :
                         ext === 'py' ? 'python' :
                         ext === 'html' ? 'html' :
                         ext === 'css' ? 'css' :
                         ext === 'json' ? 'json' :
                         ext === 'md' ? 'markdown' : 'plaintext';
                         
        const newFile: FileNode = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          language,
          content
        };
        
        setFiles(prev => [...prev, newFile]);
      };
      reader.readAsText(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    // Filter out massive directories that will crash the browser
    const validFiles = Array.from(uploadedFiles).filter(file => {
      const path = (file as any).webkitRelativePath || file.name;
      return !path.includes('/node_modules/') && !path.includes('/.git/') && !path.includes('/dist/') && !path.includes('/.next/');
    });

    const newFiles: FileNode[] = [];
    
    await Promise.all(validFiles.map(async (file) => {
      try {
        const content = await file.text();
        const ext = file.name.split('.').pop() || '';
        const language = ext === 'js' ? 'javascript' :
                         ext === 'ts' ? 'typescript' :
                         ext === 'py' ? 'python' :
                         ext === 'html' ? 'html' :
                         ext === 'css' ? 'css' :
                         ext === 'json' ? 'json' :
                         ext === 'md' ? 'markdown' : 'plaintext';
                         
        const path = (file as any).webkitRelativePath || file.name;
        
        newFiles.push({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: path,
          language,
          content
        });
      } catch (err) {
        console.error("Failed to read file", file.name, err);
      }
    }));
    
    if (newFiles.length > 0) {
      setFiles(prev => {
        const existingPaths = new Set(prev.map(f => f.name));
        const uniqueNewFiles = newFiles.filter(f => !existingPaths.has(f.name));
        return [...prev, ...uniqueNewFiles];
      });
    }
    
    if (folderInputRef.current) folderInputRef.current.value = '';
  };

  const activeFile = files.find(f => f.id === activeFileId);

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  type MenuItem = { label?: string; shortcut?: string; action?: () => void; divider?: boolean };
  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New File', shortcut: 'Ctrl+N', action: () => setIsCreatingFile(true) },
      { label: 'New Window', shortcut: 'Ctrl+Shift+N', action: () => window.open(window.location.href, '_blank') },
      { divider: true },
      { label: 'Open File...', shortcut: 'Ctrl+O', action: () => fileInputRef.current?.click() },
      { label: 'Open Folder...', shortcut: 'Ctrl+K Ctrl+O', action: () => folderInputRef.current?.click() },
      { divider: true },
      { label: 'Save', shortcut: 'Ctrl+S', action: () => { if (editorInstance) editorInstance.getAction('editor.action.formatDocument').run(); } },
      { label: 'Save As...', shortcut: 'Ctrl+Shift+S', action: () => { if (editorInstance) editorInstance.getAction('editor.action.formatDocument').run(); } },
      { divider: true },
      { label: 'Exit', action: () => window.close() }
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'undo', null); } },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'redo', null); } },
      { divider: true },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.clipboardCutAction', null); } },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.clipboardCopyAction', null); } },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.clipboardPasteAction', null); } },
      { divider: true },
      { label: 'Find', shortcut: 'Ctrl+F', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'actions.find', null); } },
      { label: 'Replace', shortcut: 'Ctrl+H', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.startFindReplaceAction', null); } },
    ],
    Selection: [
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.selectAll', null); } },
      { label: 'Expand Selection', shortcut: 'Shift+Alt+Right', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.smartSelect.expand', null); } },
      { label: 'Shrink Selection', shortcut: 'Shift+Alt+Left', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.smartSelect.shrink', null); } },
    ],
    View: [
      { label: 'Command Palette...', shortcut: 'Ctrl+Shift+P', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.quickCommand', null); } },
      { label: 'Open View...', action: () => { setActiveSidebarTab('explorer'); setSidebarOpen(true); } },
      { divider: true },
      { label: 'Appearance', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.toggleZenMode', null); } },
      { label: 'Editor Layout', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'workbench.action.splitEditor', null); } },
      { divider: true },
      { label: 'Explorer', shortcut: 'Ctrl+Shift+E', action: () => { setActiveSidebarTab('explorer'); setSidebarOpen(true); } },
      { label: 'Search', shortcut: 'Ctrl+Shift+F', action: () => { setActiveSidebarTab('search'); setSidebarOpen(true); } },
    ],
    Go: [
      { label: 'Back', shortcut: 'Alt+Left', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'workbench.action.navigateBack', null); } },
      { label: 'Forward', shortcut: 'Alt+Right', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'workbench.action.navigateForward', null); } },
      { divider: true },
      { label: 'Go to File...', shortcut: 'Ctrl+P', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.quickCommand', null); } },
      { label: 'Go to Symbol in Workspace...', shortcut: 'Ctrl+T', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.showAllSymbols', null); } },
    ],
    Run: [
      { label: 'Start Debugging', shortcut: 'F5', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.quickCommand', null); } },
      { label: 'Run Without Debugging', shortcut: 'Ctrl+F5', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.quickCommand', null); } },
      { divider: true },
      { label: 'Add Configuration...', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.quickCommand', null); } },
    ],
    Terminal: [
      { label: 'New Terminal', shortcut: 'Ctrl+Shift+`', action: () => {
        if (!terminalOpen && terminals.length === 0) addTerminal('cmd');
        setTerminalOpen(true);
      }},
      { label: 'Split Terminal', shortcut: 'Ctrl+Shift+5', action: () => {
        addTerminal('cmd');
        setTerminalOpen(true);
      }},
      { divider: true },
      { label: 'Run Task...', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.quickCommand', null); } },
    ],
    Help: [
      { label: 'Welcome', action: () => { setActiveFileId(null); setOpenFileIds([]); } },
      { label: 'Interactive Playground', action: () => { if (editorInstance) editorInstance.trigger('keyboard', 'editor.action.quickCommand', null); } },
      { label: 'Documentation', action: () => window.open('https://code.visualstudio.com/docs', '_blank') },
      { divider: true },
      { label: 'About', action: () => alert('Lyra AI Workspace\\nVersion 1.0.0') },
    ]
  };

  const activeTerminal = terminals.find(t => t.id === activeTerminalId) || terminals[0];
  const terminalPrompt = activeTerminal.type === 'cmd' ? 'C:\\Users\\Luke\\Downloads\\Lyra AI>' : 
                         activeTerminal.type === 'powershell' ? 'PS C:\\Users\\Luke\\Downloads\\Lyra AI>' :
                         'luke@lyra-ai:~/workspace$';

  return (
    <div className="flex h-screen w-full bg-[#09090b] text-zinc-300 font-sans overflow-hidden selection:bg-zinc-800">
      
      {/* IDE */}
      <div className="flex flex-col flex-1 overflow-hidden relative bg-zinc-950">
        {/* Title Bar */}
        <div className="flex items-center h-[36px] bg-zinc-950 px-3 text-[13px] select-none shrink-0 border-b border-zinc-800/50">
        <div className="flex items-center space-x-4 z-10 flex-1">
          <div className="flex space-x-1 text-zinc-400" onClick={(e) => e.stopPropagation()}>
            {Object.entries(menus).map(([menuName, items]) => (
              <div key={menuName} className="relative">
                <div 
                  className={`hover:bg-zinc-800/50 hover:text-zinc-100 cursor-pointer px-2.5 py-1 rounded-md text-[13px] transition-colors ${activeMenu === menuName ? 'bg-zinc-800/50 text-zinc-100' : ''}`}
                  onClick={() => setActiveMenu(activeMenu === menuName ? null : menuName)}
                  onMouseEnter={() => activeMenu && setActiveMenu(menuName)}
                >
                  {menuName}
                </div>
                {activeMenu === menuName && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-zinc-900 border border-zinc-800 shadow-2xl py-1 z-50 rounded-lg text-zinc-300">
                    {items.map((item, i) => item.divider ? (
                      <div key={i} className="h-px bg-zinc-800 my-1" />
                    ) : (
                      <div 
                        key={i} 
                        className="flex justify-between px-6 py-1.5 hover:bg-zinc-800 hover:text-zinc-100 cursor-pointer text-[13px] transition-colors" 
                        onClick={() => { item.action?.(); setActiveMenu(null); }}
                      >
                        <span>{item.label}</span>
                        <span className="text-zinc-500">{item.shortcut}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* Centered Elements */}
        <div className="flex items-center justify-center space-x-6 z-10 flex-shrink-0">
          {/* Project Name Button */}
          <div className="relative" ref={projectDropdownRef}>
            <div 
              className="flex items-center justify-center bg-transparent hover:bg-zinc-800/50 border border-transparent hover:border-zinc-700/50 rounded-md px-4 py-1 shadow-sm cursor-pointer transition-colors group"
              onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
            >
              <span className="text-[12px] font-medium text-zinc-300 mr-2">{projectName}</span>
              <ChevronDown className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </div>
            
            {projectDropdownOpen && (
              <div className="absolute top-full mt-2 w-72 bg-zinc-950 border border-zinc-800 shadow-2xl rounded-lg z-50 overflow-hidden left-1/2 -translate-x-1/2">
                <div className="p-4 border-b border-zinc-800/50 bg-zinc-950">
                  {isRenamingProject ? (
                    <input 
                      autoFocus
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onBlur={() => setIsRenamingProject(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsRenamingProject(false)}
                      className="bg-zinc-950 border border-zinc-700 text-zinc-100 text-[13px] font-medium rounded px-2 py-1 w-full outline-none focus:border-zinc-500"
                    />
                  ) : (
                    <h3 className="text-zinc-100 font-medium text-[14px] flex items-center justify-between">
                      {projectName}
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsRenamingProject(true); }}
                        className="text-zinc-500 hover:text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/50 p-1 rounded transition-colors"
                        title="Rename Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </h3>
                  )}
                  
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Description</span>
                      {!isRenamingDescription && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setIsRenamingDescription(true); }}
                          className="text-[10px] flex items-center text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-700/50 px-1.5 py-0.5 rounded transition-colors"
                        >
                          <Edit2 className="w-3 h-3 mr-1" /> Edit
                        </button>
                      )}
                    </div>
                    {isRenamingDescription ? (
                      <textarea 
                        autoFocus
                        value={projectDescription}
                        onChange={(e) => setProjectDescription(e.target.value)}
                        onBlur={() => setIsRenamingDescription(false)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            setIsRenamingDescription(false);
                          }
                        }}
                        className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-[12px] rounded px-2 py-1.5 w-full outline-none focus:border-zinc-500 resize-none h-16 shadow-inner"
                        placeholder="Enter project description..."
                      />
                    ) : (
                      <p className="text-zinc-400 text-[12px] leading-relaxed bg-zinc-900/50 rounded p-2 border border-zinc-800/50 min-h-[40px]">
                        {projectDescription || <span className="italic text-zinc-600">No description provided.</span>}
                      </p>
                    )}
                  </div>
                </div>
                <div className="p-2">
                  <div className="flex items-center px-3 py-2 text-[12px] text-zinc-400">
                    <HardDrive className="w-3.5 h-3.5 mr-2" />
                    <span>Project Size: </span>
                    <span className="text-zinc-300 ml-1 font-mono">24.5 MB</span>
                  </div>
                  <div className="flex items-center px-3 py-2 text-[12px] text-zinc-400">
                    <Info className="w-3.5 h-3.5 mr-2" />
                    <span>Files: </span>
                    <span className="text-zinc-300 ml-1 font-mono">{files.length}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {files.length > 0 && (
            <>
              {/* Code / Preview Toggle */}
              <div className="flex items-center bg-black border border-zinc-800 rounded p-0.5">
                <button 
                  onClick={() => setPreviewOpen(false)}
                  className={`flex items-center px-3 py-1 text-[11px] font-medium rounded-sm transition-colors ${!previewOpen ? 'bg-zinc-800 text-zinc-100' : 'bg-black text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                >
                  <Code2 className="w-3.5 h-3.5 mr-1.5" />
                  Code
                </button>
                <button 
                  onClick={() => {
                    if (!previewOpen) {
                      if (!activeFileId && files.length > 0) handlePlay();
                      else if (activeFileId) { setPreviewMode('full'); setPreviewOpen(true); }
                    }
                  }}
                  className={`flex items-center px-3 py-1 text-[11px] font-medium rounded-sm transition-colors ${previewOpen ? 'bg-zinc-800 text-zinc-100' : 'bg-black text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'}`}
                >
                  <Play className="w-3.5 h-3.5 mr-1.5" />
                  Preview
                </button>
              </div>

              {/* Preview Controls (Refresh, Split) - Always rendered to prevent layout shift, but hidden when not in preview */}
              <div className={`flex items-center space-x-1 transition-opacity duration-200 ${previewOpen ? 'opacity-100' : 'opacity-0 pointer-events-none w-0 overflow-hidden'}`}>
                <button 
                  onClick={() => {
                    const iframe = document.getElementById('live-preview-iframe') as HTMLIFrameElement;
                    if (iframe) iframe.srcdoc = iframe.srcdoc;
                  }}
                  className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                  title="Refresh"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setPreviewMode(previewMode === 'split' ? 'full' : 'split')}
                  className={`p-1.5 rounded transition-colors ${previewMode === 'split' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}
                  title={previewMode === 'split' ? "Full Width" : "Split View"}
                >
                  <SplitSquareHorizontal className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-end space-x-3 text-zinc-500 z-10 flex-1">
          <div 
            className={`flex items-center justify-center px-2 py-1 rounded transition-colors ${files.length > 0 ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-400 cursor-pointer' : 'bg-zinc-800/30 text-zinc-600 cursor-not-allowed'}`}
            onClick={files.length > 0 ? handlePlay : undefined}
            title={files.length > 0 ? (activeFileId ? "Run Active File" : "Run Project") : "Open a file to run"}
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-current" />
            <span className="text-[11px] font-semibold uppercase tracking-wider">Run</span>
          </div>
          <div className="w-px h-4 bg-zinc-800 mx-1"></div>
          <LayoutPanelLeft className="w-4 h-4 hover:text-zinc-200 cursor-pointer transition-colors" onClick={() => setSidebarOpen(!sidebarOpen)} />
          <PanelBottom className="w-4 h-4 hover:text-zinc-200 cursor-pointer transition-colors" />
          <PanelRight className="w-4 h-4 hover:text-zinc-200 cursor-pointer transition-colors" />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Hidden File Inputs */}
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple />
        <input type="file" ref={folderInputRef} onChange={handleFolderUpload} className="hidden" webkitdirectory="" directory="" />
        
        {/* Activity Bar */}
        <div className="w-[48px] bg-zinc-950 flex flex-col items-center py-3 justify-between shrink-0 border-r border-zinc-800/50">
          <div className="flex flex-col items-center space-y-5 w-full">
            <div 
              className={`relative flex justify-center w-full cursor-pointer transition-colors ${activeSidebarTab === 'explorer' ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}
              onClick={() => {
                if (activeSidebarTab === 'explorer') setSidebarOpen(!sidebarOpen);
                else { setActiveSidebarTab('explorer'); setSidebarOpen(true); }
              }}
            >
              {activeSidebarTab === 'explorer' && sidebarOpen && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-100 rounded-r-full" />}
              <Files className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <div 
              className={`relative flex justify-center w-full cursor-pointer transition-colors ${activeSidebarTab === 'search' ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-300'}`}
              onClick={() => {
                if (activeSidebarTab === 'search') setSidebarOpen(!sidebarOpen);
                else { setActiveSidebarTab('search'); setSidebarOpen(true); }
              }}
            >
              {activeSidebarTab === 'search' && sidebarOpen && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-100 rounded-r-full" />}
              <Search className="w-5 h-5" strokeWidth={1.5} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-[260px] bg-zinc-950 flex flex-col shrink-0 border-t border-r border-zinc-800/50 transition-all duration-200">
            <div className="flex items-center justify-between px-4 h-[40px] text-[11px] font-medium uppercase tracking-widest text-zinc-500">
              <span>{activeSidebarTab === 'explorer' ? 'Explorer' : 'Search'}</span>
              <MoreHorizontal className="w-4 h-4 cursor-pointer hover:text-zinc-200 transition-colors" />
            </div>
            
            {activeSidebarTab === 'explorer' && (
              <div className="flex-1 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-1.5 hover:bg-zinc-800/50 cursor-pointer group text-[11px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors">
                  <div className="flex items-center">
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    <span>Workspace</span>
                  </div>
                  <div className="hidden group-hover:flex items-center space-x-1">
                    <Plus className="w-4 h-4 hover:bg-zinc-700 hover:text-zinc-200 rounded p-0.5 transition-colors" onClick={(e) => { e.stopPropagation(); setIsCreatingFile(true); }} title="New File" />
                  </div>
                </div>
                
                <div className="flex flex-col py-1">
                  {isCreatingFile && (
                    <div className="flex items-center px-6 py-1.5">
                      {getFileIcon(newFileName, "w-4 h-4 mr-2 shrink-0 opacity-70")}
                      <input
                        autoFocus
                        type="text"
                        value={newFileName}
                        onChange={(e) => setNewFileName(e.target.value)}
                        onKeyDown={handleCreateFile}
                        onBlur={() => { setIsCreatingFile(false); setNewFileName(''); }}
                        className="bg-zinc-800 text-zinc-200 text-[13px] outline-none border border-zinc-600 rounded-sm w-full px-1.5 py-0.5 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition-all"
                      />
                    </div>
                  )}
                  
                  {files.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => openFile(file.id)}
                      className={`flex items-center px-6 py-1.5 cursor-pointer text-[13px] transition-colors ${activeFileId === file.id ? 'bg-zinc-800/80 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'}`}
                    >
                      {getFileIcon(file.name, `w-4 h-4 mr-2 shrink-0 ${activeFileId === file.id ? 'opacity-100' : 'opacity-70'}`)}
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                  
                  {files.length === 0 && !isCreatingFile && (
                    <div className="px-5 py-6 flex flex-col space-y-3">
                      <p className="text-[13px] text-zinc-500 mb-2 leading-relaxed">You have not yet added a folder to the workspace.</p>
                      <button 
                        onClick={() => setIsCreatingFile(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-[13px] py-1.5 px-4 rounded w-full text-center cursor-pointer transition-colors"
                      >
                        New File
                      </button>
                      <button 
                        onClick={() => folderInputRef.current?.click()}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-[13px] py-1.5 px-4 rounded w-full text-center cursor-pointer transition-colors"
                      >
                        Open Folder
                      </button>
                      <button 
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium text-[13px] py-1.5 px-4 rounded w-full text-center cursor-pointer transition-colors"
                      >
                        Clone Repository
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeSidebarTab === 'search' && (
              <div className="flex-1 flex flex-col p-4">
                <div className="flex items-center bg-zinc-950 border border-zinc-800 focus-within:border-zinc-600 rounded-md px-2.5 py-1.5 mb-4 transition-colors shadow-inner">
                  <input 
                    type="text" 
                    placeholder="Search" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-[13px] text-zinc-200 w-full placeholder:text-zinc-600"
                  />
                </div>
                <div className="flex-1 overflow-y-auto">
                  {searchQuery && filteredFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => openFile(file.id)}
                      className="flex flex-col py-1.5 cursor-pointer hover:bg-zinc-800/50 px-3 rounded-md transition-colors"
                    >
                      <div className="flex items-center text-[13px] text-zinc-400 hover:text-zinc-200">
                        {getFileIcon(file.name, "w-3.5 h-3.5 mr-2 shrink-0 opacity-70")}
                        <span className="truncate">{file.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col bg-zinc-950 min-w-0 overflow-hidden">
          {openFileIds.length > 0 ? (
            <>
              {/* Editor Tabs */}
              {!(previewOpen && previewMode === 'full') && (
                <div className="flex h-[40px] bg-zinc-900/50 overflow-x-auto scrollbar-hide shrink-0 border-b border-zinc-800/50">
                  {openFileIds.map(id => {
                    const file = files.find(f => f.id === id);
                    if (!file) return null;
                    const isActive = activeFileId === id;
                    return (
                      <div 
                        key={id}
                        onClick={() => setActiveFileId(id)}
                        className={`flex items-center h-full px-4 min-w-fit cursor-pointer border-r border-zinc-800/50 group transition-colors ${isActive ? 'bg-zinc-950 text-zinc-100 border-t-2 border-t-zinc-100' : 'bg-transparent text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300 border-t-2 border-t-transparent'}`}
                      >
                        {getFileIcon(file.name, `w-3.5 h-3.5 mr-2 shrink-0 ${isActive ? 'opacity-100' : 'opacity-70'}`)}
                        <span className="text-[13px] mr-2">{file.name}</span>
                        <div 
                          className={`p-0.5 rounded-md hover:bg-zinc-700 hover:text-zinc-100 transition-colors ${isActive ? 'opacity-100 text-zinc-400' : 'opacity-0 group-hover:opacity-100 text-zinc-500'}`}
                          onClick={(e) => closeFile(e, id)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Breadcrumbs */}
              {!(previewOpen && previewMode === 'full') && (
                <div className="flex items-center h-[26px] px-5 text-[12px] text-zinc-500 bg-zinc-950 shrink-0 border-b border-zinc-800/30">
                  {activeFile && (
                    <>
                      <span className="hover:text-zinc-300 cursor-pointer transition-colors">Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5 mx-1.5 opacity-50" />
                      {getFileIcon(activeFile.name, "w-3.5 h-3.5 mr-1.5 shrink-0 opacity-70")}
                      <span className="text-zinc-300">{activeFile.name}</span>
                    </>
                  )}
                </div>
              )}

              {/* Monaco Editor */}
              <div className="flex-1 relative flex min-h-0">
                {(!previewOpen || previewMode === 'split') && (
                  <div className={`relative ${previewOpen ? 'w-1/2 border-r border-zinc-800/50' : 'w-full'}`}>
                    {activeFile && (
                      <Editor
                        height="100%"
                        language={activeFile.language}
                        theme="modern-dark"
                        defaultValue={activeFile.content}
                        onChange={updateFileContent}
                        onMount={handleEditorDidMount}
                        path={activeFile.name}
                        options={EDITOR_OPTIONS}
                      />
                    )}
                  </div>
                )}
                {previewOpen && (
                  <div className={`${previewMode === 'full' ? 'w-full' : 'w-1/2'} bg-white relative flex flex-col`}>
                    <iframe 
                      id="live-preview-iframe"
                      srcDoc={getPreviewContent(activeFile)} 
                      className="flex-1 w-full border-none bg-white"
                      title="Preview"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950">
              <div className="max-w-3xl w-full px-8">
                <div className="flex items-center mb-12">
                  <div className="w-16 h-16 mr-6 text-zinc-800 flex items-center justify-center rounded-2xl bg-zinc-900/30 border border-zinc-800/50 shadow-sm">
                    <Code2 className="w-8 h-8 text-zinc-400" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h1 className="text-zinc-200 text-3xl font-semibold tracking-tight">{projectName}</h1>
                    <p className="text-zinc-500 text-[14px] mt-1.5">Editing evolved.</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-16">
                  <div>
                    <h2 className="text-zinc-100 text-[14px] font-medium mb-5">Start</h2>
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center text-[13px] text-zinc-400 hover:text-zinc-200 cursor-pointer py-1.5 transition-colors" onClick={() => setIsCreatingFile(true)}>
                        <Plus className="w-4 h-4 mr-3 text-zinc-500" />
                        New File...
                      </div>
                      <div className="flex items-center text-[13px] text-zinc-400 hover:text-zinc-200 cursor-pointer py-1.5 transition-colors" onClick={() => fileInputRef.current?.click()}>
                        <Files className="w-4 h-4 mr-3 text-zinc-500" />
                        Open File...
                      </div>
                      <div className="flex items-center text-[13px] text-zinc-400 hover:text-zinc-200 cursor-pointer py-1.5 transition-colors" onClick={() => folderInputRef.current?.click()}>
                        <Search className="w-4 h-4 mr-3 text-zinc-500" />
                        Open Folder...
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h2 className="text-zinc-100 text-[14px] font-medium mb-5">Recent</h2>
                    <div className="flex flex-col space-y-2">
                      {files.slice(0, 4).map(f => (
                        <div key={f.id} className="flex items-center justify-between text-[13px] group cursor-pointer py-1" onClick={() => openFile(f.id)}>
                          <div className="flex items-center text-zinc-400 group-hover:text-zinc-200 transition-colors">
                            {getFileIcon(f.name, "w-4 h-4 mr-3 opacity-70")}
                            {f.name}
                          </div>
                          <span className="text-zinc-600 text-[11px] font-mono">~/workspace</span>
                        </div>
                      ))}
                      {files.length === 0 && (
                        <div className="text-zinc-600 text-[13px] py-1">No recent files</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Panel */}
          {terminalOpen && (
            <div className="h-[250px] bg-zinc-950 border-t border-l border-zinc-800/50 flex flex-col shrink-0">
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-4 h-[35px] text-[11px] uppercase tracking-wider text-zinc-400 border-b border-zinc-800/50">
                <div className="flex space-x-6 h-full">
                  <div className="flex items-center h-full hover:text-zinc-200 cursor-pointer">Problems</div>
                  <div className="flex items-center h-full hover:text-zinc-200 cursor-pointer">Output</div>
                  <div className="flex items-center h-full hover:text-zinc-200 cursor-pointer">Debug Console</div>
                  <div className="flex items-center h-full text-zinc-100 border-b border-zinc-500 cursor-pointer">Terminal</div>
                  <div className="flex items-center h-full hover:text-zinc-200 cursor-pointer">Ports</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative flex items-center terminal-dropdown-trigger">
                    <div 
                      className="flex items-center text-zinc-300 hover:bg-zinc-800 rounded px-1 py-0.5 cursor-pointer transition-colors"
                      onClick={() => setTerminalDropdownOpen(!terminalDropdownOpen)}
                      title="Launch Profile..."
                    >
                      <Plus className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </div>
                    {terminalDropdownOpen && (
                      <div className="absolute top-full right-0 mt-1 w-48 bg-zinc-900 border border-zinc-800 shadow-lg py-1 z-50 rounded-md text-zinc-300 normal-case tracking-normal">
                        <div className="px-4 py-1.5 hover:bg-zinc-800 cursor-pointer flex items-center" onClick={() => addTerminal('powershell')}>
                          <TerminalIcon className="w-4 h-4 mr-2" /> powershell
                        </div>
                        <div className="px-4 py-1.5 hover:bg-zinc-800 cursor-pointer flex items-center" onClick={() => addTerminal('cmd')}>
                          <TerminalSquare className="w-4 h-4 mr-2" /> cmd
                        </div>
                        <div className="px-4 py-1.5 hover:bg-zinc-800 cursor-pointer flex items-center" onClick={() => addTerminal('bash')}>
                          <TerminalIcon className="w-4 h-4 mr-2" /> git bash
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="w-px h-4 bg-zinc-700 mx-1"></div>
                  <X className="w-4 h-4 hover:text-zinc-200 cursor-pointer" onClick={() => setTerminalOpen(false)} />
                </div>
              </div>
              {/* Terminal Content & Tabs */}
              <div className="flex-1 flex overflow-hidden min-h-0">
                <div ref={terminalOutputRef} className="flex-1 overflow-y-auto p-4 font-mono text-[13px] text-zinc-300 bg-zinc-950" onClick={() => terminalInputRef.current?.focus()}>
                  {activeTerminal.history.map((line, i) => (
                    <div key={i} className={`whitespace-pre-wrap ${line.isError ? 'text-red-400' : ''}`}>
                      {line.type === 'input' && activeTerminal.type === 'bash' ? (
                        <span>
                          <span className="text-green-400">user@lyra</span>
                          <span className="text-white">:</span>
                          <span className="text-blue-400">~/workspace</span>
                          <span className="text-white">$ </span>
                          {line.text.split('$ ')[1] || line.text}
                        </span>
                      ) : (
                        line.text
                      )}
                    </div>
                  ))}
                  <div className="flex">
                    {activeTerminal.type === 'bash' ? (
                      <span className="mr-2 whitespace-pre">
                        <span className="text-green-400">user@lyra</span>
                        <span className="text-white">:</span>
                        <span className="text-blue-400">~/workspace</span>
                        <span className="text-white">$</span>
                      </span>
                    ) : (
                      <span className="mr-2 text-zinc-300 whitespace-pre">{terminalPrompt}</span>
                    )}
                    <input 
                      ref={terminalInputRef}
                      type="text" 
                      value={activeTerminal.input}
                      onChange={(e) => setTerminals(terminals.map(t => t.id === activeTerminalId ? { ...t, input: e.target.value } : t))}
                      onKeyDown={handleTerminalCommand}
                      className="flex-1 bg-transparent border-none outline-none text-zinc-300"
                      autoFocus
                    />
                  </div>
                </div>
                {terminals.length > 0 && (
                  <div className="w-[150px] bg-zinc-950 border-l border-zinc-800/50 flex flex-col py-2">
                    {terminals.map(t => (
                      <div 
                        key={t.id}
                        onClick={() => setActiveTerminalId(t.id)}
                        onDoubleClick={(e) => startRenamingTerminal(e, t)}
                        className={`flex items-center justify-between px-3 py-1.5 cursor-pointer text-[13px] group ${activeTerminalId === t.id ? 'bg-zinc-800/50 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800/30 hover:text-zinc-200'}`}
                      >
                        <div className="flex items-center overflow-hidden flex-1">
                          {t.type === 'cmd' ? <TerminalSquare className="w-3.5 h-3.5 mr-2 shrink-0" /> : <TerminalIcon className="w-3.5 h-3.5 mr-2 shrink-0" />}
                          {editingTerminalId === t.id ? (
                            <input
                              autoFocus
                              value={editingTerminalName}
                              onChange={(e) => setEditingTerminalName(e.target.value)}
                              onBlur={saveTerminalName}
                              onKeyDown={(e) => e.key === 'Enter' && saveTerminalName()}
                              className="bg-zinc-900 text-zinc-100 px-1 py-0.5 text-[12px] w-full outline-none border border-zinc-700 rounded"
                            />
                          ) : (
                            <span className="truncate">{t.name}</span>
                          )}
                        </div>
                        {editingTerminalId !== t.id && (
                          <div className="flex items-center space-x-2 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Edit2 
                              className="w-3 h-3 text-zinc-500 hover:text-zinc-200" 
                              onClick={(e) => startRenamingTerminal(e, t)}
                            />
                            <Trash2 
                              className="w-3 h-3 text-zinc-500 hover:text-red-400" 
                              onClick={(e) => removeTerminal(e, t.id)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="h-[24px] bg-zinc-950 text-zinc-500 flex items-center justify-between px-3 text-[12px] shrink-0 select-none border-t border-zinc-800/50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center hover:text-zinc-300 cursor-pointer h-full transition-colors">
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 mr-1.5 fill-current"><path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 13A6 6 0 1 1 8 2a6 6 0 0 1 0 12z"/><path d="M8.5 4.5a.5.5 0 0 0-1 0v3.793L5.354 10.146a.5.5 0 1 0 .708.708L8.5 8.414V4.5z"/></svg>
            <span>0</span>
            <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 ml-3 mr-1.5 fill-current"><path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.046l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.02H1.146a.115.115 0 0 1-.066-.02.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.062a.146.146 0 0 1 .054-.046zM8 3.196 1.869 13h12.262L8 3.196z"/><path d="M7.5 6h1v3.5h-1V6zm0 4.5h1V11.5h-1v-1z"/></svg>
            <span>0</span>
          </div>
          <div className="flex items-center hover:text-zinc-300 cursor-pointer h-full transition-colors" onClick={() => {
            if (!terminalOpen && terminals.length === 0) addTerminal('cmd');
            setTerminalOpen(!terminalOpen);
          }}>
            <TerminalSquare className="w-3.5 h-3.5 mr-1.5" />
            <span>Terminal</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {activeFile && (
            <>
              <span className="hover:text-zinc-300 cursor-pointer h-full flex items-center transition-colors">Ln 1, Col 1</span>
              <span className="hover:text-zinc-300 cursor-pointer h-full flex items-center transition-colors">Spaces: 2</span>
              <span className="hover:text-zinc-300 cursor-pointer h-full flex items-center transition-colors">UTF-8</span>
              <span className="hover:text-zinc-300 cursor-pointer h-full flex items-center transition-colors">CRLF</span>
              <span className="hover:text-zinc-300 cursor-pointer h-full flex items-center uppercase transition-colors">{activeFile.language}</span>
            </>
          )}
          <span className="hover:text-zinc-300 cursor-pointer h-full flex items-center transition-colors">
            <Bell className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
      </div>
    </div>
  );
}
