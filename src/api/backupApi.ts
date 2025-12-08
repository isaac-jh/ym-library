/**
 * Backup Status API 관련 함수
 * 백업 상태 데이터를 조회하는 API 호출을 담당합니다.
 */

import { get, post, put, patch, apiClient } from './client';
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

/**
 * 새로운 백업 항목을 생성합니다.
 * @param data - 생성할 백업 데이터
 * @param createdBy - 생성자 ID
 * @returns Promise<BackupStatusItem>
 */
export async function createBackupStatus(
  data: {
    event_name: string | null;
    displayed_date: string | null;
    name: string;
    description: string | null;
    cam: boolean | null;
    cam_checker: number | null;
    master: boolean | null;
    master_checker: number | null;
    clean: boolean | null;
    clean_checker: number | null;
    final_product: boolean | null;
    final_product_checker: number | null;
    user_ids: number[];
  },
  createdBy: number
): Promise<BackupStatusItem> {
  try {
    const response = await post<BackupStatusItem>(
      API_ENDPOINTS.BACKUP_STATUS,
      {
        ...data,
        created_by: createdBy,
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to create backup status:', error);
    throw error;
  }
}

/**
 * 백업 항목을 수정합니다.
 * @param id - 백업 항목 ID
 * @param data - 수정할 데이터
 * @param updatedBy - 수정자 ID
 * @returns Promise<BackupStatusItem>
 */
export async function updateBackupStatus(
  id: number,
  data: {
    event_name?: string | null;
    displayed_date?: string | null;
    name?: string;
    description?: string | null;
    cam?: boolean | null;
    cam_checker?: number | null;
    master?: boolean | null;
    master_checker?: number | null;
    clean?: boolean | null;
    clean_checker?: number | null;
    final_product?: boolean | null;
    final_product_checker?: number | null;
    user_ids?: number[];
  },
  updatedBy: number
): Promise<BackupStatusItem> {
  try {
    const response = await put<BackupStatusItem>(
      `${API_ENDPOINTS.BACKUP_STATUS}/${id}`,
      {
        ...data,
        updated_by: updatedBy,
      }
    );
    return response;
  } catch (error) {
    console.error('Failed to update backup status:', error);
    throw error;
  }
}

/**
 * 백업 항목을 삭제합니다.
 * @param id - 백업 항목 ID
 * @param deletedBy - 삭제자 ID
 * @returns Promise<void>
 */
export async function deleteBackupStatus(id: number, deletedBy: number): Promise<void> {
  try {
    await apiClient(`${API_ENDPOINTS.BACKUP_STATUS}/${id}?deleted_by=${deletedBy}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete backup status:', error);
    throw error;
  }
}

/**
 * 백업 완료 상태를 변경합니다.
 * @param backupId - 백업 항목 ID
 * @param currentUserId - 현재 유저 ID
 * @param changes - 변경할 필드들 (변경된 것만 포함)
 * @returns Promise<BackupStatusItem>
 */
export async function markBackupComplete(
  backupId: number,
  currentUserId: number,
  changes: {
    cam?: boolean;
    master?: boolean;
    clean?: boolean;
    final_product?: boolean;
  }
): Promise<BackupStatusItem> {
  try {
    // 쿼리 스트링 생성 (변경된 것만 포함)
    const params = new URLSearchParams();
    
    if (changes.cam !== undefined) {
      params.append('cam', String(changes.cam));
      params.append('cam_checker', String(currentUserId));
    }
    if (changes.master !== undefined) {
      params.append('master', String(changes.master));
      params.append('master_checker', String(currentUserId));
    }
    if (changes.clean !== undefined) {
      params.append('clean', String(changes.clean));
      params.append('clean_checker', String(currentUserId));
    }
    if (changes.final_product !== undefined) {
      params.append('final_product', String(changes.final_product));
      params.append('final_product_checker', String(currentUserId));
    }

    const response = await patch<BackupStatusItem>(
      `${API_ENDPOINTS.BACKUP_STATUS}/${backupId}/mark-complete?${params.toString()}`,
      {}
    );
    return response;
  } catch (error) {
    console.error('Failed to mark backup complete:', error);
    throw error;
  }
}

