import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchBackupStatus } from '../api';
import type { BackupStatusItem } from '../types';
import './BackupPage.css';

/**
 * 백업 페이지
 * 백업 상태 현황을 조회하고 표시합니다.
 */
function BackupPage() {
  const navigate = useNavigate();
  // 전체 백업 상태 목록
  const [allBackupItems, setAllBackupItems] = useState<BackupStatusItem[]>([]);
  // 검색어
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 선택된 연도 탭
  const [selectedYear, setSelectedYear] = useState<string>('all');
  // 로딩 상태
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 에러 상태
  const [error, setError] = useState<string>('');

  /**
   * 페이지 로드시 백업 상태를 조회합니다.
   */
  useEffect(() => {
    const loadBackupStatus = async () => {
      setIsLoading(true);
      setError('');

      try {
        const items = await fetchBackupStatus();
        setAllBackupItems(items);
      } catch (err) {
        setError('백업 상태를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        console.error('Failed to load backup status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadBackupStatus();
  }, []);

  /**
   * 연도별 탭 목록 생성
   */
  const yearTabs = useMemo(() => {
    const years = new Set<string>();
    let hasNoDate = false;

    allBackupItems.forEach((item) => {
      if (item.displayed_date) {
        try {
          const year = new Date(item.displayed_date).getFullYear().toString();
          years.add(year);
        } catch {
          hasNoDate = true;
        }
      } else {
        hasNoDate = true;
      }
    });

    const sortedYears = Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
    
    if (hasNoDate) {
      sortedYears.push('no-date');
    }

    return sortedYears;
  }, [allBackupItems]);

  /**
   * 필터링된 백업 목록
   */
  const filteredItems = useMemo(() => {
    let filtered = allBackupItems;

    // 검색어 필터링 (event_name)
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((item) => 
        item.event_name?.toLowerCase().includes(query)
      );
    }

    // 연도 필터링
    if (selectedYear !== 'all') {
      if (selectedYear === 'no-date') {
        filtered = filtered.filter((item) => !item.displayed_date);
      } else {
        filtered = filtered.filter((item) => {
          if (!item.displayed_date) return false;
          try {
            const year = new Date(item.displayed_date).getFullYear().toString();
            return year === selectedYear;
          } catch {
            return false;
          }
        });
      }
    }

    // displayed_date 기준 정렬 (최신순)
    return filtered.sort((a, b) => {
      if (!a.displayed_date && !b.displayed_date) return 0;
      if (!a.displayed_date) return 1;
      if (!b.displayed_date) return -1;
      return new Date(b.displayed_date).getTime() - new Date(a.displayed_date).getTime();
    });
  }, [allBackupItems, searchQuery, selectedYear]);

  /**
   * 날짜 포맷팅 함수 (MM-DD)
   */
  const formatDate = (dateString: string | null): string => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    } catch {
      return '-';
    }
  };

  /**
   * 상태 렌더링 함수
   */
  const renderStatus = (
    status: boolean | null,
    checkerName: string | null
  ) => {
    if (status === null) {
      return <div className="status-empty"></div>;
    }

    if (status === false) {
      return <div className="status-incomplete">미완</div>;
    }

    return (
      <div className="status-complete">
        <div className="status-label">완료</div>
        {checkerName && (
          <div className="status-checker">확인자: {checkerName}</div>
        )}
      </div>
    );
  };

  /**
   * 초기 로드 시 첫 번째 탭 선택
   */
  useEffect(() => {
    if (yearTabs.length > 0 && selectedYear === 'all') {
      setSelectedYear(yearTabs[0]);
    }
  }, [yearTabs]);

  return (
    <div className="backup-page">
      <button className="back-button" onClick={() => navigate('/')} aria-label="뒤로가기">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>
      <div className="container">
        <h1 className="title">백업 현황</h1>

        {/* 검색 영역 */}
        {!isLoading && !error && (
          <div className="search-section">
            <input
              type="text"
              className="search-input"
              placeholder="이벤트명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="loading">데이터 로딩 중...</div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <div className="error">{error}</div>
        )}

        {/* 연도 탭 */}
        {!isLoading && !error && yearTabs.length > 0 && (
          <div className="year-tabs">
            {yearTabs.map((year) => (
              <button
                key={year}
                className={`year-tab ${selectedYear === year ? 'active' : ''}`}
                onClick={() => setSelectedYear(year)}
              >
                {year === 'no-date' ? '날짜 정보 없음' : `${year}년`}
              </button>
            ))}
          </div>
        )}

        {/* 백업 상태 목록 */}
        {!isLoading && !error && filteredItems.length > 0 && (
          <div className="backup-table-wrapper">
            <table className="backup-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>이벤트명</th>
                  <th>이름</th>
                  <th>CAM</th>
                  <th>Master</th>
                  <th>Clean</th>
                  <th>Final</th>
                  <th>제작자</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="backup-row">
                    <td className="date-cell">{formatDate(item.displayed_date)}</td>
                    <td className="event-cell">{item.event_name || '-'}</td>
                    <td className="name-cell">
                      <div className="name-wrapper">
                        <span className="name-text">{item.name}</span>
                        {item.description && (
                          <div className="description-tooltip">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="status-cell">
                      {renderStatus(item.cam, item.cam_checker_name)}
                    </td>
                    <td className="status-cell">
                      {renderStatus(item.master, item.master_checker_name)}
                    </td>
                    <td className="status-cell">
                      {renderStatus(item.clean, item.clean_checker_name)}
                    </td>
                    <td className="status-cell">
                      {renderStatus(item.final_product, item.final_product_checker_name)}
                    </td>
                    <td className="producers-cell">
                      {item.producers && item.producers.length > 0 ? (
                        <div className="producers-tags">
                          {item.producers.map((producer, index) => (
                            <span key={index} className="producer-tag">
                              {producer}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 데이터 없음 */}
        {!isLoading && !error && filteredItems.length === 0 && allBackupItems.length > 0 && (
          <div className="empty-state">검색 결과가 없습니다.</div>
        )}

        {!isLoading && !error && allBackupItems.length === 0 && (
          <div className="empty-state">백업 데이터가 없습니다.</div>
        )}
      </div>
    </div>
  );
}

export default BackupPage;

