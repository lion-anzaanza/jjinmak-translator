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
  const { name, phrase, playCount: initialPlayCount, skipRanking } = stateData || {};

  const localCount = useRef(initialPlayCount || 1);
  const [playCount, setPlayCount] = useState(initialPlayCount || 1);
  const [displayedMessage, setDisplayedMessage] = useState('');
  const [isSlotting, setIsSlotting] = useState(!shared);

  const slotMessages = [
    '두근두근...', '읽는 중...', '해석 중...', '거의 다 됐어...',
    '음...', '잠깐만...', '뭐라고?', '헉...',
  ];

  useEffect(() => {
    if (!phrase) return;

    if (!isSlotting) {
      setDisplayedMessage(phrase);
      return;
    }

    let count = 0;
    const interval = setInterval(() => {
      setDisplayedMessage(slotMessages[count % slotMessages.length]);
      count++;
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      setIsSlotting(false);
      setDisplayedMessage(phrase);
    }, 2000);

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
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, skipRanking: skipRanking || false }),
    });
    const data = await res.json();

    if (skipRanking) {
      localCount.current += 1;
      navigate('/result', {
        state: { ...data, playCount: localCount.current, skipRanking },
        replace: true,
      });
    } else {
      localCount.current = data.playCount;
      navigate('/result', {
        state: { ...data, skipRanking },
        replace: true,
      });
    }
    window.location.reload();
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
    } else {
      try {
        await navigator.clipboard.writeText(url);
        alert('링크가 복사되었습니다!');
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert('링크가 복사되었습니다!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6" style={{ fontFamily: "'Gaegu', cursive" }}>
      <h2 className="text-3xl mb-8">
        <span className="font-bold text-purple-400">'{name}'</span>의 속마음은…
      </h2>

      <motion.div
        key={displayedMessage}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mb-8"
      >
        <p className="text-7xl font-bold text-center bg-gradient-to-r from-yellow-400 to-pink-500 bg-clip-text text-transparent">
          "{displayedMessage}"
        </p>
      </motion.div>

      <p className="text-lg font-bold text-gray-300 mb-6">
        현재 <span className="text-purple-400">{playCount}판</span> 째
      </p>

      <button
        onClick={handleShare}
        className="mb-8 px-8 py-3 bg-blue-500 rounded-full text-lg font-bold hover:bg-blue-600 transition-all transform hover:scale-105 shadow-lg"
      >
        공유하기
      </button>

      <div className="flex gap-4">
        <button
          onClick={handleRetry}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
        >
          다시 돌리기
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 bg-gray-600 rounded-full text-lg font-bold hover:bg-gray-700 transition-all transform hover:scale-105 shadow-lg"
        >
          돌아가기
        </button>
      </div>

      <div className="fixed top-10 left-10 text-4xl opacity-50">✨</div>
      <div className="fixed top-20 left-32 text-3xl opacity-30">✨</div>
      <div className="fixed top-10 right-10 text-4xl opacity-50">✨</div>
      <div className="fixed top-20 right-32 text-3xl opacity-30">✨</div>
      <div className="fixed bottom-20 left-20 text-5xl opacity-40">💭</div>
      <div className="fixed bottom-32 right-24 text-4xl opacity-40">😴</div>
      <div className="fixed top-1/3 left-10 text-3xl opacity-30">📚</div>
      <div className="fixed top-1/2 right-12 text-3xl opacity-30">😅</div>
    </div>
  );
}
