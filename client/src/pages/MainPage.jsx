import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MainPage() {
  const [name, setName] = useState('');
  const [skipRanking, setSkipRanking] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRanking();
  }, [page, search]);

  const fetchRanking = async () => {
    const params = new URLSearchParams({ page, search });
    const res = await fetch(`/api/ranking?${params}`);
    const data = await res.json();
    setRanking(data.ranking);
    setTotalPages(data.totalPages);
  };

  const handleTranslate = async () => {
    if (!name.trim()) return;

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), skipRanking }),
    });
    const data = await res.json();
    navigate('/result', { state: data });
  };

  return (
    <div className="main-page">
      <h1>찐막 속마음 번역기</h1>

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

      <hr />

      <div className="ranking-section">
        <h2>찐막 랭킹</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="이름 검색"
        />
        <ol start={(page - 1) * 10 + 1}>
          {ranking.map((player, i) => (
            <li key={i}>
              {player.name} - {player.play_count}판 째 게임중!
            </li>
          ))}
        </ol>
        {ranking.length === 0 && <p>아직 기록이 없습니다.</p>}
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={page === i + 1 ? 'active' : ''}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MainPage;
