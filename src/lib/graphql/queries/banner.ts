import { gql } from '@apollo/client';

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

/** 배너/팝업 관리자 목록 조회 (hospitalCode는 x-hospital-code 헤더로 전달) */
export const ADMIN_POPUPS = gql`
  query AdminPopups($popupType: PopupType, $pagination: PaginationInput) {
    adminPopups(popupType: $popupType, pagination: $pagination) {
      items { ${POPUP_FIELDS} }
      totalCount
      hasNextPage
      cursor
    }
  }
`;

/** 배너/팝업 생성 */
export const CREATE_POPUP = gql`
  mutation CreatePopup($input: CreatePopupInput!) {
    createPopup(input: $input) { ${POPUP_FIELDS} }
  }
`;

/** 배너/팝업 수정 */
export const UPDATE_POPUP = gql`
  mutation UpdatePopup($id: String!, $input: UpdatePopupInput!) {
    updatePopup(id: $id, input: $input) { ${POPUP_FIELDS} }
  }
`;

/** 배너/팝업 삭제 */
export const DELETE_POPUP = gql`
  mutation DeletePopup($id: String!) {
    deletePopup(id: $id)
  }
`;

/** 배너/팝업 순서 변경 */
export const REORDER_POPUPS = gql`
  mutation ReorderPopups($input: ReorderPopupsInput!) {
    reorderPopups(input: $input)
  }
`;
