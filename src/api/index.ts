/**
 * API 모듈 진입점
 * 모든 API 관련 함수와 설정을 export합니다.
 */

// API 클라이언트 함수
export { apiClient, get, post } from './client';

// API 설정
export { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from './config';

// Storage API 함수
export {
  fetchAllStorageCatalogs,
  searchStorageCatalogs,
} from './storageApi';

// Backup API 함수
export {
  fetchBackupStatus,
  filterBackupStatus,
} from './backupApi';

// Auth API 함수
export {
  login,
} from './authApi';

// 타입 re-export
export type { 
  ActivityItem, 
  StorageCatalogsResponse, 
  BackupStatusItem,
  User,
  LoginRequest,
  LoginResponse,
  ApiError 
} from '../types';

