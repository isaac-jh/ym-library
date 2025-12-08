/**
 * Backup Status API 관련 함수
 * 백업 상태 데이터를 조회하는 API 호출을 담당합니다.
 */

import { get } from './client';
import { API_ENDPOINTS } from './config';
import type { BackupStatusItem } from '../types';

/**
 * 전체 백업 상태 목록을 조회합니다.
 * @param limit - 조회할 최대 개수 (기본값: 9999)
 * @returns Promise<BackupStatusItem[]> - 백업 상태 목록
 */
export async function fetchBackupStatus(
  limit: number = 9999
): Promise<BackupStatusItem[]> {
  try {
    const response = await get<BackupStatusItem[]>(
      API_ENDPOINTS.BACKUP_STATUS,
      { limit }
    );

    // 응답 데이터 검증 및 파싱
    if (Array.isArray(response)) {
      return response;
    }

    // 배열이 아닌 경우 빈 배열 반환
    console.warn('Invalid response format:', response);
    return [];
  } catch (error) {
    console.error('Failed to fetch backup status:', error);
    throw error;
  }
}

/**
 * 백업 상태를 필터링합니다.
 * 클라이언트 사이드에서 필터링을 수행합니다.
 * @param items - 백업 상태 목록
 * @param filters - 필터 조건
 * @returns BackupStatusItem[]
 */
export function filterBackupStatus(
  items: BackupStatusItem[],
  filters: {
    eventName?: string;
    name?: string;
    cam?: boolean | null;
    master?: boolean | null;
    clean?: boolean;
    finalProduct?: boolean;
  }
): BackupStatusItem[] {
  return items.filter((item) => {
    // 이벤트명 필터
    if (filters.eventName && item.event_name) {
      if (!item.event_name.toLowerCase().includes(filters.eventName.toLowerCase())) {
        return false;
      }
    }

    // 이름 필터
    if (filters.name) {
      if (!item.name.toLowerCase().includes(filters.name.toLowerCase())) {
        return false;
      }
    }

    // CAM 상태 필터
    if (filters.cam !== undefined) {
      if (item.cam !== filters.cam) {
        return false;
      }
    }

    // Master 상태 필터
    if (filters.master !== undefined) {
      if (item.master !== filters.master) {
        return false;
      }
    }

    // Clean 상태 필터
    if (filters.clean !== undefined) {
      if (item.clean !== filters.clean) {
        return false;
      }
    }

    // Final Product 상태 필터
    if (filters.finalProduct !== undefined) {
      if (item.final_product !== filters.finalProduct) {
        return false;
      }
    }

    return true;
  });
}

