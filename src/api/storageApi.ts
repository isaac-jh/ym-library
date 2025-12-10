/**
 * Storage Catalogs API 관련 함수
 * 자료실 데이터를 조회하는 API 호출을 담당합니다.
 */

import { get, post, put, apiClient } from './client';
import { API_ENDPOINTS } from './config';
import type { ActivityItem } from '../types';

/**
 * 전체 자료 목록을 조회합니다.
 * @param limit - 조회할 최대 개수 (기본값: 10000)
 * @returns Promise<ActivityItem[]> - 자료 목록
 */
export async function fetchAllStorageCatalogs(
  limit: number = 10000
): Promise<ActivityItem[]> {
  try {
    const response = await get<ActivityItem[]>(
      API_ENDPOINTS.STORAGE_CATALOGS,
      { limit }
    );

    // 응답 데이터 검증 및 파싱
    if (response) {
      return response;
    }

    // items가 없거나 배열이 아닌 경우 빈 배열 반환
    console.warn('Invalid response format:', response);
    return [];
  } catch (error) {
    console.error('Failed to fetch storage catalogs:', error);
    throw error;
  }
}

/**
 * 새로운 자료를 생성합니다.
 * @param data - 생성할 자료 데이터
 * @returns Promise<ActivityItem> - 생성된 자료
 */
export async function createStorageCatalog(
  data: Omit<ActivityItem, 'id'>
): Promise<ActivityItem> {
  try {
    const response = await post<ActivityItem>(
      API_ENDPOINTS.STORAGE_CATALOGS,
      data
    );
    return response;
  } catch (error) {
    console.error('Failed to create storage catalog:', error);
    throw error;
  }
}

/**
 * 자료를 수정합니다.
 * @param id - 자료 ID
 * @param data - 수정할 데이터
 * @returns Promise<ActivityItem> - 수정된 자료
 */
export async function updateStorageCatalog(
  id: number,
  data: Partial<ActivityItem>
): Promise<ActivityItem> {
  try {
    const response = await put<ActivityItem>(
      `${API_ENDPOINTS.STORAGE_CATALOGS}/${id}`,
      data
    );
    return response;
  } catch (error) {
    console.error('Failed to update storage catalog:', error);
    throw error;
  }
}

/**
 * 자료를 삭제합니다.
 * @param id - 자료 ID
 * @returns Promise<void>
 */
export async function deleteStorageCatalog(id: number): Promise<void> {
  try {
    await apiClient(`${API_ENDPOINTS.STORAGE_CATALOGS}/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete storage catalog:', error);
    throw error;
  }
}

/**
 * 특정 검색어로 자료를 검색합니다.
 * TODO: 백엔드 API가 검색 기능을 제공하는 경우 구현
 * @param _query - 검색어 (현재 미사용)
 * @returns Promise<ActivityItem[]>
 */
export async function searchStorageCatalogs(
  _query: string
): Promise<ActivityItem[]> {
  // TODO: 백엔드에서 검색 API를 제공하면 구현
  // 현재는 클라이언트 사이드 필터링을 사용
  throw new Error('Not implemented: 백엔드 검색 API 미지원');
}

