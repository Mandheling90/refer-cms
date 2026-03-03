'use client';

import { useRef, useCallback, useEffect, useImperativeHandle, forwardRef } from 'react';
import grapesjs, { type Editor } from 'grapesjs';
import GjsEditor from '@grapesjs/react';
import gjsPresetWebpage from 'grapesjs-preset-webpage';
import { uploadFile } from '@/lib/api/graphql';

import 'grapesjs/dist/css/grapes.min.css';

interface PageEditorProps {
  value?: string;
  onChange?: (html: string) => void;
}

export interface PageEditorHandle {
  /** 현재 에디터 상태에서 전체 HTML 문서를 반환 */
  getCurrentHtml: () => string;
}

/** DOMParser로 전체 HTML 문서에서 style과 body를 분리 */
function parseFullHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const styles = Array.from(doc.querySelectorAll('style'))
    .map((s) => s.textContent || '')
    .join('\n');

  const bodyHtml = doc.body?.innerHTML || html;
  return { styles, bodyHtml };
}

/** GrapesJS 출력을 완전한 HTML 문서로 조합 */
function buildFullHtml(html: string, css: string) {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
${css}
  </style>
</head>
<body>
${html}
</body>
</html>`;
}

export const PageEditor = forwardRef<PageEditorHandle, PageEditorProps>(
  function PageEditor({ value = '', onChange }, ref) {
    const editorRef = useRef<Editor | null>(null);
    const valueRef = useRef(value);
    const isLoadingRef = useRef(false);
    // 에디터 내부 변경인지 외부 prop 변경인지 구분하는 플래그
    const isInternalChangeRef = useRef(false);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // 외부에서 현재 HTML을 명시적으로 가져올 수 있도록 노출
    useImperativeHandle(ref, () => ({
      getCurrentHtml: () => {
        if (!editorRef.current) return value;
        const html = editorRef.current.getHtml();
        const css = editorRef.current.getCss() || '';
        return buildFullHtml(html, css);
      },
    }));

    // value가 외부에서 바뀌었을 때만 에디터에 로드
    useEffect(() => {
      valueRef.current = value;
      // 에디터 내부 변경으로 인한 value 업데이트는 무시 (피드백 루프 방지)
      if (isInternalChangeRef.current) {
        isInternalChangeRef.current = false;
        return;
      }
      if (editorRef.current && value) {
        isLoadingRef.current = true;
        const { styles, bodyHtml } = parseFullHtml(value);
        editorRef.current.setComponents(bodyHtml);
        editorRef.current.setStyle(styles);
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 100);
      }
    }, [value]);

    const onEditor = useCallback(
      (editor: Editor) => {
        editorRef.current = editor;

        // 초기 HTML 로드
        if (valueRef.current) {
          isLoadingRef.current = true;
          const { styles, bodyHtml } = parseFullHtml(valueRef.current);
          editor.setComponents(bodyHtml);
          editor.setStyle(styles);
          setTimeout(() => {
            isLoadingRef.current = false;
          }, 100);
        }

        // 에셋 매니저 커스텀 업로드 핸들러
        const am = editor.AssetManager;
        const amConfig = am.getConfig();
        amConfig.uploadFile = async (ev: DragEvent) => {
          const files = ev.dataTransfer ? ev.dataTransfer.files : (ev.target as HTMLInputElement).files;
          if (!files) return;
          editor.trigger('asset:upload:start');
          for (let i = 0; i < files.length; i++) {
            try {
              const result = await uploadFile(files[i]);
              am.add({ src: result.url, name: result.originalName });
            } catch {
              console.error('이미지 업로드 실패:', files[i].name);
            }
          }
          editor.trigger('asset:upload:end');
        };

        // 변경 감지 → onChange 호출
        const handleUpdate = () => {
          if (isLoadingRef.current) return;
          const html = editor.getHtml();
          const css = editor.getCss() || '';
          const fullHtml = buildFullHtml(html, css);
          isInternalChangeRef.current = true;
          onChangeRef.current?.(fullHtml);
        };

        editor.on('component:update', handleUpdate);
        editor.on('component:add', handleUpdate);
        editor.on('component:remove', handleUpdate);
        editor.on('style:change', handleUpdate);
      },
      [], // onChangeRef 사용으로 deps 불필요
    );

    return (
      <div className="gjs-editor-wrapper h-full w-full">
        <GjsEditor
          className="h-full"
          grapesjs={grapesjs}
          options={{
            height: '100%',
            storageManager: false,
            plugins: [gjsPresetWebpage],
            pluginsOpts: {
              [gjsPresetWebpage as unknown as string]: {},
            },
            canvas: {
              styles: [
                'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css',
              ],
            },
            deviceManager: {
              devices: [
                { name: 'Desktop', width: '' },
                { name: 'Tablet', width: '768px', widthMedia: '1024px' },
                { name: 'Mobile', width: '375px', widthMedia: '480px' },
              ],
            },
          }}
          onEditor={onEditor}
        />
      </div>
    );
  },
);
