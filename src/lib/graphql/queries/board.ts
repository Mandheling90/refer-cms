import { gql } from '@apollo/client';

/* ─── BoardPost 필드 ─── */
const BOARD_POST_FIELDS = `
  id
  boardId
  title
  content
  thumbnailUrl
  isPinned
  isDeleted
  authorId
  viewCount
  startDate
  endDate
  hospitalCode
  parentId
  createdAt
  updatedAt
`;

/* ─── BoardSetting 필드 ─── */
const BOARD_SETTING_FIELDS = `
  id
  boardId
  name
  templateType
  allowAttachments
  description
  hospitalCode
  createdAt
  updatedAt
`;

/** 게시판 설정 목록 조회 */
export const ADMIN_BOARD_SETTINGS_FULL = gql`
  query AdminBoardSettingsFull {
    adminBoardSettings {
      ${BOARD_SETTING_FIELDS}
    }
  }
`;

/** 게시판 설정 생성 */
export const CREATE_BOARD_SETTING = gql`
  mutation CreateBoardSetting($input: CreateBoardSettingInput!) {
    createBoardSetting(input: $input) {
      ${BOARD_SETTING_FIELDS}
    }
  }
`;

/** 게시판 설정 수정 */
export const UPDATE_BOARD_SETTING = gql`
  mutation UpdateBoardSetting($id: String!, $input: UpdateBoardSettingInput!) {
    updateBoardSetting(id: $id, input: $input) {
      ${BOARD_SETTING_FIELDS}
    }
  }
`;

/** 게시판 설정 삭제 */
export const DELETE_BOARD_SETTING = gql`
  mutation DeleteBoardSetting($id: String!) {
    deleteBoardSetting(id: $id)
  }
`;

/** 게시물 목록 조회 (페이징) */
export const BOARD_POSTS = gql`
  query BoardPosts($boardId: String!, $pagination: PaginationInput, $search: String) {
    boardPosts(boardId: $boardId, pagination: $pagination, search: $search) {
      items {
        ${BOARD_POST_FIELDS}
      }
      totalCount
      hasNextPage
    }
  }
`;

/** 게시물 생성 */
export const CREATE_BOARD_POST = gql`
  mutation CreateBoardPost($input: CreateBoardPostInput!) {
    createBoardPost(input: $input) {
      ${BOARD_POST_FIELDS}
    }
  }
`;

/** 게시물 수정 */
export const UPDATE_BOARD_POST = gql`
  mutation UpdateBoardPost($id: String!, $input: UpdateBoardPostInput!) {
    updateBoardPost(id: $id, input: $input) {
      ${BOARD_POST_FIELDS}
    }
  }
`;

/** 게시물 삭제 */
export const DELETE_BOARD_POST = gql`
  mutation DeleteBoardPost($id: String!) {
    deleteBoardPost(id: $id)
  }
`;

/** 첨부파일 목록 조회 */
export const ATTACHMENTS = gql`
  query Attachments($entityId: ID!, $entityType: AttachmentEntityType!) {
    attachments(entityId: $entityId, entityType: $entityType) {
      id
      originalName
      mimeType
      fileSize
      storedPath
      createdAt
    }
  }
`;

/** 첨부파일 다운로드 URL */
export const PRESIGNED_DOWNLOAD_URL = gql`
  query PresignedDownloadUrl($attachmentId: ID!) {
    presignedDownloadUrl(attachmentId: $attachmentId)
  }
`;
