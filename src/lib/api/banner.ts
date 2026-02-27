import { graphqlRequest, getStoredHospitalCode } from './graphql';

// ---------------------------------------------------------------------------
// Banner interface (기존 페이지 호환)
// ---------------------------------------------------------------------------

export interface Banner {
  BANNER_ID: string;
  BANNER_NAME: string;
  BANNER_TYPE: string;
  IMAGE_URL?: string;           // PC 배너 이미지 (라이트모드)
  MOBILE_IMAGE_URL?: string;    // Mobile 배너 이미지 (라이트모드)
  PC_IMAGE_DARK?: string;       // PC 배너 이미지 (다크모드)
  MOBILE_IMAGE_DARK?: string;   // Mobile 배너 이미지 (다크모드)
  VIDEO_URL?: string;           // 배너 영상 URL (라이트모드)
  VIDEO_URL_DARK?: string;      // 배너 영상 URL (다크모드)
  MEDIA_TYPE?: string;          // 'IMAGE' | 'VIDEO'
  MEDIA_DESC?: string;          // 이미지/영상 설명
  MAIN_SLOGAN?: string;         // 메인 슬로건
  SUB_SLOGAN?: string;          // 서브 슬로건(부제)
  LINK_URL?: string;
  LINK_TYPE?: string;           // 'NEW' | 'SELF'
  USE_YN?: string;
  SORT_ORDER?: number;
  START_DATE?: string;
  END_DATE?: string;
  START_TIME?: string;
  END_TIME?: string;
  ALWAYS_YN?: string;           // 상시노출 여부
  LANG_SET?: string;
  SITE_CD?: string;             // 기관코드 (anam | guro | ansan)
  INSERT_DTTM?: string;
  UPDATE_DTTM?: string;
}

// ---------------------------------------------------------------------------
// GraphQL 모델
// ---------------------------------------------------------------------------

interface PopupModel {
  id: string;
  hospitalCode: string;
  popupType: string;
  isActive: boolean;
  alwaysVisible: boolean;
  targetBlank: boolean;
  sortOrder: number;
  mainSlogan?: string;
  subSlogan?: string;
  linkUrl?: string;
  altText?: string;
  imageUrl?: string;
  imageDarkUrl?: string;
  mobileImageUrl?: string;
  mobileDarkImageUrl?: string;
  mediaType?: string;
  videoUrl?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginatedPopupResponse {
  items: PopupModel[];
  totalCount: number;
  hasNextPage: boolean;
  cursor?: string;
}

// ---------------------------------------------------------------------------
// 매핑 헬퍼
// ---------------------------------------------------------------------------

const SITE_TO_HOSPITAL: Record<string, string> = {
  anam: 'ANAM',
  guro: 'GURO',
  ansan: 'ANSAN',
};

const HOSPITAL_TO_SITE: Record<string, string> = {
  ANAM: 'anam',
  GURO: 'guro',
  ANSAN: 'ansan',
};

const BANNER_TO_POPUP_TYPE: Record<string, string> = {
  MAIN: 'SLIDE_BANNER',
  STRIP: 'MINI_BANNER',
  POPUP: 'POPUP',
};

const POPUP_TO_BANNER_TYPE: Record<string, string> = {
  SLIDE_BANNER: 'MAIN',
  MINI_BANNER: 'STRIP',
  POPUP: 'POPUP',
};

/** ISO 날짜 → YYYY-MM-DD */
function formatDate(iso?: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

/** ISO 날짜 → YYYY-MM-DD HH:mm:ss */
function formatDateTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function popupToBanner(popup: PopupModel): Banner {
  return {
    BANNER_ID: popup.id,
    BANNER_NAME: popup.altText || '',
    BANNER_TYPE: POPUP_TO_BANNER_TYPE[popup.popupType] || popup.popupType,
    SITE_CD: HOSPITAL_TO_SITE[popup.hospitalCode] || popup.hospitalCode,
    USE_YN: popup.isActive ? 'Y' : 'N',
    ALWAYS_YN: popup.alwaysVisible ? 'Y' : 'N',
    LINK_TYPE: popup.targetBlank ? 'NEW' : 'SELF',
    SORT_ORDER: popup.sortOrder,
    MAIN_SLOGAN: popup.mainSlogan || '',
    SUB_SLOGAN: popup.subSlogan || '',
    LINK_URL: popup.linkUrl || '',
    MEDIA_DESC: popup.altText || '',
    IMAGE_URL: popup.imageUrl || '',
    PC_IMAGE_DARK: popup.imageDarkUrl || '',
    MOBILE_IMAGE_URL: popup.mobileImageUrl || '',
    MOBILE_IMAGE_DARK: popup.mobileDarkImageUrl || '',
    MEDIA_TYPE: popup.mediaType || 'IMAGE',
    VIDEO_URL: popup.videoUrl || '',
    START_DATE: formatDate(popup.startDate),
    END_DATE: formatDate(popup.endDate),
    INSERT_DTTM: formatDateTime(popup.createdAt),
    UPDATE_DTTM: formatDateTime(popup.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// GraphQL 쿼리 & 뮤테이션
// ---------------------------------------------------------------------------

const POPUP_FIELDS = `
  id
  hospitalCode
  popupType
  isActive
  alwaysVisible
  targetBlank
  sortOrder
  mainSlogan
  subSlogan
  linkUrl
  altText
  imageUrl
  imageDarkUrl
  mobileImageUrl
  mobileDarkImageUrl
  mediaType
  videoUrl
  startDate
  endDate
  createdAt
  updatedAt
`;

const ADMIN_POPUPS_QUERY = `
  query AdminPopups($popupType: PopupType, $hospitalCode: HospitalCode, $pagination: PaginationInput) {
    adminPopups(popupType: $popupType, hospitalCode: $hospitalCode, pagination: $pagination) {
      items { ${POPUP_FIELDS} }
      totalCount
      hasNextPage
      cursor
    }
  }
`;

const CREATE_POPUP_MUTATION = `
  mutation CreatePopup($input: CreatePopupInput!) {
    createPopup(input: $input) { ${POPUP_FIELDS} }
  }
`;

const UPDATE_POPUP_MUTATION = `
  mutation UpdatePopup($id: String!, $input: UpdatePopupInput!) {
    updatePopup(id: $id, input: $input) { ${POPUP_FIELDS} }
  }
`;

const DELETE_POPUP_MUTATION = `
  mutation DeletePopup($id: String!) {
    deletePopup(id: $id)
  }
`;

const REORDER_POPUPS_MUTATION = `
  mutation ReorderPopups($input: ReorderPopupsInput!) {
    reorderPopups(input: $input)
  }
`;

// ---------------------------------------------------------------------------
// API 결과 타입
// ---------------------------------------------------------------------------

export interface BannerListResult {
  list: Banner[];
  totalCount: number;
}

export interface BannerActionResult {
  success: boolean;
  message?: string;
}

// ---------------------------------------------------------------------------
// Banner API (GraphQL 기반)
// ---------------------------------------------------------------------------

export const bannerApi = {
  /** 배너 목록 조회 */
  list: async (params: {
    popupType: string;
    hospitalCode?: string;
  }): Promise<BannerListResult> => {
    const variables: Record<string, unknown> = {
      popupType: BANNER_TO_POPUP_TYPE[params.popupType] || params.popupType,
      pagination: { limit: 100 },
    };
    if (params.hospitalCode) {
      variables.hospitalCode = params.hospitalCode;
    }
    const data = await graphqlRequest<{ adminPopups: PaginatedPopupResponse }>(
      ADMIN_POPUPS_QUERY,
      variables,
    );

    const banners = data.adminPopups.items.map(popupToBanner);

    // 정렬: 사용 배너(SORT_ORDER순) → 미사용 배너(SORT_ORDER순)
    banners.sort((a, b) => {
      if (a.USE_YN === 'Y' && b.USE_YN !== 'Y') return -1;
      if (a.USE_YN !== 'Y' && b.USE_YN === 'Y') return 1;
      return (a.SORT_ORDER || 0) - (b.SORT_ORDER || 0);
    });

    return {
      list: banners,
      totalCount: data.adminPopups.totalCount,
    };
  },

  /** 배너 저장 (생성 또는 수정) */
  save: async (banner: Partial<Banner>, hospitalCode?: string): Promise<BannerActionResult> => {
    const input: Record<string, unknown> = {
      hospitalCode: hospitalCode || getStoredHospitalCode(),
      popupType: BANNER_TO_POPUP_TYPE[banner.BANNER_TYPE || ''] || banner.BANNER_TYPE,
      isActive: banner.USE_YN === 'Y',
      alwaysVisible: banner.ALWAYS_YN === 'Y',
      targetBlank: banner.LINK_TYPE === 'NEW',
      linkUrl: banner.LINK_URL || '',
      altText: banner.MEDIA_DESC || '',
      mainSlogan: banner.MAIN_SLOGAN || '',
      subSlogan: banner.SUB_SLOGAN || '',
      imageUrl: banner.IMAGE_URL || '',
      imageDarkUrl: banner.PC_IMAGE_DARK || '',
      mobileImageUrl: banner.MOBILE_IMAGE_URL || '',
      mobileDarkImageUrl: banner.MOBILE_IMAGE_DARK || '',
      mediaType: banner.MEDIA_TYPE || 'IMAGE',
      videoUrl: banner.VIDEO_URL || '',
      startDate: banner.START_DATE || null,
      endDate: banner.END_DATE || null,
    };

    if (banner.BANNER_ID) {
      // UpdatePopupInput에는 hospitalCode, popupType 필드가 없음
      const { hospitalCode, popupType, ...updateInput } = input;
      await graphqlRequest(UPDATE_POPUP_MUTATION, {
        id: banner.BANNER_ID,
        input: updateInput,
      });
    } else {
      await graphqlRequest(CREATE_POPUP_MUTATION, { input });
    }

    return { success: true, message: '저장되었습니다.' };
  },

  /** 배너 삭제 (복수 가능) */
  remove: async (ids: string[]): Promise<BannerActionResult> => {
    for (const id of ids) {
      await graphqlRequest(DELETE_POPUP_MUTATION, { id });
    }
    return { success: true, message: '삭제되었습니다.' };
  },

  /** 배너 순서 변경 */
  reorder: async (params: {
    popupType: string;
    orderedIds: string[];
    hospitalCode?: string;
  }): Promise<BannerActionResult> => {
    await graphqlRequest(REORDER_POPUPS_MUTATION, {
      input: {
        hospitalCode: params.hospitalCode || getStoredHospitalCode(),
        popupType: BANNER_TO_POPUP_TYPE[params.popupType] || params.popupType,
        orderedIds: params.orderedIds,
      },
    });
    return { success: true, message: '순서가 저장되었습니다.' };
  },
};
