'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { ListPageTemplate } from '@/components/templates/ListPageTemplate';
import { SearchBar } from '@/components/molecules/SearchBar';
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import { boardApi } from '@/lib/api/board';
import type { Board } from '@/types/board';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { Plus, Trash2 } from 'lucide-react';

// ── Mock 모드 (API 연동 전까지 true) ──
const USE_MOCK = true;
const STORAGE_KEY = 'cms_board_config';

const MOCK_DATA: Board[] = [
  { BOARD_ID: 'notice', BOARD_NAME: '공지사항', BOARD_TYPE: 'basic', USE_YN: 'Y', FILE_ATTACH_YN: 'Y', BOARD_DESC: '공지사항 게시판', INSERT_USER: '김주환', INSERT_DTTM: '2025-04-29 09:17:24' },
  { BOARD_ID: 'press', BOARD_NAME: '언론보도', BOARD_TYPE: 'press', USE_YN: 'Y', FILE_ATTACH_YN: 'N', BOARD_DESC: '언론보도 게시판', INSERT_USER: '이준용', INSERT_DTTM: '2025-04-25 14:30:00' },
  { BOARD_ID: 'gallery', BOARD_NAME: '포토갤러리', BOARD_TYPE: 'thumbnail', USE_YN: 'Y', FILE_ATTACH_YN: 'Y', BOARD_DESC: '사진 갤러리 게시판', INSERT_USER: '김주환', INSERT_DTTM: '2025-04-21 10:00:00' },
  { BOARD_ID: 'consult', BOARD_NAME: '협진 컨설팅 신청', BOARD_TYPE: 'consult', USE_YN: 'Y', FILE_ATTACH_YN: 'Y', BOARD_DESC: '협진 컨설팅 신청 게시판', INSERT_USER: '이준용', INSERT_DTTM: '2025-04-18 09:00:00' },
  { BOARD_ID: 'faq', BOARD_NAME: 'FAQ', BOARD_TYPE: 'basic', USE_YN: 'Y', FILE_ATTACH_YN: 'N', BOARD_DESC: '자주 묻는 질문', INSERT_USER: '김주환', INSERT_DTTM: '2025-04-15 11:20:00' },
  { BOARD_ID: 'event', BOARD_NAME: '교육/행사', BOARD_TYPE: 'thumbnail', USE_YN: 'N', FILE_ATTACH_YN: 'Y', BOARD_DESC: '교육 및 행사 안내 게시판', INSERT_USER: '이준용', INSERT_DTTM: '2025-04-10 08:45:00' },
];

// ── 게시판 타입 옵션 ──
const BOARD_TYPE_OPTIONS = [
  { value: 'basic', label: '기본형' },
  { value: 'thumbnail', label: '썸네일형' },
  { value: 'press', label: '언론보도' },
  { value: 'consult', label: '협진 컨설팅 신청' },
] as const;

// ── 사용여부 검색 옵션 ──
const USE_YN_SEARCH_OPTIONS = [
  { value: '_all', label: '전체' },
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

// ── 게시판 아이디 유효성 검사 (영문자+숫자 조합, 12자 이내) ──
const BOARD_ID_REGEX = /^[a-zA-Z0-9]{1,12}$/;

// ── 컬럼 정의 ──
const columns: ColumnDef<Board, unknown>[] = [
  {
    accessorKey: 'ROW_NUM',
    header: '번호',
    size: 70,
    cell: ({ row }) => row.index + 1,
  },
  { accessorKey: 'BOARD_ID', header: '아이디', size: 140 },
  {
    accessorKey: 'BOARD_TYPE',
    header: '타입',
    size: 100,
    cell: ({ getValue }) => {
      const val = getValue() as string;
      return BOARD_TYPE_OPTIONS.find((o) => o.value === val)?.label || val || '-';
    },
  },
  { accessorKey: 'BOARD_NAME', header: '게시판명', size: 200 },
  {
    accessorKey: 'USE_YN',
    header: '사용여부',
    size: 90,
    cell: ({ getValue }) => (
      <StatusBadge status={(getValue() as string) || 'N'} />
    ),
  },
  {
    accessorKey: 'FILE_ATTACH_YN',
    header: '첨부파일',
    size: 90,
    cell: ({ getValue }) => (
      <StatusBadge
        status={(getValue() as string) || 'N'}
        activeLabel="허용"
        inactiveLabel="미허용"
      />
    ),
  },
  { accessorKey: 'INSERT_DTTM', header: '등록일시', size: 160 },
];

export default function BoardConfigPage() {
  // ── 리스트 상태 ──
  const [data, setData] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Board[]>([]);

  // ── 검색 상태 ──
  const [searchBoardName, setSearchBoardName] = useState('');
  const [searchBoardId, setSearchBoardId] = useState('');
  const [searchUseYn, setSearchUseYn] = useState('_all');

  // ── 다이얼로그 상태 ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<Board>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── 중복확인 상태 ──
  const [idChecked, setIdChecked] = useState(false);
  const [idChecking, setIdChecking] = useState(false);

  // ── Mock 데이터 저장소 (localStorage 연동) ──
  const mockDataRef = useRef<Board[]>(null!);
  if (mockDataRef.current === null) {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
      mockDataRef.current = stored ? JSON.parse(stored) : JSON.parse(JSON.stringify(MOCK_DATA));
    } catch {
      mockDataRef.current = JSON.parse(JSON.stringify(MOCK_DATA));
    }
  }

  const syncToStorage = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mockDataRef.current));
    } catch (e) {
      console.error('localStorage 저장 실패:', e);
    }
  }, []);

  const user = useAuthStore((s) => s.user);
  const currentUserName = user?.USER_NM || '관리자';

  // ── 목록 조회 ──
  const retrieveList = useCallback(
    async (page = 1, size = pageSize) => {
      setLoading(true);
      if (USE_MOCK) {
        let items = [...mockDataRef.current];
        if (searchBoardName) items = items.filter((i) => i.BOARD_NAME.includes(searchBoardName));
        if (searchBoardId) items = items.filter((i) => i.BOARD_ID.includes(searchBoardId));
        if (searchUseYn !== '_all') items = items.filter((i) => i.USE_YN === searchUseYn);
        const total = items.length;
        const start = (page - 1) * size;
        const paged = items.slice(start, start + size);
        setData(paged);
        setTotalItems(total);
        setLoading(false);
        return;
      }
      try {
        const params: Record<string, unknown> = {
          CURRENT_PAGE: page,
          SHOWN_ENTITY: size,
        };
        if (searchBoardName) params.BOARD_NAME = searchBoardName;
        if (searchBoardId) params.BOARD_ID = searchBoardId;
        if (searchUseYn !== '_all') params.USE_YN = searchUseYn;

        const res = await boardApi.configList(params);
        setData(res.list || []);
        setTotalItems(res.TOTAL_ENTITY || 0);
      } catch {
        toast.error('목록 조회에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize, searchBoardName, searchBoardId, searchUseYn],
  );

  // ── 초기 로딩 ──
  useEffect(() => {
    retrieveList(1, pageSize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 검색 ──
  const handleSearch = () => {
    setCurrentPage(1);
    retrieveList(1, pageSize);
  };

  // ── 검색 조건 초기화 ──
  const handleReset = () => {
    setSearchBoardName('');
    setSearchBoardId('');
    setSearchUseYn('_all');
    setCurrentPage(1);
    retrieveList(1, pageSize);
  };

  // ── 신규 등록 다이얼로그 ──
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({ USE_YN: 'Y', FILE_ATTACH_YN: 'N', BOARD_TYPE: 'basic' });
    setIdChecked(false);
    setDialogOpen(true);
  };

  // ── 수정 다이얼로그 (행 클릭) ──
  const handleRowClick = (row: Board) => {
    setIsEditMode(true);
    setFormData({ ...row });
    setIdChecked(true); // 수정 시 아이디 변경 불가이므로 확인 불필요
    setDialogOpen(true);
  };

  // ── 중복확인 ──
  const handleCheckDuplicate = async () => {
    const boardId = formData.BOARD_ID?.trim();
    if (!boardId) {
      toast.error('게시판 아이디를 입력해 주세요.');
      return;
    }
    if (!BOARD_ID_REGEX.test(boardId)) {
      toast.error('게시판 아이디는 영문자+숫자 조합 12자 이내로 입력해 주세요.');
      return;
    }
    setIdChecking(true);
    if (USE_MOCK) {
      const exists = mockDataRef.current.some((i) => i.BOARD_ID === boardId);
      if (exists) {
        toast.error('이미 사용 중인 아이디입니다.');
        setIdChecked(false);
      } else {
        toast.success('사용 가능한 아이디입니다.');
        setIdChecked(true);
      }
      setIdChecking(false);
      return;
    }
    try {
      const res = await boardApi.configList({ BOARD_ID: boardId, CURRENT_PAGE: 1, SHOWN_ENTITY: 1 });
      const exists = (res.list || []).length > 0;
      if (exists) {
        toast.error('이미 사용 중인 아이디입니다.');
        setIdChecked(false);
      } else {
        toast.success('사용 가능한 아이디입니다.');
        setIdChecked(true);
      }
    } catch {
      toast.error('중복확인에 실패했습니다.');
    } finally {
      setIdChecking(false);
    }
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!formData.BOARD_ID?.trim()) {
      toast.error('게시판 아이디는 필수 입력입니다.');
      return;
    }
    if (!isEditMode && !idChecked) {
      toast.error('게시판 아이디 중복확인을 해주세요.');
      return;
    }
    if (!formData.BOARD_NAME?.trim()) {
      toast.error('게시판명은 필수 입력입니다.');
      return;
    }
    if (!formData.BOARD_TYPE) {
      toast.error('게시판 타입을 선택해 주세요.');
      return;
    }
    if (USE_MOCK) {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if (isEditMode) {
        mockDataRef.current = mockDataRef.current.map((i) =>
          i.BOARD_ID === formData.BOARD_ID
            ? { ...i, ...formData, UPDATE_USER: currentUserName, UPDATE_DTTM: now }
            : i,
        );
      } else {
        const newItem: Board = {
          BOARD_ID: formData.BOARD_ID!,
          BOARD_NAME: formData.BOARD_NAME!,
          BOARD_TYPE: formData.BOARD_TYPE,
          USE_YN: formData.USE_YN || 'Y',
          FILE_ATTACH_YN: formData.FILE_ATTACH_YN || 'N',
          BOARD_DESC: formData.BOARD_DESC,
          INSERT_USER: currentUserName,
          INSERT_DTTM: now,
        };
        mockDataRef.current = [...mockDataRef.current, newItem];
      }
      syncToStorage();
      toast.success('저장되었습니다.');
      setDialogOpen(false);
      setFormData({});
      retrieveList(currentPage, pageSize);
      return;
    }
    try {
      const res = await boardApi.configSave(formData);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('저장되었습니다.');
        setDialogOpen(false);
        setFormData({});
        retrieveList(currentPage, pageSize);
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // ── 선택 삭제 ──
  const handleDelete = async () => {
    if (USE_MOCK) {
      const deleteIds = new Set(selectedRows.map((r) => r.BOARD_ID));
      mockDataRef.current = mockDataRef.current.filter((i) => !deleteIds.has(i.BOARD_ID));
      syncToStorage();
      toast.success('삭제되었습니다.');
      setSelectedRows([]);
      setConfirmOpen(false);
      retrieveList(1, pageSize);
      return;
    }
    try {
      const res = await boardApi.configRemove(selectedRows);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('삭제되었습니다.');
        setSelectedRows([]);
        retrieveList(1, pageSize);
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setConfirmOpen(false);
  };

  return (
    <ListPageTemplate
      title="게시판 설정"
      totalItems={totalItems}
      onSearch={handleSearch}
      onReset={handleReset}
      listHeaderActions={
        <>
          <Button
            variant="outline-red"
            size="md"
            onClick={() => setConfirmOpen(true)}
            disabled={selectedRows.length === 0}
          >
            <Trash2 className="h-4 w-4" />
            선택한 항목 삭제
          </Button>
          <Button size="md" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            신규 등록
          </Button>
        </>
      }
      searchSection={
        <SearchBar
          fields={[
            {
              name: 'BOARD_NAME',
              label: '게시판명',
              value: searchBoardName,
              onChange: setSearchBoardName,
            },
            {
              name: 'BOARD_ID',
              label: '게시판 아이디',
              value: searchBoardId,
              onChange: setSearchBoardId,
            },
            {
              name: 'USE_YN',
              label: '사용여부',
              value: searchUseYn,
              onChange: setSearchUseYn,
              type: 'select',
              options: USE_YN_SEARCH_OPTIONS,
            },
          ]}
          onSearch={handleSearch}
        />
      }
      listContent={
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          totalItems={totalItems}
          currentPage={currentPage}
          pageSize={pageSize}
          totalPages={Math.ceil(totalItems / pageSize) || 1}
          enableSelection
          onPageChange={(page) => {
            setCurrentPage(page);
            retrieveList(page, pageSize);
          }}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
            retrieveList(1, size);
          }}
          onRowClick={handleRowClick}
          onSelectionChange={setSelectedRows}
        />
      }
    >
      {/* 등록/수정 다이얼로그 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent size="md" className="max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? '게시판 설정 수정' : '게시판 설정 등록'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5 overflow-y-auto flex-1">
            {/* 게시판 아이디 */}
            <div className="space-y-1.5">
              <Label>
                게시판 아이디 <span className="text-destructive">*</span>
              </Label>
              {isEditMode ? (
                <Input
                  value={formData.BOARD_ID || ''}
                  readOnly
                  className="bg-gray-200 text-muted-foreground"
                />
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={formData.BOARD_ID || ''}
                    onChange={(e) => {
                      setFormData({ ...formData, BOARD_ID: e.target.value });
                      setIdChecked(false);
                    }}
                    placeholder="영문자+숫자 조합 12자 이내"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant={idChecked ? 'default' : 'outline'}
                    size="md"
                    onClick={handleCheckDuplicate}
                    disabled={idChecking || idChecked}
                    className="shrink-0"
                  >
                    {idChecking
                      ? '확인 중...'
                      : idChecked
                        ? '중복확인 완료'
                        : '중복확인'}
                  </Button>
                </div>
              )}
            </div>

            {/* 게시판명 */}
            <div className="space-y-1.5">
              <Label>
                게시판명 <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.BOARD_NAME || ''}
                onChange={(e) =>
                  setFormData({ ...formData, BOARD_NAME: e.target.value })
                }
                placeholder="게시판명을 입력해 주세요"
              />
            </div>

            {/* 게시판 타입 */}
            <div className="space-y-1.5">
              <Label>
                게시판 타입 <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.BOARD_TYPE || ''}
                onValueChange={(val) =>
                  setFormData({ ...formData, BOARD_TYPE: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="선택" />
                </SelectTrigger>
                <SelectContent>
                  {BOARD_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 사용여부 + 첨부파일 사용여부 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label>
                  사용여부 <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.USE_YN === 'Y'}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, USE_YN: checked ? 'Y' : 'N' })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.USE_YN === 'Y' ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>
                  첨부파일 사용여부 <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.FILE_ATTACH_YN === 'Y'}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        FILE_ATTACH_YN: checked ? 'Y' : 'N',
                      })
                    }
                  />
                  <span className="text-sm text-muted-foreground">
                    {formData.FILE_ATTACH_YN === 'Y' ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* 게시판 설명 */}
            <div className="space-y-1.5">
              <Label>게시판 설명</Label>
              <Textarea
                value={formData.BOARD_DESC || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 300) {
                    setFormData({ ...formData, BOARD_DESC: e.target.value });
                  }
                }}
                placeholder="게시판 설명을 입력해 주세요 (300자 이내)"
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.BOARD_DESC?.length || 0} / 300
              </p>
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

      {/* 삭제 확인 팝업 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="게시판 삭제"
        description={`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까? 삭제 후 복구가 불가능합니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </ListPageTemplate>
  );
}
