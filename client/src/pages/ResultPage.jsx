import { useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';

function ResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, phrase, playCount } = location.state || {};
  const [displayPhrase, setDisplayPhrase] = useState('');
  const [isAnimating, setIsAnimating] = useState(true);

  const dummyPhrases = [
    '두근두근...',
    '읽는 중...',
    '해석 중...',
    '거의 다 됐어...',
  ];

  useEffect(() => {
    if (!phrase) return;

    let count = 0;
    const interval = setInterval(() => {
      if (count < 8) {
        setDisplayPhrase(dummyPhrases[count % dummyPhrases.length]);
        count++;
      } else {
        setDisplayPhrase(phrase);
        setIsAnimating(false);
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, [phrase]);

  if (!location.state) {
    navigate('/');
    return null;
  }

  const handleRetry = async () => {
    const res = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, skipRanking: false }),
    });
    const data = await res.json();
    navigate('/result', { state: data, replace: true });
    window.location.reload();
  };

  const handleShare = () => {
    const text = `${name}의 속마음: "${phrase}" - 찐막 속마음 번역기`;
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('클립보드에 복사되었습니다!');
    }
  };

  return (
    <div className="result-page">
      <h2>'{name}'의 속마음은…</h2>
      <div className={`phrase-display ${isAnimating ? 'animating' : 'revealed'}`}>
        "{displayPhrase}"
      </div>
      <p className="play-count">현재 {playCount}판 째</p>
      <div className="result-buttons">
        <button onClick={handleShare}>공유하기</button>
        <button onClick={handleRetry}>다시 돌리기</button>
        <button onClick={() => navigate('/')}>돌아가기</button>
      </div>
    </div>
  );
}

export default ResultPage;
