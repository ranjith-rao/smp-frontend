import React, { useEffect, useRef } from 'react';

const toolbarButtonStyle = {
  border: '1px solid #cbd5e1',
  background: '#fff',
  color: '#334155',
  borderRadius: '6px',
  padding: '6px 8px',
  fontSize: '12px',
  cursor: 'pointer',
};

const RichTextEditor = ({ value, onChange, minHeight = 180 }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== (value || '')) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command) => {
    document.execCommand(command, false);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', padding: '8px', display: 'flex', gap: '6px', flexWrap: 'wrap', background: '#f8fafc' }}>
        <button type="button" onClick={() => exec('bold')} style={toolbarButtonStyle}><strong>B</strong></button>
        <button type="button" onClick={() => exec('italic')} style={toolbarButtonStyle}><em>I</em></button>
        <button type="button" onClick={() => exec('underline')} style={toolbarButtonStyle}><u>U</u></button>
        <button type="button" onClick={() => exec('insertUnorderedList')} style={toolbarButtonStyle}>• List</button>
        <button type="button" onClick={() => exec('insertOrderedList')} style={toolbarButtonStyle}>1. List</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={(e) => onChange(e.currentTarget.innerHTML)}
        style={{ minHeight, padding: '12px', outline: 'none', color: '#0f172a', fontSize: '14px', lineHeight: 1.55 }}
      />
    </div>
  );
};

export default RichTextEditor;
