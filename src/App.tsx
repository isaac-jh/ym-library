import React, { useEffect, useState } from 'react';
import './App.css';

type ActivityItem = {
  id: number;
  storage: string;
  category: string;
  year: number;
  month: number;
  activity_name: string;
  description: string | null;
};

/**
 * 영미 자료실 메인 애플리케이션 컴포넌트
 * 검색어를 입력받아 API를 호출하고 결과를 표시합니다.
 */
function App() {
  // 검색어 상태 관리
  const [searchQuery, setSearchQuery] = useState<string>('');
  // 전체 데이터 목록
  const [allEntries, setAllEntries] = useState<ActivityItem[]>([]);
  // 검색 결과
  const [filteredEntries, setFilteredEntries] = useState<ActivityItem[]>([]);
  // 자동완성 목록
  const [suggestions, setSuggestions] = useState<ActivityItem[]>([]);
  // 검색 수행 여부
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 에러 상태 관리
  const [error, setError] = useState<string>('');

  /**
   * 페이지 로드시 전체 데이터를 조회합니다.
   */
  useEffect(() => {
    const fetchAllEntries = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('https://oiqrfvgxrhjsy33aq65algtv5m0uwrog.lambda-url.ap-northeast-2.on.aws/');

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const parsedEntries: ActivityItem[] = Array.isArray(data?.items) ? data.items : [];

        setAllEntries(parsedEntries);
        setFilteredEntries([]);
      } catch (err) {
        setError('데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEntries();
  }, []);

  /**
   * 입력값으로 LIKE 필터링을 수행합니다.
   */
  const filterEntries = (query: string) => {
    const trimmedQuery = query.trim().toLowerCase();

    if (!trimmedQuery) {
      setFilteredEntries(allEntries);
      return;
    }

    const filtered = allEntries.filter((entry) =>
      entry.activity_name.toLowerCase().includes(trimmedQuery)
    );

    setFilteredEntries(filtered);
  };

  /**
   * 입력값 변경 시 즉시 필터링합니다.
   */
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    const trimmedValue = value.trim().toLowerCase();

    if (!trimmedValue) {
      setSuggestions([]);
      return;
    }

    const matched = allEntries.filter((entry) =>
      entry.activity_name.toLowerCase().includes(trimmedValue)
    );

    const uniqueByName = matched.filter(
      (item, index, self) =>
        self.findIndex((candidate) => candidate.activity_name === item.activity_name) === index
    );

    setSuggestions(uniqueByName);
  };

  /**
   * 검색 버튼 클릭 시 필터링을 수행합니다.
   * 검색어가 없으면 전체 데이터를 다시 표시합니다.
   */
  const handleSearch = async () => {
    setError('');
    setSuggestions([]);
    setHasSearched(true);
    filterEntries(searchQuery);
  };

  /**
   * 엔터키 입력 시 검색을 수행합니다.
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="app">
      <div className="container">
        <h1 className="title">영미 자료실</h1>
        
        {/* 검색 입력 영역 */}
        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="검색할 자료는?"
            value={searchQuery}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button 
            className="search-button"
            onClick={handleSearch}
            disabled={isLoading}
            aria-label="검색"
          >
            {/* 돋보기 아이콘 */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
          </button>
        </div>

        {/* 자동완성 */}
        {suggestions.length > 0 && (
          <div className="autocomplete">
            <ul>
              {suggestions.map((item) => (
                <li
                  key={item.id}
                  className="autocomplete-item"
                  title={item.activity_name}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setSearchQuery(item.activity_name);
                    setSuggestions([]);
                  }}
                >
                  {item.activity_name}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="loading">검색 중...</div>
        )}

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="error">{error}</div>
        )}

        {/* 검색 결과 표시 */}
        {!isLoading && hasSearched && filteredEntries.length > 0 && (
          <div className="result">
            <div className="card-list">
              {filteredEntries.map((entry) => (
                <div key={entry.id} className="result-card">
                  <div className="tag">{entry.storage}</div>
                  <div className="tag">{entry.year}</div>
                  <div className="tag">{entry.month}</div>
                  <div className="tag activity">{entry.activity_name}</div>
                  <div className="card-description">
                    {entry.description ?? '설명 없음'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 검색 결과 없음 */}
        {!isLoading && hasSearched && filteredEntries.length === 0 && (
          <div className="result empty">일치하는 자료가 없습니다.</div>
        )}
      </div>
    </div>
  );
}

export default App;

