import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingList } from '../components/RankingList';

export default function MainPage() {
  const navigate = useNavigate();
  const [friendName, setFriendName] = useState('');
  const [dontRecord, setDontRecord] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    const res = await fetch('/api/ranking');
    const data = await res.json();
    setRankings(data.ranking);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    const res = await fetch(`/api/search?name=${encodeURIComponent(searchQuery.trim())}`);
    const data = await res.json();
    setSearchResult(data.result);
    setSearched(true);
  };

  const handleTranslate = async () => {
    if (!friendName.trim()) {
      alert('친구 이름을 입력해주세요!');
      return;
    }

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: friendName.trim(), skipRanking: dontRecord }),
    });
    const data = await res.json();
    navigate('/result', { state: { ...data, skipRanking: dontRecord } });
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6" style={{ fontFamily: "'Gaegu', cursive" }}>
      <h1 className="text-6xl font-bold mb-12">니,,, 공부할끼가?</h1>

      <RankingList
        rankings={rankings}
        friendName={friendName}
        setFriendName={setFriendName}
        dontRecord={dontRecord}
        setDontRecord={setDontRecord}
      />

      {/* 검색 */}
      <div className="w-full max-w-md mt-6 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearched(false); }}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="🔍 친구 이름 검색"
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-lg focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-gray-700 rounded text-lg font-bold hover:bg-gray-600 transition-all"
          >
            검색
          </button>
        </div>
        {searched && (
          <div className="mt-3 p-3 bg-gray-900 rounded text-lg">
            {searchResult ? (
              <p>{searchResult.name} — {searchResult.rank}위 · {searchResult.play_count}판 째 게임중!</p>
            ) : (
              <p className="text-gray-500">검색 결과가 없습니다.</p>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleTranslate}
        className="mt-8 px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
      >
        속마음 번역하기
      </button>

      <div className="fixed top-10 left-10 text-4xl opacity-50">✨</div>
      <div className="fixed top-20 left-32 text-3xl opacity-30">✨</div>
      <div className="fixed top-10 right-10 text-4xl opacity-50">✨</div>
      <div className="fixed top-20 right-32 text-3xl opacity-30">✨</div>
    </div>
  );
}
