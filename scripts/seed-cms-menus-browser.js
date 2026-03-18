/**
 * CMS 메뉴 일괄 등록 - 브라우저 콘솔용 스크립트
 *
 * 사용법:
 *   1. CMS에 통합관리자(ALL)로 로그인
 *   2. F12 → Console 탭
 *   3. 아래 코드 전체를 복사 → 붙여넣기 → Enter
 *
 * 각 병원별로 실행하려면 HOSPITAL_CODE 값을 변경하세요.
 */

(async () => {
  // ═══════════════════════════════════════════════
  // 설정: 등록할 병원 코드 (ANAM / GURO / ANSAN)
  // ═══════════════════════════════════════════════
  const HOSPITAL_CODE = 'ANAM';
  // ═══════════════════════════════════════════════

  // 토큰 자동 추출
  const authData = JSON.parse(localStorage.getItem('ehr-auth') || '{}');
  const token = authData?.state?.accessToken;
  if (!token) {
    console.error('❌ 로그인 상태가 아닙니다. CMS에 먼저 로그인해주세요.');
    return;
  }
  console.log('🔑 토큰 확인 완료');

  // GraphQL URL (현재 페이지 기준 상대 경로)
  const GRAPHQL_URL = '/graphql';

  // 메뉴 구조 정의
  const MENU_TREE = [
    { name: '메뉴 관리', menuTargetType: 'LINK', externalUrl: '/cms/menu' },
    { name: '회원 관리', menuTargetType: 'LINK', externalUrl: '/cms/user' },
    { name: '회원가입 신청 관리', menuTargetType: 'LINK', externalUrl: '/cms/user/apply' },
    {
      name: '배너관리', menuTargetType: 'PARENT', children: [
        { name: '메인배너', externalUrl: '/cms/banner/main-banner' },
        { name: '미니배너', externalUrl: '/cms/banner/mini-banner' },
        { name: '팝업', externalUrl: '/cms/banner/popup' },
      ]
    },
    { name: '의료진', menuTargetType: 'LINK', externalUrl: '/cms/medical-staff' },
    {
      name: '협력병의원 신청 관리', menuTargetType: 'PARENT', children: [
        { name: '협력병원 신청 관리', externalUrl: '/cms/cooperation/hospital-apply' },
        { name: '협력의원 신청 관리', externalUrl: '/cms/cooperation/clinic-apply' },
      ]
    },
    {
      name: '협력병의원 수정 관리', menuTargetType: 'PARENT', children: [
        { name: '협력병원 수정 관리', externalUrl: '/cms/cooperation/hospital-edit' },
        { name: '협력의원 수정 관리', externalUrl: '/cms/cooperation/clinic-edit' },
      ]
    },
    {
      name: '검사이미지 관리', menuTargetType: 'PARENT', children: [
        { name: '영상검사', externalUrl: '/cms/exam-image/radiology' },
        { name: '내시경검사', externalUrl: '/cms/exam-image/endoscopy' },
        { name: '기타검사', externalUrl: '/cms/exam-image/etc' },
      ]
    },
    { name: '콘텐츠 설정', menuTargetType: 'LINK', externalUrl: '/cms/contents/config' },
    { name: '콘텐츠 관리', menuTargetType: 'LINK', externalUrl: '/cms/contents' },
    { name: '게시판 설정', menuTargetType: 'LINK', externalUrl: '/cms/board/config' },
    { name: '게시판 관리', menuTargetType: 'LINK', externalUrl: '/cms/board' },
    { name: 'e-Consult', menuTargetType: 'LINK', externalUrl: '/cms/e-consult' },
    {
      name: '시스템 관리', menuTargetType: 'PARENT', children: [
        { name: '관리자 관리', externalUrl: '/cms/admin-management' },
        { name: 'CMS 메뉴', externalUrl: '/cms/cms-menu' },
        { name: '권한 그룹 관리', externalUrl: '/cms/permission-group' },
        { name: '권한 수정 이력', externalUrl: '/cms/permission-group-history' },
      ]
    },
    { name: '로그내역', menuTargetType: 'LINK', externalUrl: '/cms/log' },
  ];

  // GraphQL 요청 함수
  async function gql(query, variables) {
    const res = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-hospital-code': HOSPITAL_CODE,
      },
      body: JSON.stringify({ query, variables }),
    });
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors));
    return json.data;
  }

  const CREATE = `mutation CreateMenu($input: CreateMenuInput!) {
    createMenu(input: $input) { id name parentId sortOrder }
  }`;

  // 실행
  const totalChildren = MENU_TREE.reduce((s, m) => s + (m.children?.length || 0), 0);
  console.log(`🏥 병원: ${HOSPITAL_CODE}`);
  console.log(`📋 등록 예정: 상위 ${MENU_TREE.length}개 + 하위 ${totalChildren}개 = 총 ${MENU_TREE.length + totalChildren}개`);
  console.log('─'.repeat(50));

  let created = 0, failed = 0;

  for (let i = 0; i < MENU_TREE.length; i++) {
    const menu = MENU_TREE[i];
    try {
      const input = {
        menuType: 'ADMIN',
        hospitalCode: HOSPITAL_CODE,
        name: menu.name,
        menuTargetType: menu.menuTargetType,
        ...(menu.externalUrl ? { externalUrl: menu.externalUrl } : {}),
      };

      console.log(`[${i + 1}/${MENU_TREE.length}] 📂 "${menu.name}" 생성 중...`);
      const data = await gql(CREATE, { input });
      const parentId = data.createMenu.id;
      created++;
      console.log(`  ✅ 완료 (id: ${parentId})`);

      // 하위 메뉴
      if (menu.children) {
        for (let j = 0; j < menu.children.length; j++) {
          const child = menu.children[j];
          try {
            const childInput = {
              menuType: 'ADMIN',
              hospitalCode: HOSPITAL_CODE,
              name: child.name,
              menuTargetType: 'LINK',
              parentId,
              externalUrl: child.externalUrl,
            };
            console.log(`  [${j + 1}/${menu.children.length}] 🔗 "${child.name}" 생성 중...`);
            const childData = await gql(CREATE, { input: childInput });
            created++;
            console.log(`    ✅ 완료 (id: ${childData.createMenu.id})`);
          } catch (err) {
            failed++;
            console.error(`    ❌ 실패: ${child.name}`, err.message);
          }
        }
      }
    } catch (err) {
      failed++;
      console.error(`  ❌ 실패: ${menu.name}`, err.message);
    }
  }

  console.log('─'.repeat(50));
  console.log(`🎉 완료! 생성: ${created}건, 실패: ${failed}건`);

  if (failed > 0) {
    console.warn('⚠️ 실패한 메뉴가 있습니다. 토큰 만료 또는 중복 여부를 확인하세요.');
  }

  console.log(`\n💡 다른 병원에 등록하려면 스크립트 상단의 HOSPITAL_CODE를 변경 후 다시 실행하세요.`);
})();
