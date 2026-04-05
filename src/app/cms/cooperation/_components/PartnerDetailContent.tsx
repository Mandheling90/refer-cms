'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useEnums } from '@/hooks/use-enums';
import type { PartnerApplicationDetail } from '@/types/cooperation';

/* ─── 검색 필드 공통 ─── */
export function FieldGroup({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-src-red ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

/* ─── 섹션 헤더 ─── */
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="-mx-6 border-y border-border px-6 py-3">
      <h3 className="text-sm font-semibold">{children}</h3>
    </div>
  );
}

/* ─── 라디오 필드 (유/무 또는 동의/미동의) ─── */
function RadioField({ label, value, inline }: { label: string; value?: boolean | null; inline?: boolean }) {
  const radioContent = (
    <div className="flex items-center h-10 gap-4">
      <label className="flex items-center gap-1.5 text-sm">
        <input type="radio" className="accent-primary" checked={value === true} disabled />
        {label.includes('동의') ? '수신 동의' : '유'}
      </label>
      <label className="flex items-center gap-1.5 text-sm">
        <input type="radio" className="accent-primary" checked={value !== true} disabled />
        {label.includes('동의') ? '수신 미동의' : '무'}
      </label>
    </div>
  );

  if (inline) return radioContent;

  return (
    <FieldGroup label={label}>
      {radioContent}
    </FieldGroup>
  );
}

/* ─── 체크 아이템 ─── */
function CheckItem({ label, checked }: { label: string; checked?: boolean | null }) {
  return (
    <label className="flex items-center gap-1.5 text-sm whitespace-nowrap">
      <Checkbox checked={!!checked} disabled />
      {label}
    </label>
  );
}

/* ─── Props ─── */
interface PartnerDetailContentProps {
  selectedItem: PartnerApplicationDetail;
  isHospital: boolean;
}

/* ═══════════════════════════════════════
   협력병의원 상세 뷰 (공용)
   ═══════════════════════════════════════ */
export function PartnerDetailContent({ selectedItem, isHospital }: PartnerDetailContentProps) {
  const { labelOf } = useEnums();
  const hospital = selectedItem.hospital;

  return (
    <Tabs defaultValue="phis" className="gap-0">
      <TabsList className="w-full">
        <TabsTrigger value="phis" className="flex-1">PHIS 연동항목</TabsTrigger>
        <TabsTrigger value="checklist" className="flex-1">체크리스트 항목</TabsTrigger>
      </TabsList>

      {/* ═══ Tab 1: PHIS 연동항목 ═══ */}
      <TabsContent value="phis" className="space-y-5 pt-5">
        {/* 기본 병원 정보 */}
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원명">
            <Input value={hospital?.name || ''} disabled />
          </FieldGroup>
          <FieldGroup label="요양기관번호">
            <Input value={hospital?.phisCode || hospital?.classificationCode || ''} disabled />
          </FieldGroup>
          <FieldGroup label="병원종별코드">
            <Input value={hospital?.classificationCode || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원코드">
            <Input value={hospital?.hospitalCode || ''} disabled />
          </FieldGroup>
          <FieldGroup label="대표자명">
            <Input value={hospital?.representative || ''} disabled />
          </FieldGroup>
          <FieldGroup label="홈페이지">
            <Input value={hospital?.website || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원 전화번호">
            <Input value={hospital?.phone || ''} disabled />
          </FieldGroup>
          <FieldGroup label="팩스번호">
            <Input value={hospital?.faxNumber || ''} disabled />
          </FieldGroup>
          <FieldGroup label="진료과목">
            <Input value={hospital?.specialties || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="우편번호">
            <Input value={hospital?.zipCode || ''} disabled />
          </FieldGroup>
          <FieldGroup label="주소">
            <Input value={hospital?.address || ''} disabled />
          </FieldGroup>
          <FieldGroup label="상세주소">
            <Input value={hospital?.addressDetail || ''} disabled />
          </FieldGroup>
        </div>

        {/* 병원장정보 */}
        <SectionHeader>병원장정보</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원장명">
            <Input value={selectedItem.directorName || ''} disabled />
          </FieldGroup>
          <FieldGroup label="의사면허번호">
            <Input value={selectedItem.directorLicenseNo || ''} disabled />
          </FieldGroup>
          <FieldGroup label="생년월일">
            <Input value={selectedItem.directorBirthDate || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="휴대전화">
            <Input value={selectedItem.directorPhone || ''} disabled />
          </FieldGroup>
          <FieldGroup label="성별">
            <Input value={labelOf('Gender', selectedItem.directorGender, '')} disabled />
          </FieldGroup>
          <FieldGroup label="차량번호">
            <Input value={selectedItem.directorCarNo || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="이메일">
            <Input value={selectedItem.directorEmail || ''} disabled />
          </FieldGroup>
          <FieldGroup label="졸업년도">
            <Input value={selectedItem.directorGraduationYear || ''} disabled />
          </FieldGroup>
          <FieldGroup label="출신학교">
            <Input value={selectedItem.directorSchool || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="수련병원">
            <Input value={selectedItem.directorTrainingHospital || ''} disabled />
          </FieldGroup>
          <FieldGroup label="진료과">
            <Input value={selectedItem.directorDepartment || ''} disabled />
          </FieldGroup>
          <FieldGroup label="세부전공">
            <Input value={selectedItem.directorSubSpecialty || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <RadioField label="이메일 수신 동의 여부" value={selectedItem.directorEmailConsent} />
          <RadioField label="SMS 수신 동의 여부" value={selectedItem.directorSmsConsent} />
          <RadioField label="회신서 수신 동의 여부" value={selectedItem.directorReplyConsent} />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원장 본인 여부">
            <div className="flex items-center h-10 gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" className="accent-primary" checked={selectedItem.isDirector === true} disabled />
                예
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="radio" className="accent-primary" checked={selectedItem.isDirector !== true} disabled />
                아니오
              </label>
            </div>
          </FieldGroup>
        </div>

        {/* 실무자 정보 */}
        <SectionHeader>실무자 정보</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="실무자명">
            <Input value={selectedItem.staffName || ''} disabled />
          </FieldGroup>
          <FieldGroup label="부서유형">
            <Input value={selectedItem.staffDeptType || ''} disabled />
          </FieldGroup>
          <FieldGroup label="부서">
            <Input value={selectedItem.staffDeptValue || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="직급">
            <Input value={selectedItem.staffPosition || ''} disabled />
          </FieldGroup>
          <FieldGroup label="연락처">
            <Input value={selectedItem.staffPhone || ''} disabled />
          </FieldGroup>
          <FieldGroup label="휴대전화">
            <Input value={selectedItem.staffTel || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="이메일">
            <Input value={selectedItem.staffEmail || ''} disabled />
          </FieldGroup>
        </div>

        {/* 의료기관 유형 */}
        <SectionHeader>의료기관 유형</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="의료기관 유형">
            <Input value={selectedItem.institutionType || ''} disabled />
          </FieldGroup>
        </div>

        {/* 인력현황 */}
        <SectionHeader>인력현황</SectionHeader>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="총 직원 수">
            <Input value={selectedItem.totalStaffCount?.toString() || ''} disabled />
          </FieldGroup>
          <FieldGroup label="전문의 수">
            <Input value={selectedItem.specialistCount?.toString() || ''} disabled />
          </FieldGroup>
          <FieldGroup label="간호사 수">
            <Input value={selectedItem.nurseCount?.toString() || ''} disabled />
          </FieldGroup>
        </div>

        {/* 병원 특성 및 기타사항 */}
        <SectionHeader>병원 특성 및 기타사항</SectionHeader>
        <FieldGroup label="비고">
          <Textarea value={selectedItem.remarks || ''} disabled rows={3} />
        </FieldGroup>

        {/* 첨부파일 */}
        <SectionHeader>첨부파일(사업자등록증, 차량등록증)</SectionHeader>
        <div className="space-y-2">
          {(() => {
            const rows = Array.isArray(selectedItem.attachmentRows) ? selectedItem.attachmentRows : [];
            const legacyFiles = Array.isArray(selectedItem.attachments) ? selectedItem.attachments : [];
            if (rows.length === 0 && legacyFiles.length === 0) {
              return <p className="text-sm text-muted-foreground">첨부파일이 없습니다.</p>;
            }
            if (rows.length > 0) {
              return (rows as { id?: string; originalName?: string; storedPath?: string; mimeType?: string; fileSize?: number; createdAt?: string }[]).map((row, idx) => {
                const fileName = row.originalName || `첨부파일 ${idx + 1}`;
                const fileUrl = row.storedPath || '';
                return (
                  <a
                    key={row.id || idx}
                    href={fileUrl}
                    download={fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <span className="text-blue-600 underline">{fileName}</span>
                    {row.fileSize != null && (
                      <span className="text-muted-foreground ml-auto">
                        {row.fileSize < 1024 ? `${row.fileSize}B` : row.fileSize < 1048576 ? `${(row.fileSize / 1024).toFixed(1)}KB` : `${(row.fileSize / 1048576).toFixed(1)}MB`}
                      </span>
                    )}
                  </a>
                );
              });
            }
            return legacyFiles.map((file: { url?: string; filename?: string; name?: string; originalName?: string }, idx: number) => {
              const fileName = file.originalName || file.filename || file.name || `첨부파일 ${idx + 1}`;
              const fileUrl = file.url || '';
              return (
                <a
                  key={idx}
                  href={fileUrl}
                  download={fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded border px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className="text-blue-600 underline">{fileName}</span>
                </a>
              );
            });
          })()}
        </div>
      </TabsContent>

      {/* ═══ Tab 2: 체크리스트 항목 ═══ */}
      <TabsContent value="checklist" className="space-y-5 pt-5">
        {/* 기본 병원 정보 */}
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원명">
            <Input value={hospital?.name || ''} disabled />
          </FieldGroup>
          <FieldGroup label="요양기관번호">
            <Input value={hospital?.phisCode || hospital?.classificationCode || ''} disabled />
          </FieldGroup>
          <FieldGroup label={isHospital ? '병원종별코드 주소' : '병원홈페이지 주소'}>
            <Input value={hospital?.website || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원 전화번호">
            <Input value={hospital?.phone || ''} disabled />
          </FieldGroup>
          <FieldGroup label={isHospital ? '팩스번호' : '병원FAX'}>
            <Input value={hospital?.faxNumber || ''} disabled />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <FieldGroup label="병원 주소">
            <Input value={hospital?.address || ''} disabled />
          </FieldGroup>
          <FieldGroup label={isHospital ? '상세주소' : '우편번호'}>
            <Input value={isHospital ? (hospital?.addressDetail || '') : (hospital?.zipCode || '')} disabled />
          </FieldGroup>
          {isHospital && (
            <FieldGroup label="우편번호">
              <Input value={hospital?.zipCode || ''} disabled />
            </FieldGroup>
          )}
        </div>

        {isHospital ? (
          <>
            {/* ═══ 협력병원: 전체 체크리스트 ═══ */}
            {/* 병상 운영 현황 */}
            <SectionHeader>병상 운영 현황</SectionHeader>
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="총 병상수">
                <Input value={selectedItem.totalBedCount?.toString() || ''} disabled />
              </FieldGroup>
              <FieldGroup label="가동병상수">
                <Input value={selectedItem.activeBedCount?.toString() || ''} disabled />
              </FieldGroup>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="상급병실">
                <Input value={selectedItem.premiumRoomCount?.toString() || ''} disabled />
              </FieldGroup>
              <FieldGroup label="다인실">
                <Input value={selectedItem.multiRoomCount?.toString() || ''} disabled />
              </FieldGroup>
              <FieldGroup label="격리병실">
                <Input value={selectedItem.isolationRoomCount?.toString() || ''} disabled />
              </FieldGroup>
            </div>

            {/* 시설 운영 현황 */}
            <SectionHeader>시설 운영 현황</SectionHeader>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">중환자실</label>
                <div className="flex items-center gap-3 h-9">
                  <RadioField label="" value={selectedItem.hasIcu} inline />
                  <Input value={selectedItem.icuCount?.toString() || ''} disabled className="w-20" placeholder="병상수" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">응급실</label>
                <div className="flex items-center gap-3 h-9">
                  <RadioField label="" value={selectedItem.hasEr} inline />
                  <Input value={selectedItem.erCount?.toString() || ''} disabled className="w-20" placeholder="병상수" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">정신과병동</label>
                <div className="flex items-center gap-4 h-9">
                  <CheckItem label="일반병동" checked={selectedItem.hasPsychGeneral} />
                  <CheckItem label="폐쇄병동" checked={selectedItem.hasPsychClosed} />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <RadioField label="인공신장실" value={selectedItem.hasDialysisRoom} />
              <RadioField label="수술실" value={selectedItem.hasOperatingRoom} />
              <RadioField label="호스피스" value={selectedItem.hasHospice} />
            </div>
            <p className="text-sm font-semibold text-foreground">재활치료</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <CheckItem label="물리치료(PT)" checked={selectedItem.hasRehabPt} />
              <CheckItem label="물리치료실" checked={selectedItem.hasPhysicalTherapy} />
              <CheckItem label="작업치료" checked={selectedItem.hasRehabOt} />
              <CheckItem label="언어재활" checked={selectedItem.hasRehabSt} />
              <CheckItem label="연하재활" checked={selectedItem.hasRehabSwallow} />
              <CheckItem label="격리재활" checked={selectedItem.hasRehabIsolation} />
            </div>

            {/* 진료과 운영 현황 */}
            <SectionHeader>진료과 운영 현황(전문의 수)</SectionHeader>
            {(() => {
              const raw = selectedItem.departmentSpecialists;
              const depts: Record<string, { count?: string; checked?: boolean }> =
                typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })()
                : (raw as Record<string, { count?: string; checked?: boolean }>) || {};
              const DEPT_MAP: [string, string][] = [
                ['familyMedicine', '가정의학과'],
                ['internalMedicine', '내과'],
                ['anesthesiology', '마취통증의학과'],
                ['radiationOncology', '방사선종양학과'],
                ['pathology', '병리과'],
                ['urology', '비뇨의학과'],
                ['obstetricsGynecology', '산부인과'],
                ['plasticSurgery', '성형외과'],
                ['pediatrics', '소아청소년과'],
                ['neurology', '신경과'],
                ['neurosurgery', '신경외과'],
                ['nephrology', '신장내과'],
                ['ophthalmology', '안과'],
                ['radiology', '영상의학과'],
                ['surgery', '외과'],
                ['emergencyMedicine', '응급의학과'],
                ['otorhinolaryngology', '이비인후과'],
                ['rehabilitationMedicine', '재활의학과'],
                ['psychiatry', '정신건강의학과'],
                ['orthopedicSurgery', '정형외과'],
                ['laboratoryMedicine', '진단검사의학과'],
                ['dentistry', '치과'],
                ['dermatology', '피부과'],
                ['cardiothoracicSurgery', '심장혈관흉부외과'],
                ['koreanMedicine', '한의학과'],
                ['other', '기타'],
              ];
              return (
                <div className="grid grid-cols-3 gap-4">
                  {DEPT_MAP.map(([key, label]) => {
                    const entry = depts[key];
                    const count = entry?.count || '';
                    return (
                      <FieldGroup key={key} label={label}>
                        <Input value={count} disabled />
                      </FieldGroup>
                    );
                  })}
                </div>
              );
            })()}

            {/* 간병시스템 */}
            <SectionHeader>간병시스템</SectionHeader>
            <div className="grid grid-cols-3 gap-4">
              <RadioField label="간호간병통합서비스" value={selectedItem.hasIntegratedNursing} />
              <RadioField label="보호자 간병" value={selectedItem.hasGuardianCare} />
              <RadioField label="공동 간병" value={selectedItem.hasSharedCare} />
            </div>

            {/* 격리병상 운영 현황 */}
            <SectionHeader>
              <span className="flex items-center gap-4">
                격리병상 운영 현황
                <RadioField label="" value={selectedItem.hasRehabIsolation} inline />
              </span>
            </SectionHeader>
            <div className="grid grid-cols-3 gap-4">
              <FieldGroup label="격리병상 수(1인실)">
                <Input value={selectedItem.isolationSingleCount?.toString() || ''} disabled />
              </FieldGroup>
              <FieldGroup label="격리병상 수(2인실)">
                <Input value={selectedItem.isolationDoubleCount?.toString() || ''} disabled />
              </FieldGroup>
              <FieldGroup label="격리병상 수(다인실)">
                <Input value={selectedItem.isolationTripleCount?.toString() || ''} disabled />
              </FieldGroup>
            </div>
            <p className="text-sm font-semibold text-foreground">격리유형</p>
            {(() => {
              const rawTypes = selectedItem.isolationTypes;
              const parsed: Record<string, boolean> =
                typeof rawTypes === 'string' ? (() => { try { return JSON.parse(rawTypes); } catch { return {}; } })()
                : (rawTypes as Record<string, boolean>) || {};
              const ISOLATION_MAP: [string, string][] = [
                ['vre', 'VRE'], ['cre', 'CRE'], ['cpe', 'CPE'], ['tb', 'TB'], ['other', '기타'],
              ];
              return (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {ISOLATION_MAP.map(([key, label]) => (
                    <CheckItem key={key} label={label} checked={!!parsed[key]} />
                  ))}
                </div>
              );
            })()}
            <p className="text-sm font-semibold text-foreground">격리 중 간병</p>
            {(() => {
              const careType = selectedItem.isolationCareType || '';
              const CARE_TYPES: [string, string][] = [
                ['공동', '공동간병'], ['개인', '개인간병'], ['보호자', '보호자간병'],
              ];
              return (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {CARE_TYPES.map(([key, label]) => (
                    <CheckItem key={key} label={label} checked={careType.includes(key)} />
                  ))}
                </div>
              );
            })()}
            <p className="text-sm font-semibold text-foreground">격리 중 재활</p>
            {(() => {
              const rehabType = selectedItem.isolationRehabType || '';
              const REHAB_TYPES: [string, string][] = [
                ['No', 'No'], ['침상', '침상재활'], ['격리병동', '격리병동 재활실 운영'],
              ];
              return (
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {REHAB_TYPES.map(([key, label]) => (
                    <CheckItem key={key} label={label} checked={rehabType.includes(key)} />
                  ))}
                </div>
              );
            })()}

            {/* 주요 보유 장비 */}
            <SectionHeader>주요 보유 장비</SectionHeader>
            {(() => {
              const raw = selectedItem.majorEquipment;
              const parsed: { equipment?: Record<string, boolean>; otherEquipment?: string[] } =
                typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })()
                : (raw as unknown as { equipment?: Record<string, boolean>; otherEquipment?: string[] }) || {};
              const equipMap = parsed.equipment || {};
              const otherEquip = parsed.otherEquipment || [];
              const EQUIPMENT_MAP: [string, string][] = [
                ['xray', 'X-RAY'], ['mri', 'MRI'], ['ct', 'CT'], ['pet', 'PET'],
                ['ultrasound', '초음파'], ['echocardiography', '심장초음파'],
                ['ekg', 'EKG'], ['endoscopy', '내시경'], ['mammography', 'mammography'],
                ['vfss', 'VFSS'], ['boneDensity', '골밀도 검사기'],
                ['cpm', 'CPM'], ['ventilator', 'Ventilator'], ['homeVentilator', 'Home Ventilator'],
                ['highFlowO2', 'High flow O2'], ['portableO2Suction', 'Pratable O2/Suction'],
                ['pft', 'PFT'], ['hemodialysis', '혈액투석기'], ['crrt', 'CRRT'],
                ['infusionPump', '정맥주입기 (Infusion pump)'],
              ];
              return (
                <>
                  <div className="grid grid-cols-5 gap-x-4 gap-y-2">
                    {EQUIPMENT_MAP.map(([key, label]) => (
                      <CheckItem key={key} label={label} checked={!!equipMap[key]} />
                    ))}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">기타장비</p>
                    <div className="grid grid-cols-3 gap-4">
                      {[0, 1, 2].map((i) => (
                        <Input key={i} value={otherEquip[i] || ''} disabled placeholder="기타장비명" />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}

            {/* 기본 처치 가능 항목 */}
            <SectionHeader>기본 처치 가능 항목</SectionHeader>
            {(() => {
              const raw = selectedItem.availableTreatments;
              const parsed: Record<string, Record<string, boolean> | string[]> =
                typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })()
                : (raw as Record<string, Record<string, boolean> | string[]>) || {};

              const TREATMENT_CATEGORIES: { category: string; categoryKey: string; items: [string, string][] }[] = [
                {
                  category: '관리', categoryKey: 'management',
                  items: [
                    ['tracheostomyCare', 'Tracheostomy care'], ['eTube', 'E-tube'], ['lTube', 'L-tube'], ['peg', 'PEG'],
                    ['foleyNelaton', 'Foley/Nelaton(CIC)'], ['drainageTube', '배액관(위루관, 장루, 요루 등)'],
                    ['centralVenousCatheter', '중심정맥관 삽입 및 관리'], ['chemoport', 'Chemo-port 관리'],
                  ],
                },
                {
                  category: '처방', categoryKey: 'prescription',
                  items: [
                    ['bloodTransfusion', '수혈(전혈, 적혈구, 혈소판)'], ['tpnPpn', 'TPN/PPN'],
                    ['antibiotics', '항생제(1, 3세대, Vanco 등)'],
                  ],
                },
                {
                  category: '드레싱', categoryKey: 'dressing',
                  items: [
                    ['pressureUlcerPrevention', '욕창 예방 및 치료'], ['vacuumManagement', 'Vaccum 관리'],
                    ['simpleComplexDressing', '단순드레싱 및 복합드레싱'],
                  ],
                },
                {
                  category: '처치', categoryKey: 'treatment',
                  items: [
                    ['intubation', 'Intubation'], ['ventilatorCare', 'Ventilator care'], ['homeVentilator', 'Home Ventilator'],
                    ['highFlowO2', 'High flow O2'], ['o2Therapy', 'O2 Therapy'], ['suction', 'Suction'],
                    ['paracentesis', '복수천자'], ['thoracentesis', '흉수천자'], ['chestTube', '흉관 삽입 및 관리'],
                    ['hemodialysis', '혈액투석'], ['peritonealDialysis', '복막투석'], ['enema', 'Enema'],
                  ],
                },
              ];

              const otherItems = (parsed.otherItems as string[]) || [];

              return (
                <>
                  {TREATMENT_CATEGORIES.map(({ category, categoryKey, items }) => {
                    const catData = (parsed[categoryKey] || {}) as Record<string, boolean>;
                    return (
                      <div key={categoryKey}>
                        <p className="text-sm font-semibold text-foreground">{category}</p>
                        <div className="grid grid-cols-5 gap-x-4 gap-y-2 mt-1">
                          {items.map(([key, label]) => (
                            <CheckItem key={key} label={label} checked={!!catData[key]} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">기타항목</p>
                    <div className="grid grid-cols-3 gap-4">
                      {[0, 1, 2].map((i) => (
                        <Input key={i} value={otherItems[i] || ''} disabled placeholder="기타항목명" />
                      ))}
                    </div>
                  </div>
                </>
              );
            })()}
          </>
        ) : (
          <>
            {/* ═══ 협력의원: 제한된 체크리스트 ═══ */}
            <SectionHeader>병원 세부 정보</SectionHeader>

            {/* 물리치료실 / 투석 / 투약 */}
            <div className="grid grid-cols-3 gap-4">
              <RadioField label="물리치료실" value={selectedItem.hasPhysicalTherapy} />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">투석</label>
                <div className="flex items-center h-10 gap-4">
                  <CheckItem label="혈액" checked={selectedItem.clinicHasHemodialysis} />
                  <CheckItem label="복막" checked={selectedItem.clinicHasPeritoneal} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">투약</label>
                <div className="flex items-center h-10 gap-4">
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" className="accent-primary" checked={selectedItem.clinicMedicationType !== 'injectable'} disabled />
                    불가능
                  </label>
                  <label className="flex items-center gap-1.5 text-sm">
                    <input type="radio" className="accent-primary" checked={selectedItem.clinicMedicationType === 'injectable'} disabled />
                    G-CSF 피하주사 투여 가능
                  </label>
                </div>
              </div>
            </div>

            {/* 피부과 / 이비인후과 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-foreground">피부과</label>
                <div className="flex items-center h-10 gap-4">
                  <CheckItem label="광선치료" checked={selectedItem.clinicHasPhototherapy} />
                  <CheckItem label="엑시머레이저" checked={selectedItem.clinicHasExcimerLaser} />
                </div>
              </div>
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
