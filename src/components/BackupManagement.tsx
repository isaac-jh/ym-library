import { useEffect, useState } from 'react';
import {
  fetchBackupStatus,
  createBackupStatus,
  updateBackupStatus,
  deleteBackupStatus,
  markBackupComplete,
  fetchUsers,
} from '../api';
import type { BackupStatusItem, User } from '../types';
import './BackupManagement.css';

type BackupField = 'cam' | 'master' | 'clean' | 'final_product';

interface BackupManagementProps {
  currentUser: User;
}

/**
 * 백업 현황 관리 컴포넌트
 */
function BackupManagement({ currentUser }: BackupManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<BackupStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // 체크박스 변경 추적
  const [changedStates, setChangedStates] = useState<Map<number, Partial<Record<BackupField, boolean>>>>(new Map());

  // 편집 중인 데이터
  const [editData, setEditData] = useState<Partial<BackupStatusItem>>({});
  
  // 새로 생성할 데이터
  const [newData, setNewData] = useState<any>({
    event_name: '',
    displayed_date: new Date().toISOString().split('T')[0],
    name: '',
    description: '',
    cam: false,
    master: false,
    clean: false,
    final_product: false,
    user_ids: [] as number[],
    // 백업 진행 여부
    shouldBackupCam: true,
    shouldBackupMaster: true,
    shouldBackupClean: true,
    shouldBackupFinalProduct: true,
  });
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await fetchBackupStatus();
      setItems(data);
      setChangedStates(new Map());
    } catch (err) {
      setError('데이터를 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadUsers();
  }, []);

  /**
   * 유저 목록 로드
   */
  const loadUsers = async () => {
    try {
      const userData = await fetchUsers();
      setUsers(userData);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  /**
   * 체크박스 변경
   */
  const handleCheckboxChange = (itemId: number, field: BackupField, currentValue: boolean | null) => {
    if (currentValue === null) return; // null이면 변경 불가

    const newValue = !currentValue;
    const itemChanges = changedStates.get(itemId) || {};
    
    // 원래 값과 비교
    const originalItem = items.find((i) => i.id === itemId);
    if (originalItem && originalItem[field] !== newValue) {
      itemChanges[field] = newValue;
    } else {
      delete itemChanges[field];
    }

    const newMap = new Map(changedStates);
    if (Object.keys(itemChanges).length > 0) {
      newMap.set(itemId, itemChanges);
    } else {
      newMap.delete(itemId);
    }

    setChangedStates(newMap);
  };

  /**
   * 백업 상태 변경 완료
   */
  const handleMarkComplete = async (itemId: number) => {
    const changes = changedStates.get(itemId);
    if (!changes) return;

    try {
      // 변경된 필드만 전달
      await markBackupComplete(itemId, currentUser.id, changes);
      await loadData();
    } catch (err) {
      alert('백업 상태 변경에 실패했습니다.');
      console.error(err);
    }
  };

  /**
   * 수정 시작
   */
  const startEdit = (item: BackupStatusItem) => {
    setEditingId(item.id);
    setEditData({ ...item });
    // producers는 user_ids로 저장되어 있음 (API 응답에서)
    setSelectedUserIds([]);
  };

  /**
   * 수정 완료
   */
  const completeEdit = async () => {
    if (!editingId) return;

    try {
      const dataToUpdate: any = {
        event_name: editData.event_name || null,
        displayed_date: editData.displayed_date || null,
        name: editData.name,
        description: editData.description || null,
        user_ids: selectedUserIds.length > 0 ? selectedUserIds : undefined,
      };
      
      await updateBackupStatus(editingId, dataToUpdate, currentUser.id);
      await loadData();
      setEditingId(null);
      setEditData({});
      setSelectedUserIds([]);
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
    setSelectedUserIds([]);
  };

  /**
   * 삭제
   */
  const handleDelete = async (id: number) => {
    try {
      await deleteBackupStatus(id, currentUser.id);
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
      event_name: '',
      displayed_date: new Date().toISOString().split('T')[0],
      name: '',
      description: '',
      cam: false,
      master: false,
      clean: false,
      final_product: false,
      user_ids: [],
      shouldBackupCam: true,
      shouldBackupMaster: true,
      shouldBackupClean: true,
      shouldBackupFinalProduct: true,
    });
    setSelectedUserIds([]);
  };

  /**
   * 생성 완료
   */
  const completeCreate = async () => {
    try {
      const dataToCreate = {
        event_name: newData.event_name || null,
        displayed_date: newData.displayed_date ? new Date(newData.displayed_date).toISOString() : null,
        name: newData.name,
        description: newData.description || null,
        cam: newData.shouldBackupCam ? false : null,
        cam_checker: null,
        master: newData.shouldBackupMaster ? false : null,
        master_checker: null,
        clean: newData.shouldBackupClean ? false : null,
        clean_checker: null,
        final_product: newData.shouldBackupFinalProduct ? false : null,
        final_product_checker: null,
        user_ids: selectedUserIds,
      };
      
      await createBackupStatus(dataToCreate, currentUser.id);
      await loadData();
      setIsCreating(false);
      setSelectedUserIds([]);
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
    setSelectedUserIds([]);
  };

  /**
   * 날짜 포맷 (YYYY-MM-DD)
   */
  const formatDateForInput = (dateString: string | null): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return (
    <div className="backup-management">
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
        <table className="management-table backup-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>이벤트명</th>
              <th>표시날짜</th>
              <th>이름</th>
              <th>설명</th>
              <th>CAM</th>
              <th>Master</th>
              <th>Clean</th>
              <th>Final</th>
              <th>제작자</th>
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
                    value={newData.event_name}
                    onChange={(e) => setNewData({ ...newData, event_name: e.target.value })}
                    className="input-field"
                    placeholder="선택사항"
                  />
                </td>
                <td>
                  <input
                    type="date"
                    value={newData.displayed_date}
                    onChange={(e) => setNewData({ ...newData, displayed_date: e.target.value })}
                    className="input-field"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newData.name}
                    onChange={(e) => setNewData({ ...newData, name: e.target.value })}
                    className="input-field"
                    placeholder="필수"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={newData.description}
                    onChange={(e) => setNewData({ ...newData, description: e.target.value })}
                    className="input-field"
                    placeholder="선택사항"
                  />
                </td>
                <td>
                  <label className="backup-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newData.shouldBackupCam}
                      onChange={(e) => setNewData({ ...newData, shouldBackupCam: e.target.checked })}
                    />
                    <span>{newData.shouldBackupCam ? '진행' : '안함'}</span>
                  </label>
                </td>
                <td>
                  <label className="backup-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newData.shouldBackupMaster}
                      onChange={(e) => setNewData({ ...newData, shouldBackupMaster: e.target.checked })}
                    />
                    <span>{newData.shouldBackupMaster ? '진행' : '안함'}</span>
                  </label>
                </td>
                <td>
                  <label className="backup-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newData.shouldBackupClean}
                      onChange={(e) => setNewData({ ...newData, shouldBackupClean: e.target.checked })}
                    />
                    <span>{newData.shouldBackupClean ? '진행' : '안함'}</span>
                  </label>
                </td>
                <td>
                  <label className="backup-checkbox-label">
                    <input
                      type="checkbox"
                      checked={newData.shouldBackupFinalProduct}
                      onChange={(e) => setNewData({ ...newData, shouldBackupFinalProduct: e.target.checked })}
                    />
                    <span>{newData.shouldBackupFinalProduct ? '진행' : '안함'}</span>
                  </label>
                </td>
                <td>
                  <select
                    multiple
                    value={selectedUserIds.map(String)}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map((opt) => parseInt(opt.value));
                      setSelectedUserIds(selected);
                    }}
                    className="input-field user-select"
                    size={3}
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.nickname})
                      </option>
                    ))}
                  </select>
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
            {items.map((item) => {
              const hasChanges = changedStates.has(item.id);
              const isEditing = editingId === item.id;
              
              return (
                <tr key={item.id} className={isEditing ? 'edit-row' : ''}>
                  <td>{item.id}</td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.event_name || ''}
                        onChange={(e) => setEditData({ ...editData, event_name: e.target.value })}
                        className="input-field"
                      />
                    ) : (
                      item.event_name || '-'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        value={formatDateForInput(editData.displayed_date || null)}
                        onChange={(e) => setEditData({ ...editData, displayed_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="input-field"
                      />
                    ) : (
                      item.displayed_date ? formatDateForInput(item.displayed_date) : '-'
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="input-field"
                      />
                    ) : (
                      item.name
                    )}
                  </td>
                  <td>
                    {isEditing ? (
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
                    {item.cam === null ? (
                      <span className="backup-na">N/A</span>
                    ) : (
                      <label className="backup-checkbox">
                        <input
                          type="checkbox"
                          checked={changedStates.get(item.id)?.cam ?? item.cam}
                          onChange={() => handleCheckboxChange(item.id, 'cam', item.cam)}
                          disabled={isEditing}
                        />
                      </label>
                    )}
                  </td>
                  <td>
                    {item.master === null ? (
                      <span className="backup-na">N/A</span>
                    ) : (
                      <label className="backup-checkbox">
                        <input
                          type="checkbox"
                          checked={changedStates.get(item.id)?.master ?? item.master}
                          onChange={() => handleCheckboxChange(item.id, 'master', item.master)}
                          disabled={isEditing}
                        />
                      </label>
                    )}
                  </td>
                  <td>
                    {item.clean === null ? (
                      <span className="backup-na">N/A</span>
                    ) : (
                      <label className="backup-checkbox">
                        <input
                          type="checkbox"
                          checked={changedStates.get(item.id)?.clean ?? item.clean}
                          onChange={() => handleCheckboxChange(item.id, 'clean', item.clean)}
                          disabled={isEditing}
                        />
                      </label>
                    )}
                  </td>
                  <td>
                    {item.final_product === null ? (
                      <span className="backup-na">N/A</span>
                    ) : (
                      <label className="backup-checkbox">
                        <input
                          type="checkbox"
                          checked={changedStates.get(item.id)?.final_product ?? item.final_product}
                          onChange={() => handleCheckboxChange(item.id, 'final_product', item.final_product)}
                          disabled={isEditing}
                        />
                      </label>
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        multiple
                        value={selectedUserIds.map(String)}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions).map((opt) => parseInt(opt.value));
                          setSelectedUserIds(selected);
                        }}
                        className="input-field user-select"
                        size={3}
                      >
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name} ({user.nickname})
                          </option>
                        ))}
                      </select>
                    ) : (
                      item.producers.length > 0 ? item.producers.join(', ') : '-'
                    )}
                  </td>
                  <td>
                    {hasChanges ? (
                      <button
                        className="btn-mark-complete"
                        onClick={() => handleMarkComplete(item.id)}
                      >
                        백업 상태 변경
                      </button>
                    ) : isEditing ? (
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
              );
            })}
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

export default BackupManagement;

