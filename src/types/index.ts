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
 * API 에러 응답 타입
 */
export type ApiError = {
  message: string;
  status?: number;
};

