import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';

// 한글 대응 Base64 인코딩/디코딩
function toBase64(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binary);
}

function fromBase64(str) {
  const binary = atob(str);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

const NEODGM = { fontFamily: 'NeoDungGeunMo, monospace' };

const SLOT_MESSAGES = [
  '두근두근...', '읽는 중...', '해석 중...', '거의 다 됐어...',
  '음...', '잠깐만...', '뭐라고?', '헉...',
];

export default function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 공유 링크로 접속한 경우 쿼리스트링에서 디코딩
  const shared = (() => {
    const q = searchParams.get('q');
    if (!q) return null;
    try {
      const decoded = fromBase64(q);
      return {
        name: decoded.name,
        phrase: decoded.message,
        playCount: decoded.round,
      };
    } catch {
      return null;
    }
  })();

  const stateData = location.state || shared;
  const { name, phrase, playCount: initialPlayCount, skipRanking, totalPhrases, seenPhrases: prevSeen } = stateData || {};

  // 본 문구 추적 (Set → Array로 navigation state에 전달)
  const seenPhrases = [...new Set([...(prevSeen || []), phrase].filter(Boolean))];
  const seenCount = seenPhrases.length;

  const localCount = useRef(initialPlayCount || 1);
  const [playCount, setPlayCount] = useState(initialPlayCount || 1);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isSlotting, setIsSlotting] = useState(!shared);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!phrase) return;

    if (!isSlotting) {
      setDisplayedMessage(phrase);
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      setDisplayedMessage(SLOT_MESSAGES[count % SLOT_MESSAGES.length]);
      count++;
    }, 150);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsSlotting(false);
      setDisplayedMessage(phrase);
    }, 700);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phrase, isSlotting]);

  if (!stateData) {
    navigate('/');
    return null;
  }

  const handleRetry = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, skipRanking: skipRanking || false }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '오류가 발생했습니다.');
        setIsLoading(false);
        return;
      }

      localCount.current += 1;
      setPlayCount(localCount.current);
      setIsSlotting(true);
      setIsLoading(false);
      navigate('/result', {
        state: { ...data, playCount: localCount.current, skipRanking, seenPhrases },
        replace: true,
      });
    } catch {
      alert('네트워크 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    const payload = toBase64({
      name,
      round: playCount,
      message: phrase,
    });
    const url = `${window.location.origin}/result?q=${encodeURIComponent(payload)}`;
    if (navigator.share) {
      navigator.share({ url });
    } else if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        alert('링크가 복사되었습니다!');
      } catch {
        alert('복사에 실패했습니다. 직접 복사해주세요: ' + url);
      }
    } else {
      alert('이 브라우저에서는 공유 기능을 지원하지 않습니다.');
    }
  };

  return (
    <div className="marble-bg min-h-screen flex items-center justify-center p-3 md:p-6">
      {/* 중앙 카드 */}
      <div className="bg-black rounded-[20px] md:rounded-[30px] w-full max-w-[1200px] md:h-[540px] mx-2 md:mx-4 shadow-2xl relative z-10 flex flex-col items-center justify-center px-4 py-6 md:px-16 md:py-12 overflow-hidden">
        {/* 상단 텍스트 */}
        <div className="text-center mb-4 md:mb-8">
          <p className="text-white text-[16px] md:text-[22px] font-bold" style={NEODGM}>
            '{name}'의 속마음은 ...
          </p>
        </div>

        {/* 메인 번역 텍스트 (슬롯머신 애니메이션 유지) */}
        <div className="text-center mb-6 md:mb-10 px-2 md:px-8">
          <motion.p
            key={displayedMessage}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-2xl md:text-6xl font-black leading-snug"
            style={{
              background: 'linear-gradient(to right, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            "{displayedMessage}"
          </motion.p>
        </div>

        {/* 배지/통계 */}
        <div className="flex flex-col items-center gap-1 md:gap-2 mb-4 md:mb-10">
          <div className="flex items-center justify-center">
            <span className="text-white text-[18px]" style={NEODGM}>
              현재 <span className="font-bold text-[26px] text-pink-500">{playCount}판</span> 째
            </span>
          </div>
          {totalPhrases && (
            <div className="text-gray-400 flex items-center justify-center">
              <span className="text-[13px]" style={NEODGM}>
                {seenCount >= totalPhrases
                  ? '이야~ 이 많은 걸 다 봤다꼬? 니는 인정한데이.. 고맙데이!'
                  : `전체 ${totalPhrases}개 문장 중 ${seenCount}개 발견!`}
              </span>
            </div>
          )}
        </div>

        {/* 버튼들 */}
        <div className="flex justify-center gap-2 md:gap-4 flex-wrap">
          <button
            onClick={handleShare}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="text-white rounded-full font-bold transition-colors w-[90px] md:w-[150px] h-[36px] md:h-[48px] flex items-center justify-center gap-[4px] md:gap-[6px] text-[11px] md:text-[16px] hover:brightness-110"
            style={{ ...NEODGM, backgroundColor: '#9CB5FF' }}
          >
            <img src="/images/send.svg" alt="" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] shrink-0 object-contain" />
            <span>보내봐라</span>
          </button>
          <button
            onClick={handleRetry}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors w-[100px] md:w-[180px] h-[36px] md:h-[48px] flex items-center justify-center gap-[4px] md:gap-[6px] text-[12px] md:text-[18px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ ...NEODGM, fontWeight: 900, boxShadow: '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)' }}
          >
            <img src="/images/reroll.svg" alt="" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] shrink-0 object-contain" />
            찐막 ?
          </button>
          <button
            onClick={() => navigate('/', { state: { resetSeen: true } })}
            onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            className="bg-gray-600 hover:bg-gray-700 text-white rounded-full font-bold transition-colors w-[90px] md:w-[150px] h-[36px] md:h-[48px] flex items-center justify-center gap-[4px] md:gap-[6px] text-[11px] md:text-[16px]"
            style={NEODGM}
          >
            <img src="/images/back.svg" alt="" className="w-[16px] md:w-[18px] h-[16px] md:h-[18px] shrink-0 object-contain" />
            고마하자..
          </button>
        </div>
      </div>
    </div>
  );
}
