'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  ADMIN_BOARD_SETTINGS_FULL,
  BOARD_POSTS,
  CREATE_BOARD_POST,
  UPDATE_BOARD_POST,
  DELETE_BOARD_POST,
} from '@/lib/graphql/queries/board';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { ChevronLeft, ChevronRight, Code, Eye, FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';

// ── 타입 ──
interface BoardSetting {
  id: string;
  boardId: string;
  name: string;
  templateType: 'BASIC' | 'THUMBNAIL';
  allowAttachments: boolean;
  description: string | null;
  hospitalCode: string;
  createdAt: string;
  updatedAt: string;
}

interface BoardPost {
  id: string;
  boardId: string;
  title: string;
  content: string;
  thumbnailUrl: string | null;
  isPinned: boolean;
  isDeleted: boolean;
  authorId: string;
  viewCount: number;
  startDate: string | null;
  endDate: string | null;
  hospitalCode: string;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── 에디터 타입 판별 ──
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

// ── 템플릿 타입 라벨 ──
function templateLabel(type: string) {
  switch (type) {
    case 'BASIC': return '기본형';
    case 'THUMBNAIL': return '썸네일형';
    default: return type;
  }
}

export default function BoardPage() {
  // ── 그룹 상태 ──
  const [selectedBoard, setSelectedBoard] = useState<BoardSetting | null>(null);
  const [groupSearchName, setGroupSearchName] = useState('');
  const [groupPage, setGroupPage] = useState(1);
  const [groupPageSize, setGroupPageSize] = useState(10);

  // ── 게시물 리스트 상태 ──
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [searchTitle, setSearchTitle] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<BoardPost[]>([]);

  // ── 다이얼로그 상태 ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formThumbnailUrl, setFormThumbnailUrl] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('richtext');
  const [detectedEditorMode, setDetectedEditorMode] = useState<EditorMode | null>(null);
  const [editorSwitchConfirmOpen, setEditorSwitchConfirmOpen] = useState(false);
  const [pendingEditorMode, setPendingEditorMode] = useState<EditorMode | null>(null);
  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [pageEditorKey, setPageEditorKey] = useState(0);
  const pageEditorRef = useRef<PageEditorHandle>(null);

  // ── 삭제 확인 ──
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── 인증 정보 ──
  const hospitalCode = useAuthStore((s) => s.hospitalCode);

  // ── GraphQL: 게시판 설정 ──
  const { data: settingsData } = useQuery<{
    adminBoardSettings: BoardSetting[];
  }>(ADMIN_BOARD_SETTINGS_FULL);

  // ── GraphQL: 게시물 ──
  const { data: postsData, loading, refetch: refetchPosts } = useQuery<{
    boardPosts: { items: BoardPost[]; totalCount: number; hasNextPage: boolean };
  }>(BOARD_POSTS, {
    variables: {
      boardId: selectedBoard?.boardId ?? '',
      pagination: { page: currentPage, limit: pageSize },
      search: appliedSearch || undefined,
    },
    skip: !selectedBoard,
  });

  const [createPost] = useMutation(CREATE_BOARD_POST);
  const [updatePost] = useMutation(UPDATE_BOARD_POST);
  const [deletePost] = useMutation(DELETE_BOARD_POST);

  // ── 데이터 ──
  const allBoards = settingsData?.adminBoardSettings ?? [];
  const posts = postsData?.boardPosts?.items ?? [];
  const totalPosts = postsData?.boardPosts?.totalCount ?? 0;
  const totalPostPages = Math.ceil(totalPosts / pageSize) || 1;

  // ── 그룹 필터링 + 페이징 ──
  const filteredBoards = useMemo(() => {
    if (!groupSearchName) return allBoards;
    return allBoards.filter((b) => b.name.includes(groupSearchName));
  }, [allBoards, groupSearchName]);

  const groupTotalItems = filteredBoards.length;
  const groupTotalPages = Math.ceil(groupTotalItems / groupPageSize) || 1;
  const pagedBoards = useMemo(() => {
    const start = (groupPage - 1) * groupPageSize;
    return filteredBoards.slice(start, start + groupPageSize);
  }, [filteredBoards, groupPage, groupPageSize]);

  // ── 첫 번째 게시판 자동 선택 ──
  useEffect(() => {
    if (allBoards.length > 0 && !selectedBoard) {
      setSelectedBoard(allBoards[0]);
    }
  }, [allBoards, selectedBoard]);

  // ── 게시판 선택 ──
  const handleBoardSelect = (board: BoardSetting) => {
    if (selectedBoard?.id === board.id) return;
    setSelectedBoard(board);
    setCurrentPage(1);
    setSearchTitle('');
    setAppliedSearch('');
    setSelectedRows([]);
  };

  // ── 검색 ──
  const handleSearch = () => {
    setAppliedSearch(searchTitle);
    setCurrentPage(1);
  };

  // ── 미리보기 ──
  const handlePreview = useCallback(() => {
    if (!formContent) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(formContent);
      win.document.close();
    }
  }, [formContent]);

  // ── 에디터 모드 전환 ──
  const handleEditorModeChange = (mode: EditorMode) => {
    if (mode === editorMode) return;
    if (!detectedEditorMode || !formContent) {
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
      setFormContent('');
    }
    setPendingEditorMode(null);
    setEditorSwitchConfirmOpen(false);
  };

  // ── 신규 등록 ──
  const handleOpenDialog = () => {
    setIsEditMode(false);
    setEditingId('');
    setFormTitle('');
    setFormContent('');
    setFormThumbnailUrl('');
    setFormIsPinned(false);
    setEditorMode('richtext');
    setDetectedEditorMode(null);
    setDialogOpen(true);
  };

  // ── 수정 (행 클릭) ──
  const handleRowClick = (row: BoardPost) => {
    setIsEditMode(true);
    setEditingId(row.id);
    setFormTitle(row.title);
    setFormContent(row.content || '');
    setFormThumbnailUrl(row.thumbnailUrl || '');
    setFormIsPinned(row.isPinned);
    const detected = detectEditorMode(row.content);
    setEditorMode(detected);
    setDetectedEditorMode(detected);
    setDialogOpen(true);
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!formTitle.trim()) {
      toast.error('제목은 필수 입력입니다.');
      return;
    }
    try {
      if (isEditMode) {
        await updatePost({
          variables: {
            id: editingId,
            input: {
              title: formTitle.trim(),
              content: formContent,
              thumbnailUrl: formThumbnailUrl || undefined,
              isPinned: formIsPinned,
            },
          },
        });
      } else {
        await createPost({
          variables: {
            input: {
              boardId: selectedBoard?.boardId,
              hospitalCode: hospitalCode?.toUpperCase(),
              title: formTitle.trim(),
              content: formContent,
              thumbnailUrl: formThumbnailUrl || undefined,
              isPinned: formIsPinned,
            },
          },
        });
      }
      toast.success('저장되었습니다.');
      setDialogOpen(false);
      refetchPosts();
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // ── 선택 삭제 ──
  const handleDelete = async () => {
    try {
      await Promise.all(
        selectedRows.map((row) => deletePost({ variables: { id: row.id } })),
      );
      toast.success('삭제되었습니다.');
      setSelectedRows([]);
      refetchPosts();
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setConfirmOpen(false);
  };

  // ── 컬럼 정의 ──
  const columns: ColumnDef<BoardPost, unknown>[] = useMemo(() => {
    const cols: ColumnDef<BoardPost, unknown>[] = [
      {
        accessorKey: 'ROW_NUM',
        header: '번호',
        size: 70,
        cell: ({ row }) => (currentPage - 1) * pageSize + row.index + 1,
      },
    ];

    // 썸네일형 게시판이면 썸네일 컬럼 추가
    if (selectedBoard?.templateType === 'THUMBNAIL') {
      cols.push({
        accessorKey: 'thumbnailUrl',
        header: '썸네일',
        size: 100,
        cell: ({ getValue }) => {
          const url = getValue() as string | null;
          return url ? (
            <img src={url} alt="썸네일" className="w-12 h-12 object-cover rounded" />
          ) : (
            <span className="text-muted-foreground text-xs">-</span>
          );
        },
      });
    }

    cols.push(
      { accessorKey: 'title', header: '게시물 제목', size: 300 },
      {
        accessorKey: 'isPinned',
        header: '공지',
        size: 80,
        cell: ({ getValue }) => (getValue() as boolean) ? '✓' : '-',
      },
      {
        accessorKey: 'createdAt',
        header: '등록일시',
        size: 180,
        cell: ({ getValue }) => formatDateTime(getValue() as string),
      },
    );

    return cols;
  }, [selectedBoard?.templateType, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">게시판 관리</h1>

      <div className="flex gap-6">
        {/* 좌측: 게시판 그룹 */}
        <section className="w-[280px] shrink-0 rounded-xl bg-card shadow-[0_0_12px_rgba(0,0,0,0.1)] flex flex-col">
          <div className="flex items-center justify-between px-6 border-b border-gray-500 min-h-[72px]">
            <b className="text-base">게시판 그룹</b>
            <span className="text-sm text-muted-foreground">
              총 <span className="text-primary font-semibold">{groupTotalItems}</span>건
            </span>
          </div>

          {/* 그룹명 검색 */}
          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={groupSearchName}
                onChange={(e) => {
                  setGroupSearchName(e.target.value);
                  setGroupPage(1);
                }}
                placeholder="게시판명 검색"
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          {/* 안내 문구 */}
          <p className="px-4 pt-2 text-xs text-muted-foreground">
            * 목록 클릭 시 소속된 게시물 추가/수정/삭제가 가능합니다.
          </p>

          {/* 그룹 리스트 */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {pagedBoards.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">
                {groupSearchName ? '검색 결과가 없습니다.' : '등록된 게시판이 없습니다.'}
              </p>
            ) : (
              pagedBoards.map((board) => {
                const isSelected = selectedBoard?.id === board.id;
                return (
                  <button
                    key={board.id}
                    onClick={() => handleBoardSelect(board)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-sm transition-colors cursor-pointer',
                      isSelected
                        ? 'bg-primary text-white font-semibold'
                        : 'hover:bg-gray-300 text-foreground',
                    )}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{board.name}</span>
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full shrink-0',
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-400 text-foreground',
                      )}
                    >
                      {templateLabel(board.templateType)}
                    </span>
                  </button>
                );
              })
            )}
          </nav>

          {/* 그룹 페이징 */}
          <div className="border-t border-gray-300 px-3 py-2">
            <div className="flex items-center justify-between">
              <select
                value={groupPageSize}
                onChange={(e) => {
                  setGroupPageSize(Number(e.target.value));
                  setGroupPage(1);
                }}
                className="text-xs border border-gray-300 rounded px-1.5 py-1 bg-white"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n}건</option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setGroupPage((p) => Math.max(1, p - 1))}
                  disabled={groupPage <= 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-gray-600 min-w-[60px] text-center">
                  {groupPage} / {groupTotalPages}
                </span>
                <button
                  onClick={() => setGroupPage((p) => Math.min(groupTotalPages, p + 1))}
                  disabled={groupPage >= groupTotalPages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 우측: 게시물 목록 */}
        <section className="flex-1 rounded-xl bg-card shadow-[0_0_12px_rgba(0,0,0,0.1)]">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4">
            <b className="text-base">
              {selectedBoard
                ? `${selectedBoard.name}`
                : '게시판을 선택하세요'}
              {selectedBoard && (
                <span className="ml-2 font-normal text-sm text-muted-foreground">
                  총 <span className="text-primary font-semibold">{totalPosts}</span>건
                </span>
              )}
            </b>
            <div className="flex items-center gap-2">
              <Button
                variant="outline-red"
                size="md"
                onClick={() => {
                  if (selectedRows.length === 0) {
                    toast.error('삭제할 게시물을 선택하세요.');
                    return;
                  }
                  setConfirmOpen(true);
                }}
                disabled={!selectedBoard || selectedRows.length === 0}
              >
                <Trash2 className="h-4 w-4" />
                선택한 항목 삭제
              </Button>
              <Button
                size="md"
                onClick={handleOpenDialog}
                disabled={!selectedBoard}
              >
                <Plus className="h-4 w-4" />
                신규 등록
              </Button>
            </div>
          </div>

          {/* 검색 */}
          {selectedBoard && (
            <div className="border-t border-gray-500 px-6 py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex items-end gap-4"
              >
                <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                  <label className="text-sm font-semibold text-foreground">제목</label>
                  <Input
                    value={searchTitle}
                    onChange={(e) => setSearchTitle(e.target.value)}
                    placeholder="제목 검색"
                  />
                </div>
              </form>
            </div>
          )}

          {/* 테이블 */}
          <div className="border-t border-gray-500 px-6 py-5">
            {selectedBoard ? (
              <DataTable
                columns={columns}
                data={posts}
                loading={loading}
                totalItems={totalPosts}
                currentPage={currentPage}
                pageSize={pageSize}
                totalPages={totalPostPages}
                enableSelection
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                onRowClick={handleRowClick}
                onSelectionChange={setSelectedRows}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                좌측에서 게시판을 선택하세요.
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
            <DialogTitle>{isEditMode ? '게시물 수정' : '게시물 등록'}</DialogTitle>
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

            {/* 공지 여부 */}
            <div className="space-y-1.5">
              <Label>공지 여부</Label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsPinned}
                  onChange={(e) => setFormIsPinned(e.target.checked)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm">공지로 등록</span>
              </label>
            </div>

            {/* 썸네일 URL (썸네일형 게시판) */}
            {selectedBoard?.templateType === 'THUMBNAIL' && (
              <div className="space-y-1.5">
                <Label>썸네일 URL</Label>
                <Input
                  value={formThumbnailUrl}
                  onChange={(e) => setFormThumbnailUrl(e.target.value)}
                  placeholder="썸네일 이미지 URL을 입력하세요"
                />
                {formThumbnailUrl && (
                  <img
                    src={formThumbnailUrl}
                    alt="썸네일 미리보기"
                    className="w-24 h-24 object-cover rounded border mt-2"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
              </div>
            )}

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
                    disabled={!formContent}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    미리보기
                  </Button>
                </div>
              </div>
              {editorMode === 'richtext' ? (
                <RichEditor
                  value={formContent}
                  onChange={(data) => setFormContent(data)}
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
                disabled={!formContent}
              >
                <Eye className="h-4 w-4" />
                미리보기
              </Button>
              <Button
                size="md"
                onClick={() => {
                  if (pageEditorRef.current) {
                    const html = pageEditorRef.current.getCurrentHtml();
                    setFormContent(html);
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
                value={formContent}
                onChange={(html) => setFormContent(html)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="게시물 삭제"
        description={`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까?`}
        onConfirm={handleDelete}
        destructive
      />
    </div>
  );
}
