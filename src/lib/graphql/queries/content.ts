import { gql } from '@apollo/client';

/* ─── ContentGroup 필드 ─── */
const CONTENT_GROUP_FIELDS = `
  id
  hospitalCode
  name
  sortOrder
  contentCount
  createdAt
  updatedAt
`;

/* ─── Content 필드 ─── */
const CONTENT_FIELDS = `
  id
  hospitalCode
  title
  body
  contentGroupId
  contentGroupName
  createdAt
  updatedAt
`;

/** 콘텐츠 그룹 목록 조회 */
export const ADMIN_CONTENT_GROUPS = gql`
  query AdminContentGroups($hospitalCode: HospitalCode) {
    adminContentGroups(hospitalCode: $hospitalCode) { ${CONTENT_GROUP_FIELDS} }
  }
`;

/** 콘텐츠 그룹 생성 */
export const CREATE_CONTENT_GROUP = gql`
  mutation CreateContentGroup($hospitalCode: HospitalCode, $input: CreateContentGroupInput!) {
    createContentGroup(hospitalCode: $hospitalCode, input: $input) { ${CONTENT_GROUP_FIELDS} }
  }
`;

/** 콘텐츠 그룹 수정 */
export const UPDATE_CONTENT_GROUP = gql`
  mutation UpdateContentGroup($id: String!, $input: UpdateContentGroupInput!) {
    updateContentGroup(id: $id, input: $input) { ${CONTENT_GROUP_FIELDS} }
  }
`;

/** 콘텐츠 그룹 삭제 */
export const DELETE_CONTENT_GROUP = gql`
  mutation DeleteContentGroup($id: String!) {
    deleteContentGroup(id: $id)
  }
`;

/** 콘텐츠 목록 조회 */
export const ADMIN_CONTENTS = gql`
  query AdminContents($hospitalCode: HospitalCode) {
    adminContents(hospitalCode: $hospitalCode) { ${CONTENT_FIELDS} }
  }
`;

/** 콘텐츠 단건 조회 */
export const CONTENT_BY_ID = gql`
  query ContentById($id: String!) {
    contentById(id: $id) { ${CONTENT_FIELDS} }
  }
`;

/** 콘텐츠 생성 */
export const CREATE_CONTENT = gql`
  mutation CreateContent($input: CreateContentInput!) {
    createContent(input: $input) { ${CONTENT_FIELDS} }
  }
`;

/** 콘텐츠 수정 */
export const UPDATE_CONTENT = gql`
  mutation UpdateContent($id: String!, $input: UpdateContentInput!) {
    updateContent(id: $id, input: $input) { ${CONTENT_FIELDS} }
  }
`;
