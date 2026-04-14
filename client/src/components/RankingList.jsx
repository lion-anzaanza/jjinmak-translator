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

const KABLAMMO_BASE = { fontFamily: 'Kablammo, sans-serif', fontVariationSettings: "'MORF' 40" };

const RANK_STYLES = [
  {
    trophy: '/images/medal-gold.svg',
    numStyle: { ...KABLAMMO_BASE, textShadow: '5px 0px 10px #ffdd00' },
    nameStyle: { fontWeight: 600, textShadow: '0px 0px 12px rgba(255, 215, 0, 0.8)' },
  },
  {
    trophy: '/images/medal-silver.svg',
    numStyle: { ...KABLAMMO_BASE, textShadow: '5px 0px 10px white' },
    nameStyle: { fontWeight: 400, textShadow: '5px 0px 10px white' },
  },
  {
    trophy: '/images/medal-bronze.svg',
    numStyle: { ...KABLAMMO_BASE, textShadow: '5px 0px 10px #b25c00' },
    nameStyle: { fontWeight: 400, textShadow: '5px 0px 10px #df6c00' },
  },
];

const DEFAULT_NUM_STYLE = { ...KABLAMMO_BASE, textShadow: 'none' };
const DEFAULT_NAME_STYLE = { fontWeight: 400, textShadow: 'none' };
const INTER = { fontFamily: "Inter, 'Noto Sans KR', sans-serif" };

// 1~3위 폰트 크기 계산
// - 1등: 이름이 컨테이너(모바일 90px / 데스크탑 120px)에 딱 맞는 최대 크기
// - 2·3등: 1등 크기 × (본인 플레이수 / 1등 플레이수)
function getScaledSize(rankings, index) {
  if (index >= 3) return null;
  const top3 = rankings.slice(0, 3);
  const maxPlayCount = top3[0]?.play_count || 1;
  const firstName = top3[0]?.name || 'x';
  const mobileBase = Math.floor(90 / firstName.length);
  const desktopBase = Math.floor(120 / firstName.length);
  const ratio = (top3[index]?.play_count || 0) / maxPlayCount;
  const ownName = top3[index]?.name || 'x';
  const mobileMax = Math.floor(90 / ownName.length);
  const desktopMax = Math.floor(120 / ownName.length);
  return {
    mobile: Math.max(14, Math.min(mobileMax, Math.round(mobileBase * ratio))),
    desktop: Math.max(18, Math.min(desktopMax, Math.round(desktopBase * ratio))),
  };
}

export function RankingList({ rankings }) {
  return (
    <div className="flex flex-col items-center gap-[10px]" style={INTER}>
      {rankings.map((player, i) => {
        const style = RANK_STYLES[i]; // undefined for 4~6위
        const hasTrophy = i < 3;
        const scaled = getScaledSize(rankings, i);

        return (
          <div key={player.name} className="flex items-center gap-[10px] h-[36px]">
            {/* 트로피 (1~3위만) */}
            {hasTrophy ? (
              <img src={style.trophy} alt="" className="w-[22px] md:w-[28px] h-[28px] md:h-[36px] object-contain shrink-0" />
            ) : (
              <span className="w-[22px] md:w-[28px] shrink-0" />
            )}

            {/* 순위 번호 — 모두 Kablammo 폰트 */}
            <span
              className="text-[18px] md:text-[24px] text-white text-center w-[30px] md:w-[40px] shrink-0"
              style={style?.numStyle || DEFAULT_NUM_STYLE}
            >
              {i + 1}
            </span>

            {/* 이름 */}
            <span
              className="text-white w-[90px] md:w-[120px] shrink-0 whitespace-nowrap overflow-hidden"
              style={scaled
                ? { ...(style?.nameStyle || DEFAULT_NAME_STYLE), fontSize: `clamp(${scaled.mobile}px, 3vw, ${scaled.desktop}px)` }
                : (style?.nameStyle || DEFAULT_NAME_STYLE)
              }
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
