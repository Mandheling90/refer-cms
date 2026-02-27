'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/organisms/DataTable';
import { RichEditor } from '@/components/organisms/RichEditor';
import type { PageEditorHandle } from '@/components/organisms/PageEditor';

const PageEditor = dynamic(
  () => import('@/components/organisms/PageEditor').then((mod) => ({ default: mod.PageEditor })),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full text-muted-foreground">페이지 에디터 로딩중...</div> },
);
import { ConfirmDialog } from '@/components/molecules/ConfirmDialog';
import { StatusBadge } from '@/components/atoms/StatusBadge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter,
} from '@/components/ui/dialog';
import {
  contentsApi,
  contentsGroupApi,
  type Contents,
  type ContentsGroup,
} from '@/lib/api/contents';
import { toast } from 'sonner';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';
import { Code, Eye, FolderOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';

// ── 샘플 데이터 (API 연동 전 확인용, 실 연동 시 USE_MOCK = false) ──
const USE_MOCK = true;

// 샘플 HTML (진료정보교류 의뢰 페이지)
const SAMPLE_HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>진료정보교류 의뢰 - 고려대학교 안암병원 진료협력센터</title>
  <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
  <link
    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
    rel="stylesheet"
  />
  <style>
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
    html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
    body{font-family:'Pretendard Variable','Pretendard',-apple-system,BlinkMacSystemFont,system-ui,Roboto,'Helvetica Neue','Segoe UI','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;color:#202020;line-height:1.5;background-color:#fff}
    img{max-width:100%;height:auto;display:block}
    a{color:inherit;text-decoration:none}
    ul{list-style:none}
    .page-main{flex:1;padding:64px 0 80px}
    .container{max-width:1530px;margin:0 auto;padding:0 50px}
    .page-title{font-size:40px;font-weight:700;color:#202020;text-align:center;margin:0 0 40px;letter-spacing:-1.6px;line-height:1.4}
    .info-box{background-color:#fdf9f4;border:1px solid #dbbf93;border-radius:10px;padding:40px 20px;text-align:center;margin-bottom:40px}
    .info-box p{font-size:20px;font-weight:400;color:#636363;letter-spacing:-0.8px;line-height:1.5;margin:0}
    .section{margin-bottom:40px}
    .section:last-child{margin-bottom:0}
    .section-title{display:flex;align-items:center;gap:8px;margin-bottom:8px}
    .section-title__icon{width:24px;height:24px;flex-shrink:0}
    .section-title__text{font-size:32px;font-weight:600;color:#202020;letter-spacing:-1.28px;line-height:1.5;margin:0}
    .service-section{margin:40px 0;width:100%}
    .service-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;width:100%;padding-top:5px}
    .service-grid>*{min-width:0;max-width:100%;display:flex;flex-direction:column}
    .service-card{display:flex;flex-direction:column;align-items:center;gap:24px;padding:30px;background-color:#fff;border:1px solid #8c8c8c;border-radius:10px;box-shadow:0 1px 2px rgba(0,0,0,0.05);transition:all 200ms;text-align:center;width:100%;height:100%}
    .service-card:hover{border-color:#9f1836;box-shadow:0 4px 6px rgba(0,0,0,0.1);transform:translateY(-2px)}
    .service-card__icon-circle{width:100px;height:100px;border-radius:50%;background-color:#fcebeb;display:flex;align-items:center;justify-content:center}
    .service-card__icon-circle svg{width:60px;height:60px}
    .service-card__title{font-size:24px;font-weight:600;color:#202020;margin:0;line-height:1.5;letter-spacing:-0.96px;word-break:keep-all}
    .procedure-list-wrapper{margin-left:32px}
    .procedure-info{display:flex;flex-direction:column;gap:8px;padding:0}
    .procedure-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}
    .procedure-item{font-size:20px;font-weight:400;color:#636363;line-height:1.5;letter-spacing:-0.8px;padding-left:16px;position:relative;white-space:pre-line}
    .procedure-item::before{content:'';position:absolute;left:0;top:calc(1em*1.5/2);width:8px;height:2px;background-color:#636363;transform:translateY(-50%)}
    .procedure-item--highlighted{font-size:20px;font-weight:400;color:#636363;line-height:1.5;letter-spacing:-0.8px;padding-left:16px;position:relative}
    .procedure-item--highlighted::before{content:'';position:absolute;left:0;top:calc(1em*1.5/2);width:8px;height:8px;background-color:#9f1836;border-radius:2px;transform:translateY(-50%)}
    .flowchart-image{margin-top:24px;display:flex;justify-content:center;align-items:center;width:100%;border:1px solid #8c8c8c;overflow:hidden}
    .flowchart-image img{width:100%;height:auto;object-fit:contain}
    .application-method{display:flex;flex-direction:column;gap:20px;margin-top:20px}
    .method-steps{flex:1;margin-left:32px}
    .mychart-link{display:flex;align-items:center;justify-content:flex-start;margin-top:16px;margin-left:32px}
    .mychart-button{display:inline-block;text-decoration:none;transition:all 200ms}
    .mychart-button:hover{opacity:0.8}
    .mychart-image{height:auto;object-fit:contain;width:auto}
    @media(min-width:1430px){.application-method{flex-direction:row;align-items:flex-end;justify-content:space-between;gap:24px}.mychart-link{justify-content:center;margin-top:0;margin-left:20px}}
    @media(min-width:769px) and (max-width:1429px){.container{padding:0 24px}.page-title{font-size:36px;margin-bottom:40px;letter-spacing:-1.44px}.info-box{padding:30px}.info-box p{font-size:18px;line-height:27px;letter-spacing:-0.72px}.section-title__text{font-size:24px;letter-spacing:-0.96px}.service-section{margin:24px 0}.service-grid{grid-template-columns:repeat(3,1fr);gap:16px}.service-card{padding:20px;gap:16px}.service-card__icon-circle{width:80px;height:80px}.service-card__icon-circle svg{width:48px;height:48px}.service-card__title{font-size:20px}.procedure-item,.procedure-item--highlighted{font-size:18px;letter-spacing:-0.72px}}
    @media(max-width:768px){.page-main{padding:32px 0 40px}.container{padding:0 16px}.page-title{font-size:24px;margin-bottom:24px;letter-spacing:-0.96px}.info-box{padding:30px}.info-box p{font-size:18px;line-height:27px;letter-spacing:-0.72px}.section-title__text{font-size:24px;letter-spacing:-0.96px}.service-section{margin:24px 0}.service-grid{grid-template-columns:1fr;gap:16px}.service-card{flex-direction:row;align-items:center;justify-content:center;text-align:center;gap:16px;padding:20px 30px;box-shadow:none}.service-card:hover{transform:none;box-shadow:none}.service-card__icon-circle{width:60px;height:60px;flex-shrink:0}.service-card__icon-circle svg{width:36px;height:36px}.service-card__text-wrapper{flex:0 0 auto;display:flex;flex-direction:column;justify-content:center;align-items:center}.service-card__title{font-size:20px;letter-spacing:-0.8px;width:150px;text-align:center}.procedure-list-wrapper{margin-left:16px}.procedure-item,.procedure-item--highlighted{font-size:18px;letter-spacing:-0.72px}.method-steps{margin-left:16px}.mychart-link{margin-left:16px}}
  </style>
</head>
<body>
  <main class="page-main">
    <div class="container">
      <h1 class="page-title">진료정보교류 의뢰</h1>
      <div class="info-box">
        <p>의료기관간 진료기록을 진료에 참조할 수 있도록 전자적으로 진료정보를 공유하는 서비스로 1·2차 병의원에서 3차병원으로,</p>
        <p>또는 1차의원에서 다른 1·2차 병의원으로 환자의 진단 및 치료, 검사를 위해 전자적으로 진료의뢰를 할 수 있습니다.</p>
      </div>
      <section class="service-section">
        <div class="section-title">
          <svg class="section-title__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="19" height="19" rx="3" stroke="#9F1836" stroke-width="2" stroke-linejoin="round"/><path d="M21 21H4V20.8976L20.8976 4H21V21Z" fill="#9F1836"/></svg>
          <h2 class="section-title__text">진료정보교류 사업 목적</h2>
        </div>
        <div class="service-grid">
          <div><div class="service-card"><div class="service-card__icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none"><g clip-path="url(#clip_cont)"><path d="M21.7531 5.87934C15.5891 7.29156 10.1963 11.02 6.68068 16.3002C3.16504 21.5803 1.79294 28.012 2.84576 34.2763M21.7531 5.87934L13.5038 2.5M21.7531 5.87934L19.0034 13.5526M49.4267 41.1842C51.1249 37.75 52.006 33.9664 52.0005 30.1316C52.0005 17.8079 43.083 7.58145 31.3773 5.60579M49.4267 41.1842L57.5 35.6579M49.4267 41.1842L45.1261 32.8947M6.67343 43.9474C8.93289 47.3499 11.9935 50.139 15.5836 52.0672C19.1736 53.9953 23.182 55.0027 27.2526 55C33.3416 55.0076 39.2181 52.7519 43.7512 48.6668M6.67343 43.9474H16.2536M6.67343 43.9474V53.6184" stroke="#5F1F27" stroke-width="3.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.5 22.1906L26.7353 22.9126C26.8333 23.0184 26.9516 23.1029 27.0832 23.1606C27.2147 23.2183 27.3566 23.2481 27.5 23.2481C27.6434 23.2481 27.7853 23.2183 27.9168 23.1606C28.0483 23.1029 28.1667 23.0184 28.2647 22.9126L27.5 22.1906ZM23.9195 40.8346C21.8963 39.1764 19.5353 37.0006 17.6879 34.619C15.8195 32.212 14.593 29.7401 14.593 27.4699H12.5C12.5 30.4551 14.0767 33.3951 16.04 35.9247C18.0242 38.4812 20.5191 40.7698 22.6009 42.4774L23.9195 40.8346ZM14.593 27.4699C14.593 23.3737 16.3623 20.8426 18.5502 19.9754C20.734 19.111 23.7884 19.7286 26.7353 22.9126L28.2647 21.4686C24.9326 17.8673 21.0102 16.7308 17.787 18.0055C14.5679 19.2802 12.5 22.78 12.5 27.4699H14.593ZM32.3977 42.476C34.4809 40.7684 36.9758 38.4798 38.96 35.9233C40.9233 33.3937 42.5 30.4536 42.5 27.4671H40.407C40.407 29.7401 39.1791 32.2106 37.3121 34.6176C35.4646 36.9992 33.1037 39.175 31.0805 40.8332L32.3977 42.476ZM42.5 27.4671C42.5 22.7786 40.4321 19.2788 37.2116 18.0055C33.9884 16.7294 30.0674 17.8645 26.7353 21.4672L28.2647 22.9126C31.2116 19.7286 34.266 19.1096 36.4498 19.974C38.6377 20.8397 40.407 23.3722 40.407 27.4671H42.5ZM22.6009 42.4774C24.373 43.9326 25.6051 45 27.5 45V42.8849C26.4912 42.8849 25.8633 42.428 23.9195 40.8346L22.6009 42.4774ZM31.0805 40.8332C29.1367 42.4266 28.5088 42.8849 27.5 42.8849V45C29.3949 45 30.627 43.9326 32.3991 42.4774L31.0805 40.8332Z" fill="#5F1F27"/></g><defs><clipPath id="clip_cont"><rect width="60" height="60" fill="white"/></clipPath></defs></svg></div><div class="service-card__text-wrapper"><h3 class="service-card__title">진료의 연속성 보장</h3></div></div></div>
          <div><div class="service-card"><div class="service-card__icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none"><path d="M22.5 27.4998H37.5M30 34.9998V19.9998M10 28.1298C10 47.3473 27.295 54.0973 29.7175 54.9498C29.9058 55.0165 30.0942 55.0165 30.2825 54.9498C32.71 54.1248 50 47.5448 50 28.1323V10.7598C50.0005 10.5364 49.9262 10.3193 49.7889 10.143C49.6516 9.96674 49.4593 9.84153 49.2425 9.78735L30.2425 5.02985C30.0833 4.99005 29.9167 4.99005 29.7575 5.02985L10.7575 9.78735C10.5407 9.84153 10.3484 9.96674 10.2111 10.143C10.0738 10.3193 9.99948 10.5364 10 10.7598V28.1298Z" stroke="#5F1F27" stroke-width="3.75" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div class="service-card__text-wrapper"><h3 class="service-card__title">환자 안전 강화</h3></div></div></div>
          <div><div class="service-card"><div class="service-card__icon-circle"><svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none"><g clip-path="url(#clip_qual)"><path d="M33.9453 41.937C33.9467 41.6016 33.8786 41.2696 33.7452 40.9619C33.6118 40.6543 33.416 40.3776 33.1703 40.1495L18.2503 26.3845L3.32527 40.1495C3.07997 40.3778 2.88468 40.6546 2.75172 40.9623C2.61876 41.2699 2.55101 41.6018 2.55277 41.937V55.362C2.55277 56.0025 2.8072 56.6167 3.2601 57.0696C3.713 57.5225 4.32727 57.777 4.96777 57.777H31.5328C32.1733 57.777 32.7875 57.5225 33.2404 57.0696C33.6933 56.6167 33.9478 56.0025 33.9478 55.362L33.9453 41.937ZM42.4928 19.3145C43.6274 19.3339 44.7545 19.1271 45.8084 18.7064C46.8623 18.2856 47.8218 17.6592 48.631 16.8637C49.4403 16.0681 50.083 15.1195 50.5217 14.0729C50.9605 13.0264 51.1864 11.903 51.1864 10.7682C51.1864 9.63343 50.9605 8.51001 50.5217 7.46348C50.083 6.41695 49.4403 5.46826 48.631 4.67275C47.8218 3.87723 46.8623 3.25081 45.8084 2.83004C44.7545 2.40926 43.6274 2.20255 42.4928 2.22195C40.2515 2.26029 38.1149 3.17755 36.5435 4.77611C34.972 6.37467 34.0914 8.52658 34.0914 10.7682C34.0914 13.0098 34.972 15.1617 36.5435 16.7603C38.1149 18.3589 40.2515 19.2761 42.4928 19.3145Z" stroke="#5F1F27" stroke-width="3.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M41.0567 57.7752H48.9017L51.0392 40.6802H57.4492V34.2727C57.4492 31.0327 56.3971 27.8804 54.4512 25.2898C52.5054 22.6992 49.7709 20.8105 46.6593 19.9078C43.5476 19.005 40.2269 19.137 37.1968 20.284C34.1666 21.431 31.5907 23.5308 29.8567 26.2677M18.2467 39.0802V51.1652M24.2892 45.1227H12.1992" stroke="#5F1F27" stroke-width="3.75" stroke-linecap="round" stroke-linejoin="round"/></g><defs><clipPath id="clip_qual"><rect width="60" height="60" fill="white"/></clipPath></defs></svg></div><div class="service-card__text-wrapper"><h3 class="service-card__title">의료서비스 질 향상</h3></div></div></div>
        </div>
      </section>
      <section class="section">
        <div class="section-title">
          <svg class="section-title__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="19" height="19" rx="3" stroke="#9F1836" stroke-width="2" stroke-linejoin="round"/><path d="M21 21H4V20.8976L20.8976 4H21V21Z" fill="#9F1836"/></svg>
          <h2 class="section-title__text">진료정보교류 진료의뢰 절차</h2>
        </div>
        <div class="procedure-list-wrapper">
          <div class="procedure-info">
            <ul class="procedure-list">
              <li class="procedure-item--highlighted">진료정보교류에 대한 개인정보제공 동의 필요(최초 1회)</li>
              <li class="procedure-item">포털(마이차트, mychart.kr)에서 본인인증을 통한 동의</li>
              <li class="procedure-item">의료기관 방문을 통한 동의(전자 또는 서면)</li>
            </ul>
          </div>
        </div>
        <div class="flowchart-image">
          <img src="../images/service/flowchart-referral-process.png" alt="진료정보교류 진료의뢰 절차 플로우차트" />
        </div>
      </section>
      <section class="section">
        <div class="section-title">
          <svg class="section-title__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="19" height="19" rx="3" stroke="#9F1836" stroke-width="2" stroke-linejoin="round"/><path d="M21 21H4V20.8976L20.8976 4H21V21Z" fill="#9F1836"/></svg>
          <h2 class="section-title__text">진료정보교류사업 이용 신청 방법</h2>
        </div>
        <div class="application-method">
          <div class="method-steps">
            <div class="procedure-info">
              <ul class="procedure-list">
                <li class="procedure-item">보건복지부 마이차트 회원가입 (http://mychart.kr)</li>
                <li class="procedure-item">이용신청서 작성</li>
                <li class="procedure-item">승인 (거점의료기관 승인 -> 한국보건의료정보원 최종 승인)</li>
              </ul>
            </div>
          </div>
          <div class="mychart-link">
            <a href="http://mychart.kr" target="_blank" rel="noopener noreferrer" class="mychart-button">
              <img src="../images/service/myChartTitle.png" alt="보건복지부 마이차트" width="200" height="60" class="mychart-image" />
            </a>
          </div>
        </div>
      </section>
      <section class="section">
        <div class="section-title">
          <svg class="section-title__icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="3" width="19" height="19" rx="3" stroke="#9F1836" stroke-width="2" stroke-linejoin="round"/><path d="M21 21H4V20.8976L20.8976 4H21V21Z" fill="#9F1836"/></svg>
          <h2 class="section-title__text">문의</h2>
        </div>
        <div class="method-steps">
          <div class="procedure-info">
            <ul class="procedure-list">
              <li class="procedure-item">고려대학교 안암병원 진료협력센터 : 02-920-5892</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </main>
</body>
</html>`;

const MOCK_GROUPS: ContentsGroup[] = [
  { CONTENTS_GRP_ID: 'G01', CONTENTS_GRP_NAME: '병원소개', USE_YN: 'Y', CONTENTS_COUNT: 5 },
  { CONTENTS_GRP_ID: 'G02', CONTENTS_GRP_NAME: '진료안내', USE_YN: 'Y', CONTENTS_COUNT: 3 },
  { CONTENTS_GRP_ID: 'G03', CONTENTS_GRP_NAME: '건강정보', USE_YN: 'Y', CONTENTS_COUNT: 4 },
  { CONTENTS_GRP_ID: 'G04', CONTENTS_GRP_NAME: '공지사항', USE_YN: 'Y', CONTENTS_COUNT: 6 },
  { CONTENTS_GRP_ID: 'G05', CONTENTS_GRP_NAME: '이용안내', USE_YN: 'Y', CONTENTS_COUNT: 2 },
];

const MOCK_CONTENTS: Record<string, Contents[]> = {
  G01: [
    { CONTENTS_ID: 'C001', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '인사말', USE_YN: 'Y', INSERT_DTTM: '2025-04-01 09:00', INSERT_USER: '이준용', UPDATE_USER: '이준용', UPDATE_DTTM: '2025-04-10 14:22:30' },
    { CONTENTS_ID: 'C002', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '병원 연혁', USE_YN: 'Y', INSERT_DTTM: '2025-04-02 10:30', INSERT_USER: '이준용', UPDATE_USER: '김주환', UPDATE_DTTM: '2025-04-12 09:15:00' },
    { CONTENTS_ID: 'C003', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '조직도', USE_YN: 'Y', INSERT_DTTM: '2025-04-03 14:00', INSERT_USER: '김주환', UPDATE_USER: '김주환', UPDATE_DTTM: '2025-04-15 11:30:45' },
    { CONTENTS_ID: 'C004', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '찾아오시는 길', USE_YN: 'Y', INSERT_DTTM: '2025-04-05 11:20', INSERT_USER: '이준용', UPDATE_USER: '이준용', UPDATE_DTTM: '2025-04-18 16:05:12' },
    { CONTENTS_ID: 'C005', CONTENTS_GRP_ID: 'G01', CONTENTS_NAME: '층별안내', USE_YN: 'N', INSERT_DTTM: '2025-04-06 16:45', INSERT_USER: '김주환', UPDATE_USER: '이준용', UPDATE_DTTM: '2025-04-20 08:04:44' },
  ],
  G02: [
    { CONTENTS_ID: 'C006', CONTENTS_GRP_ID: 'G02', CONTENTS_NAME: '외래진료 안내', USE_YN: 'Y', INSERT_DTTM: '2025-03-20 08:00', INSERT_USER: '이준용', UPDATE_USER: '김주환', UPDATE_DTTM: '2025-04-01 10:00:00', CONTENTS_BODY: SAMPLE_HTML },
    { CONTENTS_ID: 'C007', CONTENTS_GRP_ID: 'G02', CONTENTS_NAME: '입원진료 안내', USE_YN: 'Y', INSERT_DTTM: '2025-03-21 09:15', INSERT_USER: '김주환', UPDATE_USER: '김주환', UPDATE_DTTM: '2025-04-05 13:20:00' },
    { CONTENTS_ID: 'C008', CONTENTS_GRP_ID: 'G02', CONTENTS_NAME: '응급진료 안내', USE_YN: 'N', INSERT_DTTM: '2025-03-22 13:40', INSERT_USER: '이준용', UPDATE_USER: '이준용', UPDATE_DTTM: '2025-04-08 15:45:00' },
  ],
  G03: [
    { CONTENTS_ID: 'C009', CONTENTS_GRP_ID: 'G03', CONTENTS_NAME: '건강 칼럼', USE_YN: 'Y', INSERT_DTTM: '2025-04-10 10:00', INSERT_USER: '김주환' },
    { CONTENTS_ID: 'C010', CONTENTS_GRP_ID: 'G03', CONTENTS_NAME: '질환 정보', USE_YN: 'Y', INSERT_DTTM: '2025-04-11 11:00', INSERT_USER: '이준용' },
    { CONTENTS_ID: 'C011', CONTENTS_GRP_ID: 'G03', CONTENTS_NAME: '예방접종 안내', USE_YN: 'Y', INSERT_DTTM: '2025-04-12 14:30', INSERT_USER: '김주환' },
    { CONTENTS_ID: 'C012', CONTENTS_GRP_ID: 'G03', CONTENTS_NAME: '건강검진 프로그램', USE_YN: 'N', INSERT_DTTM: '2025-04-13 09:20', INSERT_USER: '이준용' },
  ],
  G04: [
    { CONTENTS_ID: 'C013', CONTENTS_GRP_ID: 'G04', CONTENTS_NAME: '진료시간 변경 안내', USE_YN: 'Y', INSERT_DTTM: '2025-04-15 08:30', INSERT_USER: '이준용' },
    { CONTENTS_ID: 'C014', CONTENTS_GRP_ID: 'G04', CONTENTS_NAME: '시스템 점검 공지', USE_YN: 'Y', INSERT_DTTM: '2025-04-16 10:00', INSERT_USER: '김주환' },
    { CONTENTS_ID: 'C015', CONTENTS_GRP_ID: 'G04', CONTENTS_NAME: '신규 의료진 안내', USE_YN: 'Y', INSERT_DTTM: '2025-04-17 11:15', INSERT_USER: '이준용' },
    { CONTENTS_ID: 'C016', CONTENTS_GRP_ID: 'G04', CONTENTS_NAME: '주차장 이용 안내', USE_YN: 'Y', INSERT_DTTM: '2025-04-18 14:00', INSERT_USER: '김주환' },
    { CONTENTS_ID: 'C017', CONTENTS_GRP_ID: 'G04', CONTENTS_NAME: '휴진 안내', USE_YN: 'N', INSERT_DTTM: '2025-04-19 09:00', INSERT_USER: '이준용' },
    { CONTENTS_ID: 'C018', CONTENTS_GRP_ID: 'G04', CONTENTS_NAME: '코로나19 대응 지침', USE_YN: 'Y', INSERT_DTTM: '2025-04-20 16:30', INSERT_USER: '김주환' },
  ],
  G05: [
    { CONTENTS_ID: 'C019', CONTENTS_GRP_ID: 'G05', CONTENTS_NAME: '증명서 발급 안내', USE_YN: 'Y', INSERT_DTTM: '2025-04-22 10:00', INSERT_USER: '이준용' },
    { CONTENTS_ID: 'C020', CONTENTS_GRP_ID: 'G05', CONTENTS_NAME: '원내 편의시설', USE_YN: 'Y', INSERT_DTTM: '2025-04-23 11:30', INSERT_USER: '김주환' },
  ],
};

// ── 컬럼 정의 ──
const columns: ColumnDef<Contents, unknown>[] = [
  {
    accessorKey: 'ROW_NUM',
    header: '번호',
    size: 70,
    cell: ({ row }) => row.index + 1,
  },
  { accessorKey: 'CONTENTS_NAME', header: '제목', size: 300 },
  {
    accessorKey: 'USE_YN',
    header: '노출여부',
    size: 100,
    cell: ({ getValue }) => (
      <StatusBadge
        status={(getValue() as string) || 'N'}
        activeLabel="노출"
        inactiveLabel="비노출"
      />
    ),
  },
  { accessorKey: 'INSERT_DTTM', header: '등록일시', size: 160 },
];

export default function ContentsPage() {
  // 그룹 상태
  const [groups, setGroups] = useState<ContentsGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ContentsGroup | null>(null);

  // 콘텐츠 리스트 상태
  const [data, setData] = useState<Contents[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selectedRows, setSelectedRows] = useState<Contents[]>([]);
  const [searchName, setSearchName] = useState('');

  // 다이얼로그 상태
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<Contents>>({});
  const [editorMode, setEditorMode] = useState<'richtext' | 'pageeditor'>('richtext');
  const [pageEditorOpen, setPageEditorOpen] = useState(false);
  const [pageEditorKey, setPageEditorKey] = useState(0);
  const pageEditorRef = useRef<PageEditorHandle>(null);

  // 미리보기: 새 탭에서 전체 HTML 렌더링
  const handlePreview = useCallback(() => {
    const html = formData.CONTENTS_BODY;
    if (!html) return;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  }, [formData.CONTENTS_BODY]);

  const user = useAuthStore((s) => s.user);
  const currentUserName = user?.USER_NM || '관리자';

  // mock 데이터 저장소 (추가/삭제 반영용)
  const mockContentsRef = useRef<Record<string, Contents[]>>(
    JSON.parse(JSON.stringify(MOCK_CONTENTS)),
  );

  // ── 그룹 목록 조회 ──
  const retrieveGroups = useCallback(async () => {
    if (USE_MOCK) {
      const list = MOCK_GROUPS.map((g) => ({
        ...g,
        CONTENTS_COUNT: (mockContentsRef.current[g.CONTENTS_GRP_ID] || []).length,
      }));
      setGroups(list);
      return list;
    }
    try {
      const res = await contentsGroupApi.list({ USE_YN: 'Y' });
      const list = res.list || [];
      setGroups(list);
      return list;
    } catch {
      toast.error('콘텐츠 그룹 조회에 실패했습니다.');
      return [];
    }
  }, []);

  // ── 콘텐츠 목록 조회 ──
  const retrieveList = useCallback(
    async (grpId: string, page = 1, size = pageSize, search = '') => {
      setLoading(true);
      if (USE_MOCK) {
        let items = mockContentsRef.current[grpId] || [];
        if (search) {
          items = items.filter((c) => c.CONTENTS_NAME.includes(search));
        }
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
          CONTENTS_GRP_ID: grpId,
        };
        if (search) params.CONTENTS_NAME = search;
        const res = await contentsApi.list(params);
        setData(res.list || []);
        setTotalItems(res.TOTAL_ENTITY || 0);
      } catch {
        toast.error('콘텐츠 목록 조회에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    },
    [pageSize],
  );

  // ── 초기 로딩 ──
  useEffect(() => {
    (async () => {
      const list = await retrieveGroups();
      if (list.length > 0) {
        setSelectedGroup(list[0]);
        retrieveList(list[0].CONTENTS_GRP_ID, 1, pageSize);
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 그룹 선택 핸들러 ──
  const handleGroupSelect = (group: ContentsGroup) => {
    if (selectedGroup?.CONTENTS_GRP_ID === group.CONTENTS_GRP_ID) return;
    setSelectedGroup(group);
    setCurrentPage(1);
    setSearchName('');
    setSelectedRows([]);
    retrieveList(group.CONTENTS_GRP_ID, 1, pageSize);
  };

  // ── 검색 ──
  const handleSearch = () => {
    if (!selectedGroup) return;
    setCurrentPage(1);
    retrieveList(selectedGroup.CONTENTS_GRP_ID, 1, pageSize, searchName);
  };

  // ── 저장 (등록/수정 공용) ──
  const handleSave = async () => {
    if (!formData.CONTENTS_NAME?.trim()) {
      toast.error('제목은 필수 입력입니다.');
      return;
    }
    if (USE_MOCK && selectedGroup) {
      const grpId = selectedGroup.CONTENTS_GRP_ID;
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      if (isEditMode && formData.CONTENTS_ID) {
        // 수정
        mockContentsRef.current[grpId] = (mockContentsRef.current[grpId] || []).map((c) =>
          c.CONTENTS_ID === formData.CONTENTS_ID
            ? { ...c, ...formData, UPDATE_USER: currentUserName, UPDATE_DTTM: now }
            : c,
        );
      } else {
        // 등록
        const items = mockContentsRef.current[grpId] || [];
        const newItem: Contents = {
          CONTENTS_ID: `C${String(Date.now()).slice(-6)}`,
          CONTENTS_GRP_ID: grpId,
          CONTENTS_NAME: formData.CONTENTS_NAME!,
          CONTENTS_BODY: formData.CONTENTS_BODY,
          USE_YN: formData.USE_YN || 'Y',
          SCRIPT: formData.SCRIPT,
          INSERT_USER: currentUserName,
          INSERT_DTTM: now,
        };
        mockContentsRef.current[grpId] = [...items, newItem];
      }
      toast.success('저장되었습니다.');
      setDialogOpen(false);
      setFormData({});
      retrieveGroups();
      retrieveList(grpId, 1, pageSize);
      return;
    }
    try {
      const saveData = {
        ...formData,
        CONTENTS_GRP_ID: selectedGroup?.CONTENTS_GRP_ID,
      };
      const res = await contentsApi.save(saveData);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('저장되었습니다.');
        setDialogOpen(false);
        setFormData({});
        if (selectedGroup) {
          retrieveGroups();
          retrieveList(selectedGroup.CONTENTS_GRP_ID, 1, pageSize);
        }
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '저장에 실패했습니다.');
      }
    } catch {
      toast.error('저장에 실패했습니다.');
    }
  };

  // ── 선택 삭제 ──
  const handleDelete = async () => {
    if (USE_MOCK && selectedGroup) {
      const grpId = selectedGroup.CONTENTS_GRP_ID;
      const deleteIds = new Set(selectedRows.map((r) => r.CONTENTS_ID));
      mockContentsRef.current[grpId] = (mockContentsRef.current[grpId] || []).filter(
        (c) => !deleteIds.has(c.CONTENTS_ID),
      );
      toast.success('삭제되었습니다.');
      setSelectedRows([]);
      setConfirmOpen(false);
      retrieveGroups();
      retrieveList(grpId, 1, pageSize);
      return;
    }
    try {
      const res = await contentsApi.remove(selectedRows);
      if (res.ServiceResult.IS_SUCCESS) {
        toast.success('삭제되었습니다.');
        setSelectedRows([]);
        if (selectedGroup) {
          retrieveGroups();
          retrieveList(selectedGroup.CONTENTS_GRP_ID, 1, pageSize);
        }
      } else {
        toast.error(res.ServiceResult.MESSAGE_TEXT || '삭제에 실패했습니다.');
      }
    } catch {
      toast.error('삭제에 실패했습니다.');
    }
    setConfirmOpen(false);
  };

  // ── 신규 등록 다이얼로그 열기 ──
  const handleOpenDialog = () => {
    setIsEditMode(false);
    setFormData({ USE_YN: 'Y' });
    setEditorMode('richtext');
    setDialogOpen(true);
  };

  // ── 수정 다이얼로그 열기 (행 클릭) ──
  const handleRowClick = (row: Contents) => {
    setIsEditMode(true);
    setFormData({ ...row });
    // 콘텐츠 내용에 따라 에디터 모드 자동 감지
    const body = row.CONTENTS_BODY || '';
    const isFullHtml = body.includes('<!DOCTYPE') || body.includes('<html') || body.includes('<style');
    setEditorMode(isFullHtml ? 'pageeditor' : 'richtext');
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">콘텐츠 관리</h1>

      <div className="flex gap-6">
        {/* 좌측: 콘텐츠 그룹 영역 */}
        <section className="w-[260px] shrink-0 rounded-xl bg-card shadow-[0_0_12px_rgba(0,0,0,0.1)]">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-500">
            <b className="text-base">콘텐츠 그룹</b>
            <span className="text-sm text-muted-foreground">
              총 <span className="text-primary font-semibold">{groups.length}</span>건
            </span>
          </div>
          <nav className="p-3 space-y-1 max-h-[calc(100vh-260px)] overflow-y-auto">
            {groups.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-8">
                등록된 그룹이 없습니다.
              </p>
            ) : (
              groups.map((group) => {
                const isSelected =
                  selectedGroup?.CONTENTS_GRP_ID === group.CONTENTS_GRP_ID;
                return (
                  <button
                    key={group.CONTENTS_GRP_ID}
                    onClick={() => handleGroupSelect(group)}
                    className={cn(
                      'flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left text-sm transition-colors',
                      isSelected
                        ? 'bg-primary text-white font-semibold'
                        : 'hover:bg-gray-300 text-foreground',
                    )}
                  >
                    <FolderOpen className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">
                      {group.CONTENTS_GRP_NAME}
                    </span>
                    {group.CONTENTS_COUNT != null && (
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-400 text-foreground',
                        )}
                      >
                        {group.CONTENTS_COUNT}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </nav>
        </section>

        {/* 우측: 그룹 별 콘텐츠 */}
        <section className="flex-1 rounded-xl bg-card shadow-[0_0_12px_rgba(0,0,0,0.1)]">
          {/* 헤더: 그룹명 + 건수 + 버튼 */}
          <div className="flex items-center justify-between px-6 py-4">
            <b className="text-base">
              {selectedGroup
                ? `${selectedGroup.CONTENTS_GRP_NAME} 콘텐츠`
                : '그룹을 선택하세요'}
              {selectedGroup && (
                <span className="ml-2 font-normal text-sm text-muted-foreground">
                  총 <span className="text-primary font-semibold">{totalItems}</span>건
                </span>
              )}
            </b>
            <div className="flex items-center gap-2">
              <Button
                variant="outline-red"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={selectedRows.length === 0}
              >
                <Trash2 className="h-4 w-4" />
                삭제
              </Button>
              <Button
                size="sm"
                onClick={handleOpenDialog}
                disabled={!selectedGroup}
              >
                <Plus className="h-4 w-4" />
                신규 등록
              </Button>
            </div>
          </div>

          {/* 검색 */}
          {selectedGroup && (
            <div className="border-t border-gray-500 px-6 py-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearch();
                }}
                className="flex items-end gap-4"
              >
                <div className="flex flex-col gap-1.5 flex-1 max-w-xs">
                  <label className="text-sm font-semibold text-foreground">
                    제목
                  </label>
                  <Input
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                    placeholder="제목 검색"
                  />
                </div>
                <Button type="submit" size="md">
                  <Search className="h-4 w-4" />
                  조회
                </Button>
              </form>
            </div>
          )}

          {/* 테이블 */}
          <div className="border-t border-gray-500 px-6 py-5">
            {selectedGroup ? (
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
                  if (selectedGroup) {
                    retrieveList(selectedGroup.CONTENTS_GRP_ID, page, pageSize, searchName);
                  }
                }}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setCurrentPage(1);
                  if (selectedGroup) {
                    retrieveList(selectedGroup.CONTENTS_GRP_ID, 1, size, searchName);
                  }
                }}
                onRowClick={handleRowClick}
                onSelectionChange={setSelectedRows}
              />
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                좌측에서 콘텐츠 그룹을 선택하세요.
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
            // CKEditor 팝업 클릭 시 Dialog 닫힘 방지
            const target = e.target as HTMLElement;
            if (target.closest('.ck-body-wrapper') || target.closest('.ck-balloon-panel') || target.closest('.ck-dialog')) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>{isEditMode ? '콘텐츠 수정' : '콘텐츠 등록'}</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-5 overflow-y-auto flex-1">
            {/* 등록: 작성자명 / 수정: 최종 수정자명 + 최종 수정일자 */}
            {isEditMode ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>최종 수정자명</Label>
                  <Input
                    value={formData.UPDATE_USER || '-'}
                    readOnly
                    className="bg-gray-200 text-muted-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>최종 수정일자</Label>
                  <Input
                    value={formData.UPDATE_DTTM || '-'}
                    readOnly
                    className="bg-gray-200 text-muted-foreground"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>작성자명 <span className="text-destructive">*</span></Label>
                <Input
                  value={currentUserName}
                  readOnly
                  className="bg-gray-200 text-muted-foreground"
                />
              </div>
            )}

            {/* 사용여부 */}
            <div className="space-y-1.5">
              <Label>사용여부 <span className="text-destructive">*</span></Label>
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

            {/* 제목 */}
            <div className="space-y-1.5">
              <Label>제목 <span className="text-destructive">*</span></Label>
              <Input
                value={formData.CONTENTS_NAME || ''}
                onChange={(e) =>
                  setFormData({ ...formData, CONTENTS_NAME: e.target.value })
                }
                placeholder="제목을 입력하세요"
              />
            </div>

            {/* 에디터 (본문) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>본문</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={editorMode === 'richtext' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setEditorMode('richtext')}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    간편 에디터
                  </Button>
                  <Button
                    type="button"
                    variant={editorMode === 'pageeditor' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setEditorMode('pageeditor');
                      setPageEditorKey((k) => k + 1);
                      setPageEditorOpen(true);
                    }}
                  >
                    <Code className="h-3.5 w-3.5" />
                    페이지 에디터
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handlePreview}
                    disabled={!formData.CONTENTS_BODY}
                  >
                    <Eye className="h-3.5 w-3.5" />
                    미리보기
                  </Button>
                </div>
              </div>

              {editorMode === 'richtext' ? (
                <RichEditor
                  value={formData.CONTENTS_BODY || ''}
                  onChange={(data) =>
                    setFormData({ ...formData, CONTENTS_BODY: data })
                  }
                  placeholder="내용을 입력하세요"
                  minHeight={200}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-gray-400 p-6 text-center text-sm text-muted-foreground">
                  <p>페이지 에디터로 편집 중입니다.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
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

            <Separator />

            {/* 스크립트 */}
            <div className="space-y-1.5">
              <Label>스크립트</Label>
              <Textarea
                value={formData.SCRIPT || ''}
                onChange={(e) =>
                  setFormData({ ...formData, SCRIPT: e.target.value })
                }
                placeholder="(컨텐츠 출력 및 설정에 필요한 스크립트)"
                rows={3}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSave}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 팝업 */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="콘텐츠 삭제"
        description="콘텐츠 삭제 후 복구가 불가능합니다. 정말 삭제하시겠습니까?"
        onConfirm={handleDelete}
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
        >
          <DialogHeader className="flex-row items-center justify-between px-4 py-3 shrink-0">
            <DialogTitle className="text-lg">페이지 에디터</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                disabled={!formData.CONTENTS_BODY}
              >
                <Eye className="h-4 w-4" />
                미리보기
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  // 닫기 전에 에디터에서 최신 HTML을 명시적으로 가져옴
                  if (pageEditorRef.current) {
                    const html = pageEditorRef.current.getCurrentHtml();
                    setFormData((prev) => ({ ...prev, CONTENTS_BODY: html }));
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
                value={formData.CONTENTS_BODY || ''}
                onChange={(html) =>
                  setFormData((prev) => ({ ...prev, CONTENTS_BODY: html }))
                }
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
