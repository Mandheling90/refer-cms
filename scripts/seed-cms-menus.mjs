/**
 * CMS 메뉴 일괄 등록 스크립트
 *
 * 사용법:
 *   node scripts/seed-cms-menus.mjs --token <ACCESS_TOKEN> [--hospital ANAM]
 *
 * ACCESS_TOKEN: 브라우저 개발자 도구 → Application → Local Storage → ehr-auth 에서
 *               state.accessToken 값을 복사하세요.
 *
 * --hospital: 등록할 병원 코드 (ANAM, GURO, ANSAN). 기본값: ANAM
 *             모든 병원에 등록하려면 스크립트를 병원별로 3번 실행하세요.
 *
 * --dry-run: 실제 요청 없이 등록할 메뉴 목록만 출력
 */

const GRAPHQL_URL = 'https://api.propai.kr/graphql';

// ─── Sidebar에 정의된 CMS 관리자 메뉴 구조 ───
const MENU_TREE = [
  {
    name: '메뉴 관리',
    menuTargetType: 'LINK',
    externalUrl: '/cms/menu',
  },
  {
    name: '회원 관리',
    menuTargetType: 'LINK',
    externalUrl: '/cms/user',
  },
  {
    name: '회원가입 신청 관리',
    menuTargetType: 'LINK',
    externalUrl: '/cms/user/apply',
  },
  {
    name: '배너관리',
    menuTargetType: 'PARENT',
    children: [
      { name: '메인배너', externalUrl: '/cms/banner/main-banner' },
      { name: '미니배너', externalUrl: '/cms/banner/mini-banner' },
      { name: '팝업', externalUrl: '/cms/banner/popup' },
    ],
  },
  {
    name: '의료진',
    menuTargetType: 'LINK',
    externalUrl: '/cms/medical-staff',
  },
  {
    name: '협력병의원 신청 관리',
    menuTargetType: 'PARENT',
    children: [
      { name: '협력병원 신청 관리', externalUrl: '/cms/cooperation/hospital-apply' },
      { name: '협력의원 신청 관리', externalUrl: '/cms/cooperation/clinic-apply' },
    ],
  },
  {
    name: '협력병의원 수정 관리',
    menuTargetType: 'PARENT',
    children: [
      { name: '협력병원 수정 관리', externalUrl: '/cms/cooperation/hospital-edit' },
      { name: '협력의원 수정 관리', externalUrl: '/cms/cooperation/clinic-edit' },
    ],
  },
  {
    name: '검사이미지 관리',
    menuTargetType: 'PARENT',
    children: [
      { name: '영상검사', externalUrl: '/cms/exam-image/radiology' },
      { name: '내시경검사', externalUrl: '/cms/exam-image/endoscopy' },
      { name: '기타검사', externalUrl: '/cms/exam-image/etc' },
    ],
  },
  {
    name: '콘텐츠 설정',
    menuTargetType: 'LINK',
    externalUrl: '/cms/contents/config',
  },
  {
    name: '콘텐츠 관리',
    menuTargetType: 'LINK',
    externalUrl: '/cms/contents',
  },
  {
    name: '게시판 설정',
    menuTargetType: 'LINK',
    externalUrl: '/cms/board/config',
  },
  {
    name: '게시판 관리',
    menuTargetType: 'LINK',
    externalUrl: '/cms/board',
  },
  {
    name: 'e-Consult',
    menuTargetType: 'LINK',
    externalUrl: '/cms/e-consult',
  },
  {
    name: '시스템 관리',
    menuTargetType: 'PARENT',
    children: [
      { name: '관리자 관리', externalUrl: '/cms/admin-management' },
      { name: 'CMS 메뉴', externalUrl: '/cms/cms-menu' },
      { name: '권한 그룹 관리', externalUrl: '/cms/permission-group' },
      { name: '권한 수정 이력', externalUrl: '/cms/permission-group-history' },
    ],
  },
  {
    name: '로그내역',
    menuTargetType: 'LINK',
    externalUrl: '/cms/log',
  },
];

// ─── GraphQL 요청 헬퍼 ───
async function gql(query, variables, token, hospitalCode) {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      'x-hospital-code': hospitalCode,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors, null, 2));
  }
  return json.data;
}

const CREATE_MENU_MUTATION = `
  mutation CreateMenu($input: CreateMenuInput!) {
    createMenu(input: $input) {
      id
      name
      parentId
      sortOrder
      menuTargetType
      externalUrl
    }
  }
`;

// ─── CLI 인자 파싱 ───
function parseArgs() {
  const args = process.argv.slice(2);
  const result = { token: null, hospital: 'ANAM', dryRun: false };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--token' && args[i + 1]) {
      result.token = args[++i];
    } else if (args[i] === '--hospital' && args[i + 1]) {
      result.hospital = args[++i].toUpperCase();
    } else if (args[i] === '--dry-run') {
      result.dryRun = true;
    }
  }

  return result;
}

// ─── 메인 실행 ───
async function main() {
  const { token, hospital, dryRun } = parseArgs();

  if (!token && !dryRun) {
    console.error('❌ --token <ACCESS_TOKEN> 을 지정해주세요.');
    console.error('');
    console.error('토큰 확인 방법:');
    console.error('  1. CMS에 관리자로 로그인');
    console.error('  2. 브라우저 개발자도구 (F12) → Application → Local Storage');
    console.error('  3. ehr-auth 키의 state.accessToken 값을 복사');
    console.error('');
    console.error('사용법:');
    console.error('  node scripts/seed-cms-menus.mjs --token eyJhbG... --hospital ANAM');
    console.error('  node scripts/seed-cms-menus.mjs --dry-run');
    process.exit(1);
  }

  console.log(`\n🏥 병원: ${hospital}`);
  console.log(`📋 등록할 메뉴: ${MENU_TREE.length}개 (상위) + ${MENU_TREE.reduce((sum, m) => sum + (m.children?.length || 0), 0)}개 (하위)`);
  console.log('');

  if (dryRun) {
    console.log('── [DRY RUN] 등록 예정 메뉴 목록 ──\n');
    MENU_TREE.forEach((menu, i) => {
      const type = menu.menuTargetType === 'PARENT' ? '📂' : '🔗';
      console.log(`${type} ${i + 1}. ${menu.name}${menu.externalUrl ? ` → ${menu.externalUrl}` : ''}`);
      if (menu.children) {
        menu.children.forEach((child, j) => {
          console.log(`   🔗 ${i + 1}-${j + 1}. ${child.name} → ${child.externalUrl}`);
        });
      }
    });
    console.log('\n✅ --dry-run 모드 종료. 실제 등록하려면 --token 을 전달하세요.');
    return;
  }

  let created = 0;
  let failed = 0;

  for (let i = 0; i < MENU_TREE.length; i++) {
    const menu = MENU_TREE[i];
    const isParent = menu.menuTargetType === 'PARENT' && menu.children;

    try {
      // 상위 메뉴 생성
      const input = {
        menuType: 'ADMIN',
        hospitalCode: hospital,
        name: menu.name,
        menuTargetType: menu.menuTargetType,
        ...(menu.externalUrl ? { externalUrl: menu.externalUrl } : {}),
      };

      console.log(`[${i + 1}/${MENU_TREE.length}] 📂 "${menu.name}" 생성 중...`);
      const data = await gql(CREATE_MENU_MUTATION, { input }, token, hospital);
      const parentId = data.createMenu.id;
      created++;
      console.log(`  ✅ 생성 완료 (id: ${parentId})`);

      // 하위 메뉴 생성
      if (isParent && menu.children) {
        for (let j = 0; j < menu.children.length; j++) {
          const child = menu.children[j];
          try {
            const childInput = {
              menuType: 'ADMIN',
              hospitalCode: hospital,
              name: child.name,
              menuTargetType: 'LINK',
              parentId: parentId,
              externalUrl: child.externalUrl,
            };

            console.log(`  [${j + 1}/${menu.children.length}] 🔗 "${child.name}" 생성 중...`);
            const childData = await gql(CREATE_MENU_MUTATION, { input: childInput }, token, hospital);
            created++;
            console.log(`    ✅ 생성 완료 (id: ${childData.createMenu.id})`);
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

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`✅ 완료! 생성: ${created}건, 실패: ${failed}건`);

  if (failed > 0) {
    console.log('\n⚠️  실패한 메뉴가 있습니다. 토큰 만료 또는 중복 등록 여부를 확인하세요.');
  }

  console.log(`\n💡 다른 병원에도 등록하려면:`);
  console.log(`   node scripts/seed-cms-menus.mjs --token ${token.substring(0, 10)}... --hospital GURO`);
  console.log(`   node scripts/seed-cms-menus.mjs --token ${token.substring(0, 10)}... --hospital ANSAN`);
}

main().catch(console.error);
