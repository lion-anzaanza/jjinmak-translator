/**
 * 랭킹 스타일 — Figma에서 추출한 정확한 값
 *
 * 1위: 🏆 gold trophy, 번호 glow #fd0, 이름 semibold glow rgba(255,246,0,0.25)
 * 2위: 🥈 silver trophy, 번호 glow white, 이름 regular glow white
 * 3위: 🥉 bronze trophy, 번호 glow #b25c00, 이름 regular glow #df6c00
 * 4~6위: 트로피 없음, 번호/이름 plain white
 * 모든 번호: Kablammo 폰트, fontVariationSettings "'MORF' 40"
 * 플레이횟수: #ff9cee, text-shadow 4px 0 10px #e0f
 */

const RANK_STYLES = [
  {
    trophy: '/images/medal-gold.svg',
    numShadow: '5px 0px 10px #ffdd00',
    nameWeight: 600,
    nameShadow: '0px 0px 12px rgba(255, 215, 0, 0.8)',
  },
  {
    trophy: '/images/medal-silver.svg',
    numShadow: '5px 0px 10px white',
    nameWeight: 400,
    nameShadow: '5px 0px 10px white',
  },
  {
    trophy: '/images/medal-bronze.svg',
    numShadow: '5px 0px 10px #b25c00',
    nameWeight: 400,
    nameShadow: '5px 0px 10px #df6c00',
  },
];

const KABLAMMO = { fontFamily: 'Kablammo, sans-serif', fontVariationSettings: "'MORF' 40" };
const INTER = { fontFamily: "Inter, 'Noto Sans KR', sans-serif" };

// 1~3위 플레이 횟수에 비례한 폰트 크기 계산 (모바일/데스크탑)
function getScaledSize(rankings, index) {
  if (index >= 3) return null; // 4위 이하는 기본 크기
  const top3 = rankings.slice(0, 3).map(r => r.play_count);
  const max = top3[0] || 1;
  const min = top3[top3.length - 1] || 1;
  const range = max - min || 1;
  const ratio = (rankings[index].play_count - min) / range; // 0~1
  const mobilePx = 18 + ratio * 10;  // 18~28px
  const desktopPx = 24 + ratio * 14; // 24~38px
  return { mobile: Math.round(mobilePx), desktop: Math.round(desktopPx) };
}

export function RankingList({ rankings }) {
  return (
    <div className="flex flex-col items-center gap-[10px]" style={INTER}>
      {rankings.map((player, i) => {
        const style = RANK_STYLES[i]; // undefined for 4~6위
        const hasTrophy = i < 3;
        const scaled = getScaledSize(rankings, i);

        return (
          <div key={i} className="flex items-center gap-[10px] h-[36px]">
            {/* 트로피 (1~3위만) */}
            {hasTrophy ? (
              <img src={style.trophy} alt="" className="w-[22px] md:w-[28px] h-[28px] md:h-[36px] object-contain shrink-0" />
            ) : (
              <span className="w-[22px] md:w-[28px] shrink-0" />
            )}

            {/* 순위 번호 — 모두 Kablammo 폰트 */}
            <span
              className="text-[18px] md:text-[24px] text-white text-center w-[30px] md:w-[40px] shrink-0"
              style={{
                ...KABLAMMO,
                textShadow: style?.numShadow || 'none',
              }}
            >
              {i + 1}
            </span>

            {/* 이름 */}
            <span
              className={`${scaled ? '' : 'text-[18px] md:text-[24px]'} text-white w-[90px] md:w-[120px] shrink-0 whitespace-nowrap`}
              style={{
                fontWeight: style?.nameWeight || 400,
                textShadow: style?.nameShadow || 'none',
                ...(scaled ? { fontSize: `clamp(${scaled.mobile}px, 3vw, ${scaled.desktop}px)` } : {}),
              }}
            >
              {player.name}
            </span>

            {/* 플레이 횟수 */}
            <span
              className="text-[12px] md:text-[14px] text-[#ff9cee] w-[100px] md:w-[120px] text-right whitespace-nowrap shrink-0"
              style={{ textShadow: '4px 0px 10px #ee00ff' }}
            >
              딴짓 {player.play_count}번 째!
            </span>
          </div>
        );
      })}

      {rankings.length === 0 && (
        <p className="text-[rgba(255,255,255,0.33)] text-[14px]">아직 랭킹이 없습니다.</p>
      )}
    </div>
  );
}

export function RankingNotice() {
  return (
    <div className="flex items-center gap-[10px] mt-[16px]">
      {/* 트로피 자리 */}
      <span className="w-[22px] md:w-[28px] shrink-0" />
      {/* 번호 자리 */}
      <span className="w-[30px] md:w-[40px] shrink-0" />
      {/* 이름+플레이횟수 자리를 합쳐서 우측 정렬 */}
      <span className="text-[12px] text-[rgba(255,255,255,0.15)] whitespace-nowrap shrink-0 w-[200px] md:w-[250px] text-right">
        랭킹은 월요일 아침마다 초기화된데이
      </span>
    </div>
  );
}
