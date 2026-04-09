import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const [name, setName] = useState('');
  const [skipRanking, setSkipRanking] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    const res = await fetch('/api/ranking');
    const data = await res.json();
    setRanking(data.ranking);
  };

  const handleSearch = async () => {
    if (!search.trim()) return;
    const res = await fetch(`/api/search?name=${encodeURIComponent(search.trim())}`);
    const data = await res.json();
    setSearchResult(data.result);
    setSearched(true);
  };

  const handleTranslate = async () => {
    if (!name.trim()) return;

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), skipRanking }),
    });
    const data = await res.json();
    navigate('/result', { state: { ...data, skipRanking } });
  };

  // 올림픽 시상대 순서: 2등(왼쪽) - 1등(가운데) - 3등(오른쪽)
  const podiumOrder = [ranking[1], ranking[0], ranking[2]];

  return (
    <div className="main-page">
      <h1>찐막 속마음 번역기</h1>

      <div className="ranking-section">
        <div className="podium">
          {podiumOrder.map((player, i) => {
            if (!player) return <div key={i} className="podium-slot empty" />;
            const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
            return (
              <div key={i} className={`podium-slot rank-${rank}`}>
                <span className="podium-name">{player.name}</span>
                <div className={`podium-bar bar-${rank}`}>
                  <span className="podium-rank">{rank}</span>
                </div>
                <span className="podium-count">{player.play_count}판</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSearched(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="이름으로 검색"
          />
          <button onClick={handleSearch}>검색</button>
        </div>
        {searched && (
          <div className="search-result">
            {searchResult ? (
              <p>{searchResult.name} — {searchResult.rank}위 · {searchResult.play_count}판 째 게임중!</p>
            ) : (
              <p>검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      <div className="input-section">
        <h2>친구 이름은...</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          onKeyDown={(e) => e.key === 'Enter' && handleTranslate()}
        />
        <label>
          <input
            type="checkbox"
            checked={skipRanking}
            onChange={(e) => setSkipRanking(e.target.checked)}
          />
          랭크에 기록 안 할래요.
        </label>
        <button className="translate-btn" onClick={handleTranslate}>
          속마음 번역하기
        </button>
      </div>
    </div>
  );
}

export default MainPage;
