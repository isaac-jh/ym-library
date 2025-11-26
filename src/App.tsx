import React, { useState } from 'react';
import './App.css';

/**
 * 영미 자료실 메인 애플리케이션 컴포넌트
 * 검색어를 입력받아 API를 호출하고 결과를 표시합니다.
 */
function App() {
  // 검색어 상태 관리
  const [searchQuery, setSearchQuery] = useState<string>('');
  // API 응답 결과 상태 관리
  const [result, setResult] = useState<string>('');
  // 로딩 상태 관리
  const [isLoading, setIsLoading] = useState<boolean>(false);
  // 에러 상태 관리
  const [error, setError] = useState<string>('');

  /**
   * 검색 버튼 클릭 시 API 호출을 수행합니다.
   * 입력값을 쿼리스트링으로 전달하여 결과를 가져옵니다.
   */
  const handleSearch = async () => {
    // 빈 검색어 검증
    if (!searchQuery.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      // API URL 구성 (쿼리스트링에 search 파라미터 추가)
      const apiUrl = `https://oiqrfvgxrhjsy33aq65algtv5m0uwrog.lambda-url.ap-northeast-2.on.aws/?search=${encodeURIComponent(searchQuery)}`;
      
      // API 호출
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 응답을 문자열로 받아서 상태에 저장
      const data = await response.text();
      setResult(data);
    } catch (err) {
      // 에러 처리
      setError('검색 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false);
    }
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
            onChange={(e) => setSearchQuery(e.target.value)}
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

        {/* 로딩 표시 */}
        {isLoading && (
          <div className="loading">검색 중...</div>
        )}

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="error">{error}</div>
        )}

        {/* 검색 결과 표시 */}
        {result && !isLoading && (
          <div className="result">
            <pre>{result}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

