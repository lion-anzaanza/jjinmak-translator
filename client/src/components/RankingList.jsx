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
    trophy: '/images/medal-gold.png',
    numShadow: '5px 0px 10px #ffdd00',
    nameWeight: 600,
    nameShadow: '5px 0px 10px rgba(255, 246, 0, 0.25)',
  },
  {
    trophy: '/images/medal-silver.png',
    numShadow: '5px 0px 10px white',
    nameWeight: 400,
    nameShadow: '5px 0px 10px white',
  },
  {
    trophy: '/images/medal-bronze.png',
    numShadow: '5px 0px 10px #b25c00',
    nameWeight: 400,
    nameShadow: '5px 0px 10px #df6c00',
  },
];

const KABLAMMO = { fontFamily: 'Kablammo, sans-serif', fontVariationSettings: "'MORF' 40" };
const INTER = { fontFamily: "Inter, 'Noto Sans KR', sans-serif" };

export function RankingList({ rankings }) {
  // 6위까지만 표시
  const items = rankings.slice(0, 6);

  return (
    <div className="flex flex-col items-center gap-[10px]" style={INTER}>
      {items.map((player, i) => {
        const style = RANK_STYLES[i]; // undefined for 4~6위
        const hasTrophy = i < 3;

        return (
          <div key={i} className="flex items-center gap-[10px]">
            {/* 트로피 (1~3위만) */}
            {hasTrophy ? (
              <img src={style.trophy} alt="" className="w-[28px] h-[36px] object-contain shrink-0" />
            ) : (
              <span className="w-[28px] shrink-0" />
            )}

            {/* 순위 번호 — 모두 Kablammo 폰트 */}
            <span
              className="text-[24px] text-white text-center w-[40px] shrink-0"
              style={{
                ...KABLAMMO,
                textShadow: style?.numShadow || 'none',
              }}
            >
              {i + 1}
            </span>

            {/* 이름 */}
            <span
              className="text-[24px] text-white w-[5em] shrink-0"
              style={{
                fontWeight: style?.nameWeight || 400,
                textShadow: style?.nameShadow || 'none',
              }}
            >
              {player.name}
            </span>

            {/* 플레이 횟수 */}
            <span
              className="text-[14px] text-[#ff9cee] w-[120px] text-right whitespace-nowrap shrink-0"
              style={{ textShadow: '4px 0px 10px #ee00ff' }}
            >
              딴짓 {player.play_count}번 째!
            </span>
          </div>
        );
      })}

      {items.length === 0 && (
        <p className="text-[rgba(255,255,255,0.33)] text-[14px]">아직 랭킹이 없습니다.</p>
      )}
    </div>
  );
}
