import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingList } from '../components/RankingList';

export default function MainPage() {
  const navigate = useNavigate();
  const [friendName, setFriendName] = useState('');
  const [dontRecord, setDontRecord] = useState(false);
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    fetchRanking();
  }, []);

  const fetchRanking = async () => {
    const res = await fetch('/api/ranking');
    const data = await res.json();
    setRankings(data.ranking);
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
