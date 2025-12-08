/**
 * API 응답 및 데이터 타입 정의
 */

/**
 * 활동 아이템 타입
 * storage-catalogs API의 개별 아이템 구조
 */
export type ActivityItem = {
  id: number;
  storage: string;
  category: string;
  year: number;
  month: number;
  activity_name: string;
  description: string | null;
};

/**
 * Storage Catalogs API 응답 타입
 */
export type StorageCatalogsResponse = {
  items: ActivityItem[];
  total?: number;
};

/**
 * 백업 상태 아이템 타입
 * backup-status API의 개별 아이템 구조
 */
export type BackupStatusItem = {
  id: number;
  event_name: string | null;
  displayed_date: string | null;
  name: string;
  description: string | null;
  cam: boolean | null;
  cam_checker: number | null;
  cam_checker_name: string | null;
  master: boolean | null;
  master_checker: number | null;
  master_checker_name: string | null;
  clean: boolean;
  clean_checker: number | null;
  clean_checker_name: string | null;
  final_product: boolean;
  final_product_checker: number | null;
  final_product_checker_name: string | null;
  created_at: string;
  producers: string[];
};

/**
 * 로그인 요청 타입
 */
export type LoginRequest = {
  nickname: string;
  password: string;
};

/**
 * 유저 정보 타입
 */
export type User = {
  id: number;
  name: string;
  nickname: string;
  deleted: boolean;
  created_at: string;
};

/**
 * 로그인 응답 타입
 */
export type LoginResponse = {
  token?: string;
  user?: User;
  id?: number;
  name?: string;
  nickname?: string;
  deleted?: boolean;
  created_at?: string;
  message?: string;
};

/**
 * API 에러 응답 타입
 */
export type ApiError = {
  message: string;
  status?: number;
};

