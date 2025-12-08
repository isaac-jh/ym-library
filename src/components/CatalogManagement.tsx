import React, { useEffect, useState } from 'react';
import {
  fetchAllStorageCatalogs,
  createStorageCatalog,
  updateStorageCatalog,
  deleteStorageCatalog,
} from '../api';
import type { ActivityItem, CategoryType } from '../types';
import './CatalogManagement.css';

const CATEGORIES: CategoryType[] = ['ACTIVITY', 'MUSIC', 'ETC'];

/**
 * 카탈로그 관리 컴포넌트
 */
function CatalogManagement() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // 편집 중인 데이터
  const [editData, setEditData] = useState<Partial<ActivityItem>>({});
  // 새로 생성할 데이터
  const [newData, setNewData] = useState<Omit<ActivityItem, 'id'>>({
    storage: '',
    category: 'ACTIVITY',
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    activity_name: '',
    description: '',
  });

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchAllStorageCatalogs();
      setItems(data);
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /**
   * 수정 시작
   */
  const startEdit = (item: ActivityItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
  };

  /**
   * 수정 완료
   */
  const completeEdit = async () => {
    if (!editingId) return;

    try {
      await updateStorageCatalog(editingId, editData);
      await loadData();
      setEditingId(null);
      setEditData({});
    } catch (err) {
      alert('수정에 실패했습니다.');
      console.error(err);
    }
  };

  /**
   * 수정 취소
   */
  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  /**
   * 삭제
   */
  const handleDelete = async (id: number) => {
    try {
      await deleteStorageCatalog(id);
      await loadData();
      setDeleteConfirmId(null);
    } catch (err) {
      alert('삭제에 실패했습니다.');
      console.error(err);
    }
  };

  /**
   * 생성 시작
   */
  const startCreate = () => {
    setIsCreating(true);
    setNewData({
      storage: '',
      category: 'ACTIVITY',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      activity_name: '',
      description: '',
    });
  };

  /**
   * 생성 완료
   */
  const completeCreate = async () => {
    try {
      await createStorageCatalog(newData);
      await loadData();
      setIsCreating(false);
    } catch (err) {
      alert('생성에 실패했습니다.');
      console.error(err);
    }
  };

  /**
   * 생성 취소
   */
  const cancelCreate = () => {
    setIsCreating(false);
  };

  return (
    <div className="catalog-management">
      {/* 헤더 버튼 */}
      <div className="management-header">
        <button className="btn-add" onClick={startCreate} disabled={isCreating}>
          + 새 항목 추가
        </button>
      </div>

      {isLoading && <div className="loading">로딩 중...</div>}
      {error && <div className="error">{error}</div>}

      {/* 테이블 */}
      <div className="table-wrapper">
        <table className="management-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>보관소</th>
              <th>카테고리</th>
              <th>연도</th>
              <th>월</th>
              <th>활동명</th>
              <th>설명</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            {/* 새 항목 생성 행 */}
            {isCreating && (
              <tr className="edit-row">
                <td>NEW</td>
                <td>
                  <input
                    type="text"
                    value={newData.storage}
                    onChange={(e) => setNewData({ ...newData, storage: e.target.value })}
                    className="input-field"
                  />
                </td>
                <td>
                  <select
                    value={newData.category}
                    onChange={(e) => setNewData({ ...newData, category: e.target.value as CategoryType })}
                    className="input-field"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    type="number"
                    value={newData.year}
                    onChange={(e) => setNewData({ ...newData, year: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={newData.month}
                    onChange={(e) => setNewData({ ...newData, month: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                    max="12"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newData.activity_name}
                    onChange={(e) => setNewData({ ...newData, activity_name: e.target.value })}
                    className="input-field"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newData.description || ''}
                    onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                    className="input-field"
                  />
                </td>
                <td>
                  <div className="btn-group">
                    <button className="btn-complete" onClick={completeCreate}>
                      완료
                    </button>
                    <button className="btn-cancel" onClick={cancelCreate}>
                      취소
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* 데이터 행 */}
            {items.map((item) => (
              <tr key={item.id} className={editingId === item.id ? 'edit-row' : ''}>
                <td>{item.id}</td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editData.storage || ''}
                      onChange={(e) => setEditData({ ...editData, storage: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    item.storage
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <select
                      value={editData.category || 'ACTIVITY'}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value as CategoryType })}
                      className="input-field"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  ) : (
                    item.category
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editData.year || ''}
                      onChange={(e) => setEditData({ ...editData, year: parseInt(e.target.value) })}
                      className="input-field"
                    />
                  ) : (
                    item.year
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="number"
                      value={editData.month || ''}
                      onChange={(e) => setEditData({ ...editData, month: parseInt(e.target.value) })}
                      className="input-field"
                      min="1"
                      max="12"
                    />
                  ) : (
                    item.month
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editData.activity_name || ''}
                      onChange={(e) => setEditData({ ...editData, activity_name: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    item.activity_name
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <input
                      type="text"
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="input-field"
                    />
                  ) : (
                    item.description || '-'
                  )}
                </td>
                <td>
                  {editingId === item.id ? (
                    <div className="btn-group">
                      <button className="btn-complete" onClick={completeEdit}>
                        완료
                      </button>
                      <button className="btn-cancel" onClick={cancelEdit}>
                        취소
                      </button>
                    </div>
                  ) : (
                    <div className="btn-group">
                      <button
                        className="btn-icon btn-edit"
                        onClick={() => startEdit(item)}
                        title="수정"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="btn-icon btn-delete"
                        onClick={() => setDeleteConfirmId(item.id)}
                        title="삭제"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 삭제 확인 모달 */}
      {deleteConfirmId && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>삭제 확인</h3>
            <p>정말 삭제하시겠습니까?</p>
            <div className="modal-buttons">
              <button
                className="btn-confirm"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                삭제
              </button>
              <button className="btn-cancel" onClick={() => setDeleteConfirmId(null)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CatalogManagement;

