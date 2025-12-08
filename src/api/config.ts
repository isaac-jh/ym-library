/**
 * API 설정 및 상수
 */

/**
 * API 기본 URL
 * TODO: 환경 변수로 분리 고려 (개발/프로덕션 환경 분리)
 */
export const API_BASE_URL = 'http://15.164.45.130:8000/api/v1';

/**
 * API 엔드포인트
 */
export const API_ENDPOINTS = {
  STORAGE_CATALOGS: '/storage-catalogs',
  BACKUP_STATUS: '/backup-status',
  AUTH_LOGIN: '/auth/login',
  // TODO: 추가 엔드포인트 정의
} as const;

/**
 * API 요청 기본 설정
 */
export const DEFAULT_REQUEST_CONFIG: RequestInit = {
  headers: {
    'Content-Type': 'application/json',
  },
};

/**
 * API 타임아웃 (밀리초)
 */
export const API_TIMEOUT = 30000;

