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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  contentsGroupApi,
  type ContentsGroup,
} from '@/lib/api/contents';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { Plus, Trash2 } from 'lucide-react';

// ── Mock 모드 (API 연동 전까지 true) ──
const USE_MOCK = true;
const STORAGE_KEY = 'cms_contents_group_config';

const MOCK_DATA: ContentsGroup[] = [
  { CONTENTS_GRP_ID: 'Interior', CONTENTS_GRP_NAME: '진료협력센터소개', USE_YN: 'Y', CONTENTS_GRP_DESC: '진료협력센터 소개 페이지 콘텐츠 그룹', INSERT_USER: '김주환', INSERT_DTTM: '2025-04-29 09:17:24' },
  { CONTENTS_GRP_ID: 'contents02', CONTENTS_GRP_NAME: '협력네트워크', USE_YN: 'Y', CONTENTS_GRP_DESC: '협력네트워크 관련 콘텐츠', INSERT_USER: '이준용', INSERT_DTTM: '2025-04-21 09:00:00' },
  { CONTENTS_GRP_ID: 'contents03', CONTENTS_GRP_NAME: '진료의뢰', USE_YN: 'Y', CONTENTS_GRP_DESC: '진료의뢰 안내 콘텐츠', INSERT_USER: '김주환', INSERT_DTTM: '2025-04-21 09:00:00' },
  { CONTENTS_GRP_ID: 'contents04', CONTENTS_GRP_NAME: '검사결과조회', USE_YN: 'Y', CONTENTS_GRP_DESC: '검사결과 조회 페이지 콘텐츠', INSERT_USER: '이준용', INSERT_DTTM: '2025-04-18 14:30:00' },
  { CONTENTS_GRP_ID: 'contents05', CONTENTS_GRP_NAME: '교육/행사', USE_YN: 'N', CONTENTS_GRP_DESC: '교육 및 행사 안내', INSERT_USER: '김주환', INSERT_DTTM: '2025-04-15 11:20:00' },
  { CONTENTS_GRP_ID: 'contents06', CONTENTS_GRP_NAME: 'e-Consult 안내', USE_YN: 'Y', CONTENTS_GRP_DESC: 'e-Consult 서비스 안내 콘텐츠', INSERT_USER: '이준용', INSERT_DTTM: '2025-04-10 08:45:00' },
];

// ── 사용여부 검색 옵션 ──
const USE_YN_SEARCH_OPTIONS = [
  { value: '_all', label: '전체' },
  { value: 'Y', label: '사용' },
  { value: 'N', label: '미사용' },
];

// ── 콘텐츠(그룹) 아이디 유효성 검사 (영문자+숫자 조합, 12자 이내) ──
const GRP_ID_REGEX = /^[a-zA-Z0-9]{1,12}$/;

// ── 컬럼 정의 ──
const columns: ColumnDef<ContentsGroup, unknown>[] = [
  {
    accessorKey: 'ROW_NUM',
    header: '번호',
    size: 70,
    cell: ({ row }) => row.index + 1,
  },
  { accessorKey: 'CONTENTS_GRP_ID', header: '아이디', size: 160 },
  { accessorKey: 'CONTENTS_GRP_NAME', header: '콘텐츠(그룹)명', size: 240 },
  {
    accessorKey: 'USE_YN',
    header: '사용여부',
    size: 100,
    cell: ({ getValue }) => (
      <StatusBadge status={(getValue() as string) || 'N'} />
    ),
  },
  { accessorKey: 'INSERT_DTTM', header: '등록일시', size: 180 },
];

export default function ContentsConfigPage() {
  // ── 리스트 상태 ──
  const [data, setData] = useState<ContentsGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<ContentsGroup[]>([]);

  // ── 검색 상태 ──
  const [searchGrpName, setSearchGrpName] = useState('');
  const [searchGrpId, setSearchGrpId] = useState('');
  const [searchUseYn, setSearchUseYn] = useState('_all');

  // ── 다이얼로그 상태 ──
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<ContentsGroup>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── 중복확인 상태 ──
  const [idChecked, setIdChecked] = useState(false);
  const [idChecking, setIdChecking] = useState(false);

  // ── Mock 데이터 저장소 (localStorage 연동) ──
  const mockDataRef = useRef<ContentsGroup[]>(null!);
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
        if (searchGrpName) items = items.filter((i) => i.CONTENTS_GRP_NAME.includes(searchGrpName));
        if (searchGrpId) items = items.filter((i) => i.CONTENTS_GRP_ID.includes(searchGrpId));
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
        if (searchGrpName) params.CONTENTS_GRP_NAME = searchGrpName;
        if (searchGrpId) params.CONTENTS_GRP_ID = searchGrpId;
        if (searchUseYn !== '_all') params.USE_YN = searchUseYn;

        const res = await contentsGroupApi.list(params);
        setData(res.list || []);
        setTotalItems(res.TOTAL_ENTITY || 0);
      } catch {
        toast.error('목록 조회에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize, searchGrpName, searchGrpId, searchUseYn],
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
    setSearchGrpName('');
    setSearchGrpId('');
    setSearchUseYn('_all');
    setCurrentPage(1);
    retrieveList(1, pageSize);
  };

  // ── 신규 등록 다이얼로그 ──
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setFormData({ USE_YN: 'N' });
    setIdChecked(false);
    setDialogOpen(true);
  };

  // ── 수정 다이얼로그 (행 클릭) ──
  const handleRowClick = (row: ContentsGroup) => {
    setIsEditMode(true);
    setFormData({ ...row });
    setIdChecked(true);
    setDialogOpen(true);
  };

  // ── 중복확인 ──
  const handleCheckDuplicate = async () => {
    const grpId = formData.CONTENTS_GRP_ID?.trim();
    if (!grpId) {
      toast.error('콘텐츠(그룹) 아이디를 입력해 주세요.');
      return;
    }
    if (!GRP_ID_REGEX.test(grpId)) {
      toast.error('영문자+숫자 조합 12자 이내로 입력해 주세요.');
      return;
    }
    setIdChecking(true);
    if (USE_MOCK) {
      const exists = mockDataRef.current.some((i) => i.CONTENTS_GRP_ID === grpId);
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
      const res = await contentsGroupApi.list({
        CONTENTS_GRP_ID: grpId,
        CURRENT_PAGE: 1,
        SHOWN_ENTITY: 1,
      });
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
    if (!formData.CONTENTS_GRP_ID?.trim()) {
      toast.error('콘텐츠(그룹) 아이디는 필수 입력입니다.');
      return;
    }
    if (!isEditMode && !idChecked) {
      toast.error('콘텐츠(그룹) 아이디 중복확인을 해주세요.');
      return;
    }
    if (!formData.CONTENTS_GRP_NAME?.trim()) {
      toast.error('콘텐츠(그룹) 명은 필수 입력입니다.');
      return;
    }
    if (USE_MOCK) {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if (isEditMode) {
        mockDataRef.current = mockDataRef.current.map((i) =>
          i.CONTENTS_GRP_ID === formData.CONTENTS_GRP_ID
            ? { ...i, ...formData, UPDATE_USER: currentUserName, UPDATE_DTTM: now }
            : i,
        );
      } else {
        const newItem: ContentsGroup = {
          CONTENTS_GRP_ID: formData.CONTENTS_GRP_ID!,
          CONTENTS_GRP_NAME: formData.CONTENTS_GRP_NAME!,
          CONTENTS_GRP_DESC: formData.CONTENTS_GRP_DESC,
          USE_YN: formData.USE_YN || 'N',
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
      const res = await contentsGroupApi.save(formData);
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
      const deleteIds = new Set(selectedRows.map((r) => r.CONTENTS_GRP_ID));
      mockDataRef.current = mockDataRef.current.filter((i) => !deleteIds.has(i.CONTENTS_GRP_ID));
      syncToStorage();
      toast.success('삭제되었습니다.');
      setSelectedRows([]);
      setConfirmOpen(false);
      retrieveList(1, pageSize);
      return;
    }
    try {
      const res = await contentsGroupApi.remove(selectedRows);
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
      title="콘텐츠 설정"
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
              name: 'CONTENTS_GRP_NAME',
              label: '콘텐츠(그룹) 명',
              value: searchGrpName,
              onChange: setSearchGrpName,
            },
            {
              name: 'CONTENTS_GRP_ID',
              label: '콘텐츠(그룹) 아이디',
              value: searchGrpId,
              onChange: setSearchGrpId,
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
              {isEditMode
                ? '콘텐츠(그룹) 설정 수정'
                : '콘텐츠(그룹) 설정 등록'}
            </DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5 overflow-y-auto flex-1">
            {/* 콘텐츠(그룹) 아이디 */}
            <div className="space-y-1.5">
              <Label>
                콘텐츠(그룹) 아이디{' '}
                <span className="text-destructive">*</span>
              </Label>
              {isEditMode ? (
                <Input
                  value={formData.CONTENTS_GRP_ID || ''}
                  readOnly
                  className="bg-gray-200 text-muted-foreground"
                />
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={formData.CONTENTS_GRP_ID || ''}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          CONTENTS_GRP_ID: e.target.value,
                        });
                        setIdChecked(false);
                      }}
                      placeholder="영문자+숫자 조합 12자 이내"
                      className="flex-1"
                      maxLength={12}
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
                  <p className="text-xs text-muted-foreground">
                    45자 이하로 띄어쓰기 없이 영문 대소문자와 숫자, 언더바만
                    입력해 주세요.
                  </p>
                </>
              )}
            </div>

            {/* 콘텐츠(그룹) 명 */}
            <div className="space-y-1.5">
              <Label>
                콘텐츠(그룹) 명{' '}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                value={formData.CONTENTS_GRP_NAME || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 20) {
                    setFormData({
                      ...formData,
                      CONTENTS_GRP_NAME: e.target.value,
                    });
                  }
                }}
                placeholder="20자 이내로 입력해 주세요"
                maxLength={20}
              />
            </div>

            {/* 사용여부 */}
            <div className="space-y-1.5">
              <Label>
                사용여부 <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.USE_YN === 'Y'}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      USE_YN: checked ? 'Y' : 'N',
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">
                  {formData.USE_YN === 'Y' ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            {/* 콘텐츠(그룹) 설명 */}
            <div className="space-y-1.5">
              <Label>
                콘텐츠(그룹) 설명 (200자 이내) (관리자 메모용){' '}
                <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={formData.CONTENTS_GRP_DESC || ''}
                onChange={(e) => {
                  if (e.target.value.length <= 200) {
                    setFormData({
                      ...formData,
                      CONTENTS_GRP_DESC: e.target.value,
                    });
                  }
                }}
                placeholder="200자 이내로 입력해 주세요"
                rows={4}
              />
              <p className="text-xs text-muted-foreground text-right">
                {formData.CONTENTS_GRP_DESC?.length || 0} / 200
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
        title="콘텐츠 그룹 삭제"
        description={`선택한 ${selectedRows.length}개 항목을 삭제하시겠습니까? 삭제 시 콘텐츠 관리의 해당 그룹도 함께 삭제됩니다.`}
        onConfirm={handleDelete}
        destructive
      />
    </ListPageTemplate>
  );
}
