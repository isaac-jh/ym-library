/**
 * API 모듈 진입점
 * 모든 API 관련 함수와 설정을 export합니다.
 */

// API 클라이언트 함수
export { apiClient, get, post, put, patch } from './client';

// API 설정
export { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from './config';

// Storage API 함수
export {
  fetchAllStorageCatalogs,
  searchStorageCatalogs,
  createStorageCatalog,
  updateStorageCatalog,
  deleteStorageCatalog,
} from './storageApi';

// Backup API 함수
export {
  fetchBackupStatus,
  filterBackupStatus,
  createBackupStatus,
  updateBackupStatus,
  deleteBackupStatus,
  markBackupComplete,
} from './backupApi';

// Auth API 함수
export {
  login,
  fetchUsers,
} from './authApi';

// 타입 re-export
export type { 
  ActivityItem,
  CategoryType,
  BackupStatusItem,
  User,
  LoginRequest,
  LoginResponse,
  ApiError 
} from '../types';

