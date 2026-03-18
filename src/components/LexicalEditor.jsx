import { useEffect, useCallback, useRef, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  $getRoot,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode, $isHeadingNode } from '@lexical/rich-text';
import { $isListNode, INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND, REMOVE_LIST_COMMAND } from '@lexical/list';
import { mergeRegister } from '@lexical/utils';
import '../styles/LexicalEditor.css';

// Floating Toolbar Plugin
function FloatingTextFormatToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isText, setIsText] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isHeading, setIsHeading] = useState(false);
  const [isBulletList, setIsBulletList] = useState(false);
  const [isNumberedList, setIsNumberedList] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0, show: false });

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    
    if ($isRangeSelection(selection)) {
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      
      // Check if we're in a heading
      const anchorNode = selection.anchor.getNode();
      const element = anchorNode.getKey() === 'root' ? anchorNode : anchorNode.getTopLevelElementOrThrow();
      const elementDOM = editor.getElementByKey(element.getKey());
      setIsHeading(elementDOM?.tagName === 'H3');
      
      // Check if we're in a list - traverse up the tree
      let node = anchorNode;
      let inBulletList = false;
      let inNumberedList = false;
      
      while (node) {
        if ($isListNode(node)) {
          const listType = node.getListType();
          if (listType === 'bullet') {
            inBulletList = true;
          } else if (listType === 'number') {
            inNumberedList = true;
          }
          break;
        }
        node = node.getParent();
      }
      
      setIsBulletList(inBulletList);
      setIsNumberedList(inNumberedList);
      
      if (!selection.isCollapsed()) {
        setIsText(true);
        const nativeSelection = window.getSelection();
        if (nativeSelection && nativeSelection.rangeCount > 0) {
          const range = nativeSelection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            setToolbarPosition({
              top: rect.top - 52,
              left: rect.left + rect.width / 2,
              show: true,
            });
          }
        }
      } else {
        setIsText(false);
        setToolbarPosition((prev) => ({ ...prev, show: false }));
      }
    } else {
      setIsText(false);
      setToolbarPosition((prev) => ({ ...prev, show: false }));
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateToolbar();
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  if (!isText || !toolbarPosition.show) {
    return null;
  }

  const toggleHeading = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // Get the anchor node and find its parent block
        const anchorNode = selection.anchor.getNode();
        const topBlock = anchorNode.getTopLevelElementOrThrow();
        
        if ($isHeadingNode(topBlock)) {
          // If current block is a heading, convert it back to paragraph
          topBlock.replace($createParagraphNode());
        } else {
          // Convert only the current block to heading
          topBlock.replace($createHeadingNode('h3'));
        }
      }
    });
  };

  const toggleBulletList = () => {
    if (isBulletList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    }
  };

  const toggleNumberedList = () => {
    if (isNumberedList) {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    }
  };

  return (
    <div
      className="lexical-floating-toolbar"
      style={{
        position: 'fixed',
        top: `${toolbarPosition.top}px`,
        left: `${toolbarPosition.left}px`,
        transform: 'translateX(-50%)',
        zIndex: 3000,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
        className={isBold ? 'active' : ''}
        aria-label="Format Bold"
        title="Bold (Ctrl+B)"
      >
        <strong>B</strong>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
        className={isItalic ? 'active' : ''}
        aria-label="Format Italic"
        title="Italic (Ctrl+I)"
      >
        <em>I</em>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
        className={isUnderline ? 'active' : ''}
        aria-label="Format Underline"
        title="Underline (Ctrl+U)"
      >
        <span style={{ textDecoration: 'underline' }}>U</span>
      </button>
      <button
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
        className={isStrikethrough ? 'active' : ''}
        aria-label="Format Strikethrough"
        title="Strikethrough"
      >
        <span style={{ textDecoration: 'line-through' }}>S</span>
      </button>
      <span className="divider" />
      <button
        onClick={toggleHeading}
        className={isHeading ? 'active' : ''}
        aria-label="Heading"
        title="Heading 3"
      >
        <strong>H</strong>
      </button>
      <span className="divider" />
      <button
        onClick={toggleBulletList}
        className={isBulletList ? 'active' : ''}
        aria-label="Bullet List"
        title="Bullet List"
      >
        <span style={{ fontSize: '18px' }}>•</span>
      </button>
      <button
        onClick={toggleNumberedList}
        className={isNumberedList ? 'active' : ''}
        aria-label="Numbered List"
        title="Numbered List"
      >
        <span style={{ fontWeight: 600 }}>1.</span>
      </button>
    </div>
  );
}

function InitialContentPlugin({ initialContent }) {
  const [editor] = useLexicalComposerContext();
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const plainText = (() => {
      if (!initialContent) return '';
      const parser = new DOMParser();
      const dom = parser.parseFromString(initialContent, 'text/html');
      return (dom.body?.textContent || '').trim();
    })();

    editor.update(() => {
      const root = $getRoot();
      root.clear();

      const paragraph = $createParagraphNode();
      if (plainText) {
        paragraph.append($createTextNode(plainText));
      }
      root.append(paragraph);
    });
  }, [editor, initialContent]);

  return null;
}

export default function LexicalEditor({ 
  placeholder, 
  onChange, 
  initialContent = '',
  contentEditableClassName = '',
  contentEditableStyle = {},
}) {
  const initialConfig = {
    namespace: 'SocialMediaPost',
    theme: {
      paragraph: 'lexical-paragraph',
      heading: {
        h3: 'lexical-heading-h3',
      },
      list: {
        ul: 'lexical-list-ul',
        ol: 'lexical-list-ol',
        listitem: 'lexical-list-item',
      },
      text: {
        bold: 'lexical-text-bold',
        italic: 'lexical-text-italic',
        underline: 'lexical-text-underline',
        strikethrough: 'lexical-text-strikethrough',
      },
    },
    onError: (error) => {
      console.error('Lexical Error:', error);
    },
    nodes: [HeadingNode, ListNode, ListItemNode],
  };

  const handleChange = (editorState, editor) => {
    editorState.read(() => {
      if (!onChange) return;
      const editorElement = editor.getRootElement();
      onChange(editorElement?.innerHTML || '');
    });
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="lexical-editor-container">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={`lexical-content-editable ${contentEditableClassName}`.trim()}
              style={contentEditableStyle}
            />
          }
          placeholder={<div className="lexical-placeholder">{placeholder}</div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <InitialContentPlugin initialContent={initialContent} />
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
        <ListPlugin />
        <FloatingTextFormatToolbarPlugin />
      </div>
    </LexicalComposer>
  );
}
