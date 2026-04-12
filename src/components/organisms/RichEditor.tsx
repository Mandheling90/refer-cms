'use client';

import { useEffect, useRef, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import type { Editor, FileLoader } from 'ckeditor5';
import {
  ClassicEditor,
  Essentials,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Paragraph,
  Link,
  List,
  Alignment,
  Font,
  Table,
  TableToolbar,
  MediaEmbed,
  BlockQuote,
  Indent,
  IndentBlock,
  Undo,
  Image,
  ImageUpload,
  ImageToolbar,
  ImageStyle,
  ImageResize,
  SourceEditing,
  HorizontalLine,
  RemoveFormat,
} from 'ckeditor5';
import { uploadFile } from '@/lib/api/graphql';

import 'ckeditor5/ckeditor5.css';

// ── CKEditor 커스텀 업로드 어댑터 (서버 업로드) ──
class ServerUploadAdapter {
  private loader: FileLoader;
  constructor(loader: FileLoader) {
    this.loader = loader;
  }
  async upload(): Promise<{ default: string }> {
    const file = await this.loader.file;
    if (!file) throw new Error('파일을 읽을 수 없습니다.');
    const result = await uploadFile(file);
    return { default: result.url };
  }
  abort() {
    // 서버 업로드는 중간 취소 미지원
  }
}

function ServerUploadAdapterPlugin(editor: Editor) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: FileLoader) =>
    new ServerUploadAdapter(loader);
}

interface RichEditorProps {
  value?: string;
  onChange?: (data: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: number;
}

export function RichEditor({
  value = '',
  onChange,
  placeholder = '내용을 입력하세요',
  disabled = false,
  minHeight = 200,
}: RichEditorProps) {
  const editorRef = useRef<ClassicEditor | null>(null);
  const [ready, setReady] = useState(false);

  // 외부 value 변경 시 에디터 동기화
  useEffect(() => {
    if (ready && editorRef.current) {
      const currentData = editorRef.current.getData();
      if (value !== currentData) {
        editorRef.current.setData(value);
      }
    }
  }, [value, ready]);

  return (
    <div
      className="ck-editor-wrapper"
      style={{
        ['--ck-editor-min-height' as string]: `${minHeight}px`,
      }}
    >
      <CKEditor
        editor={ClassicEditor}
        disabled={disabled}
        config={{
          extraPlugins: [ServerUploadAdapterPlugin],
          plugins: [
            Essentials,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Heading,
            Paragraph,
            Link,
            List,
            Alignment,
            Font,
            Table,
            TableToolbar,
            MediaEmbed,
            BlockQuote,
            Indent,
            IndentBlock,
            Undo,
            Image,
            ImageUpload,
            ImageToolbar,
            ImageStyle,
            ImageResize,
            SourceEditing,
            HorizontalLine,
            RemoveFormat,
          ],
          toolbar: {
            items: [
              'heading',
              '|',
              'bold',
              'italic',
              'underline',
              'strikethrough',
              'removeFormat',
              '|',
              'fontSize',
              'fontColor',
              'fontBackgroundColor',
              '|',
              'alignment',
              '|',
              'bulletedList',
              'numberedList',
              'outdent',
              'indent',
              '|',
              'link',
              'insertTable',
              'blockQuote',
              'horizontalLine',
              'imageUpload',
              'mediaEmbed',
              '|',
              'sourceEditing',
              '|',
              'undo',
              'redo',
            ],
            shouldNotGroupWhenFull: false,
          },
          licenseKey: 'GPL',
          placeholder,
          table: {
            contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'],
          },
          image: {
            toolbar: [
              'imageStyle:inline',
              'imageStyle:block',
              'imageStyle:side',
              '|',
              'imageTextAlternative',
            ],
          },
        }}
        data={value}
        onReady={(editor) => {
          editorRef.current = editor;
          // 최소 높이 설정
          const editableEl = editor.ui.view.editable.element;
          if (editableEl) {
            editableEl.style.minHeight = `${minHeight}px`;
          }
          setReady(true);
        }}
        onChange={(_, editor) => {
          const data = editor.getData();
          onChange?.(data);
        }}
      />
    </div>
  );
}
