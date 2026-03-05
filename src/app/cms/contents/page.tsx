'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery, useMutation } from '@apollo/client/react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { RichEditor } from '@/components/organisms/RichEditor';
import type { PageEditorHandle } from '@/components/organisms/PageEditor';

const PageEditor = dynamic(
  () => import('@/components/organisms/PageEditor').then((mod) => ({ default: mod.PageEditor })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">페이지 에디터 로딩중...</div> },
);
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import {
  ADMIN_CONTENT_GROUPS,
  ADMIN_CONTENTS,
  CREATE_CONTENT,
  UPDATE_CONTENT,
} from '@/lib/graphql/queries/content';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Code, Eye, FolderOpen, Pencil, Plus } from 'lucide-react';

// ── 타입 ──
interface ContentGroup {
  id: string;
  hospitalCode: string;
  name: string;
  sortOrder: number;
  contentCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Content {
  id: string;
  hospitalCode: string;
  title: string;
  body: string;
  contentGroupId: string;
  contentGroupName: string;
  createdAt: string;
  updatedAt: string;
}

// ── 에디터 타입 판별 유틸 ──
type EditorMode = 'richtext' | 'pageeditor';

function detectEditorMode(html: string | undefined): EditorMode {
  if (!html) return 'richtext';
  return (html.includes('<!DOCTYPE') || html.includes('<html') || html.includes('<style'))
    ? 'pageeditor'
    : 'richtext';
}

// ── 날짜 포맷 ──
function formatDateTime(iso: string) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ── 컬럼 정의 ──
const columns: ColumnDef<Content, unknown>[] = [
  {
    accessorKey: 'ROW_NUM',
    header: '번호',
    size: 70,
    cell: ({ row }) => row.index + 1,
  },
  { accessorKey: 'title', header: '제목', size: 300 },
  {
    accessorKey: 'createdAt',
    header: '등록일시',
    size: 180,
    cell: ({ getValue }) => formatDateTime(getValue() as string),
  },
];

export default function ContentsPage() {
  // 그룹 상태
  const [selectedGroup, setSelectedGroup] = useState<ContentGroup | null>(null);

  // 콘텐츠 리스트 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchName, setSearchName] = useState('');

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [editorMode, setEditorMode] = useState<EditorMode>('richtext');
  const [detectedEditorMode, setDetectedEditorMode] = useState<EditorMode | null>(null);
  const [editorSwitchConfirmOpen, setEditorSwitchConfirmOpen] = useState(false);
  const [pendingEditorMode, setPendingEditorMode] = useState<EditorMode | null>(null);
  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [pageEditorKey, setPageEditorKey] = useState(0);
  const pageEditorRef = useRef<PageEditorHandle>(null);

  // 인증 정보
  const hospitalCode = useAuthStore((s) => s.hospitalCode);

  // ── GraphQL ──
  const { data: groupsData, refetch: refetchGroups } = useQuery<{
    adminContentGroups: ContentGroup[];
  }>(ADMIN_CONTENT_GROUPS);

  const { data: contentsData, loading, refetch: refetchContents } = useQuery<{
    adminContents: Content[];
  }>(ADMIN_CONTENTS);

  const [createContent] = useMutation(CREATE_CONTENT);
  const [updateContent] = useMutation(UPDATE_CONTENT);

  // ── 데이터 ──
  const groups = groupsData?.adminContentGroups ?? [];
  const allContents = contentsData?.adminContents ?? [];

  // 첫 번째 그룹 자동 선택
  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0]);
    }
  }, [groups, selectedGroup]);

  // ── 클라이언트 필터링 + 페이징 ──
  const filtered = useMemo(() => {
    if (!selectedGroup) return [];
    let items = allContents.filter((c) => c.contentGroupId === selectedGroup.id);
    if (searchName) {
      items = items.filter((c) => c.title.includes(searchName));
    }
    return items;
  }, [allContents, selectedGroup, searchName]);

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // ── 미리보기 ──
  const handlePreview = useCallback(() => {
    if (!formBody) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(formBody);
      win.document.close();
    }
  }, [formBody]);

  // ── 그룹 선택 ──
  const handleGroupSelect = (group: ContentGroup) => {
    if (selectedGroup?.id === group.id) return;
    setSelectedGroup(group);
    setCurrentPage(1);
    setSearchName('');
  };

  // ── 검색 ──
  const handleSearch = () => {
    setCurrentPage(1);
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('제목은 필수 입력입니다.');
      return;
    }
    try {
      if (isEditMode) {
        await updateContent({
          variables: {
            id: editingId,
            input: {
              title: formTitle.trim(),
              body: formBody,
              contentGroupId: selectedGroup?.id,
            },
          },
        });
      } else {
        await createContent({
          variables: {
            input: {
              title: formTitle.trim(),
              body: formBody,
              contentGroupId: selectedGroup?.id,
              hospitalCode: hospitalCode?.toUpperCase(),
            },
          },
        });
      }
      toast.success('저장되었습니다.');
      setDialogOpen(false);
      refetchContents();
      refetchGroups();
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // ── 에디터 모드 전환 ──
  const handleEditorModeChange = (mode: EditorMode) => {
    if (mode === editorMode) return;
    if (!detectedEditorMode || !formBody) {
      setEditorMode(mode);
      return;
    }
    if (mode !== detectedEditorMode) {
      setPendingEditorMode(mode);
      setEditorSwitchConfirmOpen(true);
    } else {
      setEditorMode(mode);
    }
  };

  const handleEditorSwitchConfirm = () => {
    if (pendingEditorMode) {
      setEditorMode(pendingEditorMode);
      setFormBody('');
    }
    setPendingEditorMode(null);
    setEditorSwitchConfirmOpen(false);
  };

  // ── 신규 등록 ──
  const handleOpenDialog = () => {
    setIsEditMode(false);
    setEditingId('');
    setFormTitle('');
    setFormBody('');
    setEditorMode('richtext');
    setDetectedEditorMode(null);
    setDialogOpen(true);
  };

  // ── 수정 (행 클릭) ──
  const handleRowClick = (row: Content) => {
    setIsEditMode(true);
    setEditingId(row.id);
    setFormTitle(row.title);
    setFormBody(row.body || '');
    const detected = detectEditorMode(row.body);
    setEditorMode(detected);
    setDetectedEditorMode(detected);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">콘텐츠 관리</h1>

      <div className="flex gap-6">
        {/* 좌측: 콘텐츠 그룹 영역 */}
        <section className="w-[260px] shrink-0 rounded-xl bg-card shadow-[0_0_12px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-500">
            <b className="text-base">콘텐츠 그룹</b>
            <span className="text-sm text-muted-foreground">
              총 <span className="text-primary font-semibold">{groups.length}</span>건
            </span>
          </div>
          <nav className="p-3 space-y-1 max-h-[calc(100vh-260px)] overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">
                등록된 그룹이 없습니다.
              </p>
            ) : (
              groups.map((group) => {
                const isSelected = selectedGroup?.id === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => handleGroupSelect(group)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-primary text-white font-semibold'
                        : 'hover:bg-gray-300 text-foreground',
                    )}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{group.name}</span>
                    {group.contentCount != null && (
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-400 text-foreground',
                        )}
                      >
                        {group.contentCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </section>

        {/* 우측: 그룹 별 콘텐츠 */}
        <section className="flex-1 rounded-xl bg-card shadow-[0_0_12px_rgba(0,0,0,0.1)]">
          {/* 헤더: 그룹명 + 건수 + 버튼 */}
          <div className="flex items-center justify-between px-6 py-4">
            <b className="text-base">
              {selectedGroup
                ? `${selectedGroup.name} 콘텐츠`
                : '그룹을 선택하세요'}
              {selectedGroup && (
                <span className="ml-2 font-normal text-sm text-muted-foreground">
                  총 <span className="text-primary font-semibold">{totalItems}</span>건
                </span>
              )}
            </b>
            <div className="flex items-center gap-2">
              <Button
                size="md"
                onClick={handleOpenDialog}
                disabled={!selectedGroup}
              >
                <Plus className="h-4 w-4" />
                신규 등록
              </Button>
            </div>
          </div>

          {/* 검색 */}
          {selectedGroup && (
            <div className="border-t border-gray-500 px-6 py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex items-end gap-4"
              >
                <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                  <label className="text-sm font-semibold text-foreground">
                    제목
                  </label>
                  <Input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="제목 검색"
                  />
                </div>
              </form>
            </div>
          )}

          {/* 테이블 */}
          <div className="border-t border-gray-500 px-6 py-5">
            {selectedGroup ? (
              <DataTable
                columns={columns}
                data={pagedData}
                loading={loading}
                totalItems={totalItems}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                onRowClick={handleRowClick}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                좌측에서 콘텐츠 그룹을 선택하세요.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* 등록/수정 팝업 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          size="lg"
          className="max-h-[90vh] flex flex-col"
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.ck-body-wrapper') || target.closest('.ck-balloon-panel') || target.closest('.ck-dialog')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditMode ? '콘텐츠 수정' : '콘텐츠 등록'}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5 overflow-y-auto flex-1">
            {/* 제목 */}
            <div className="space-y-1.5">
              <Label>제목 <span className="text-destructive">*</span></Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="제목을 입력하세요"
              />
            </div>

            {/* 에디터 (본문) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>본문</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={editorMode === 'richtext' ? 'default' : 'outline'}
                    size="md"
                    onClick={() => handleEditorModeChange('richtext')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    간편 에디터
                  </Button>
                  <Button
                    type="button"
                    variant={editorMode === 'pageeditor' ? 'default' : 'outline'}
                    size="md"
                    onClick={() => handleEditorModeChange('pageeditor')}
                  >
                    <Code className="h-3.5 w-3.5" />
                    페이지 에디터
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    onClick={handlePreview}
                    disabled={!formBody}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    미리보기
                  </Button>
                </div>
              </div>
              {editorMode === 'richtext' ? (
                <RichEditor
                  value={formBody}
                  onChange={(data) => setFormBody(data)}
                  placeholder="내용을 입력하세요"
                  minHeight={200}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-400 p-6 text-center text-sm text-muted-foreground">
                  <p>페이지 에디터로 편집 중입니다.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="md"
                    className="mt-3"
                    onClick={() => {
                      setPageEditorKey((k) => k + 1);
                      setPageEditorOpen(true);
                    }}
                  >
                    <Code className="h-3.5 w-3.5" />
                    페이지 에디터 열기
                  </Button>
                </div>
              )}
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button size="md" onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 에디터 전환 경고 */}
      <ConfirmDialog
        open={editorSwitchConfirmOpen}
        onOpenChange={setEditorSwitchConfirmOpen}
        title="에디터 변경"
        description="다른 에디터로 전환하면 현재 스타일 구조가 손실될 수 있습니다. 기존 본문 내용이 초기화됩니다. 계속하시겠습니까?"
        onConfirm={handleEditorSwitchConfirm}
        destructive
      />

      {/* GrapesJS 풀스크린 에디터 */}
      <Dialog open={pageEditorOpen} onOpenChange={setPageEditorOpen}>
        <DialogContent
          size="fullscreen"
          className="flex flex-col p-0"
          showCloseButton={false}
          onPointerDownOutside={(e) => {
            const target = e.target as HTMLElement;
            if (target.closest('.gjs-') || target.closest('.sp-')) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="flex-row items-center justify-between px-4 py-3 shrink-0">
            <DialogTitle className="text-lg">페이지 에디터</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="md"
                onClick={handlePreview}
                disabled={!formBody}
              >
                <Eye className="h-4 w-4" />
                미리보기
              </Button>
              <Button
                size="md"
                onClick={() => {
                  if (pageEditorRef.current) {
                    const html = pageEditorRef.current.getCurrentHtml();
                    setFormBody(html);
                  }
                  setPageEditorOpen(false);
                }}
              >
                편집 완료
              </Button>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {pageEditorOpen && (
              <PageEditor
                key={pageEditorKey}
                ref={pageEditorRef}
                value={formBody}
                onChange={(html) => setFormBody(html)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
