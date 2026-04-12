import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RankingList, RankingNotice } from '../components/RankingList';

const FONT = "Inter, 'Noto Sans KR', sans-serif";

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
    try {
      const res = await fetch('/api/ranking');
      const data = await res.json();
      setRankings(data.ranking);
    } catch {
      console.error('랭킹 조회 실패');
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResult(null);
      setSearched(false);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?name=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        setSearchResult(data.result);
        setSearched(true);
      } catch {
        console.error('검색 실패');
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleTranslate = async () => {
    if (!friendName.trim()) {
      alert('친구 이름을 입력해주세요!');
      return;
    }

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: friendName.trim(), skipRanking: dontRecord }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '오류가 발생했습니다.');
        return;
      }
      navigate('/result', { state: { ...data, playCount: 1, skipRanking: dontRecord } });
    } catch {
      alert('네트워크 오류가 발생했습니다.');
    }
  };

  return (
    <div className="marble-bg min-h-screen flex items-center justify-center p-6" style={{ fontFamily: FONT }}>
      {/* 메인 카드 — Figma: 885×389, rounded-30, bg-black */}
      <div className="bg-black rounded-[20px] md:rounded-[30px] flex flex-col md:flex-row w-full max-w-[1200px] md:h-[540px] relative md:overflow-hidden">

        {/* ===== 왼쪽: 입력 영역 ===== */}
        {/* Figma 좌표: 왼쪽 패딩 97px, 상단 패딩 ~40px */}
        <div className="flex-1 px-6 py-8 md:pl-[120px] md:pr-[50px] md:py-[50px] flex flex-col justify-center items-center md:items-start">

          {/* 타이틀 */}
          <h1
            className="text-white text-[28px] md:text-[56px] leading-tight mb-6 md:mb-[50px] text-center md:text-left"
            style={{ fontFamily: "NeoDungGeunMo, monospace" }}
          >
            니,,, 공부할끼가?
          </h1>

          {/* 이름 입력 */}
          <input
            type="text"
            value={friendName}
            onChange={(e) => { const v = e.target.value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''); if (v.length <= 5) setFriendName(v); }}
            onKeyDown={(e) => e.key === 'Enter' && !e.repeat && handleTranslate()}
            maxLength={5}
            placeholder="친구 이름이 뭐고?"
            className="w-full max-w-[320px] h-[48px] md:h-[56px] bg-[rgba(255,255,255,0.23)] border border-[#bfd1ff] rounded-[5px] px-[19px] text-white text-[18px] md:text-[22px] placeholder-[rgba(255,255,255,0.33)] focus:outline-none focus:border-[#9cb5ff]"
          />

          {/* 체크박스 */}
          <label className="flex items-center gap-[8px] cursor-pointer mt-[14px] mb-6 md:mb-[50px]">
            <span
              className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${dontRecord ? 'bg-[rgba(255,255,255,0.92)]' : 'bg-[rgba(255,255,255,0.3)]'}`}
            />
            <input
              type="checkbox"
              checked={dontRecord}
              onChange={(e) => setDontRecord(e.target.checked)}
              className="hidden"
            />
            <span className="text-[14px] text-[rgba(255,255,255,0.33)]">
              랭크에 기록 안 할란다
            </span>
          </label>

          {/* CTA 버튼 */}
          <button
            onClick={handleTranslate}
            onKeyDown={(e) => e.repeat && e.preventDefault()}
            className="w-full max-w-[480px] h-[48px] md:h-[56px] bg-[#9cb5ff] hover:bg-[#b0c5ff] rounded-[100px] text-white text-[18px] md:text-[22px] transition-all hover:scale-[1.02]"
            style={{ fontFamily: "NeoDungGeunMo, monospace" }}
          >
            고민 해결해뿌자
          </button>

        </div>

        {/* ===== 구분선 (데스크탑: 세로 / 모바일: 짧은 수평선) ===== */}
        <div className="hidden md:block w-px bg-[rgba(255,255,255,0.1)] absolute left-[62%] top-[32px] bottom-[32px]" />
        <div className="md:hidden flex justify-center py-2">
          <div className="w-[30%] h-px bg-[rgba(255,255,255,0.15)]" />
        </div>

        {/* ===== 오른쪽: 랭킹 영역 (38%) ===== */}
        <div className="w-full md:w-[38%] shrink-0 py-8 md:py-[50px] flex flex-col items-center overflow-y-auto hide-scrollbar">

          {/* 검색바 — 상단 중앙 */}
          <div className="relative mb-[16px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { const v = e.target.value.replace(/[^ㄱ-ㅎㅏ-ㅣ가-힣]/g, ''); if (v.length <= 5) setSearchQuery(v); }}
              placeholder="임마 어딨노?"
              className="w-[260px] h-[44px] md:h-[50px] bg-[rgba(255,255,255,0.23)] border border-[#fcbfff] rounded-[5px] px-[19px] pr-[44px] text-white text-[18px] md:text-[20px] placeholder-[rgba(255,255,255,0.33)] focus:outline-none focus:border-[#ff9cee]"
            />
            <svg
              className="absolute right-[14px] top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[rgba(255,255,255,0.33)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* 검색 결과 */}
          {searched && (
            <div className="mb-[12px] p-[10px] bg-[rgba(255,255,255,0.08)] rounded-[5px] text-center">
              {searchResult ? (
                <p className="text-white text-[15px]">
                  {searchResult.name} — {searchResult.rank}위 ·{' '}
                  <span className="text-[#ff9cee]" style={{ textShadow: '4px 0px 10px #e0f' }}>
                    딴짓 {searchResult.play_count}번 째!
                  </span>
                </p>
              ) : (
                <p className="text-[rgba(255,255,255,0.33)] text-[14px]">검색 결과가 없습니다.</p>
              )}
            </div>
          )}

          {/* 랭킹 리스트 — 6위까지, 중앙 정렬 */}
          <div className="mt-[24px] max-h-[300px] overflow-y-auto hide-scrollbar">
            <RankingList rankings={rankings} />
          </div>
          <RankingNotice />
        </div>

        {/* 이스터에그 — 오른쪽 하단 */}
        <p
          className="absolute bottom-[14px] right-[20px] text-[9px] text-[rgba(255,255,255,0.08)]"
          style={{ textShadow: '0px 0px 6px #b2caff' }}
        >
          마, 이게 이스타-에그데이
        </p>
      </div>
    </div>
  );
}
