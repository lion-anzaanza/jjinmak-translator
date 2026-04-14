export default function PrivacyPage() {
  return (
    <div className="marble-bg min-h-screen flex items-center justify-center p-6">
      <div className="bg-black rounded-[20px] md:rounded-[30px] w-full max-w-[800px] px-8 py-10 md:px-16 md:py-14 text-white">
        <h1 className="text-[24px] md:text-[32px] font-bold mb-8" style={{ fontFamily: 'NeoDungGeunMo, monospace' }}>
          개인정보처리방침
        </h1>

        <div className="flex flex-col gap-6 text-[14px] md:text-[15px] leading-relaxed text-[rgba(255,255,255,0.75)]">
          <section>
            <h2 className="text-white font-semibold mb-2">1. 수집하는 정보</h2>
            <p>본 서비스(찐막 속마음 번역기)는 회원가입 없이 이용 가능하며, 별도의 개인정보를 수집하지 않습니다. 입력한 이름(한글 최대 5자)은 랭킹 표시 목적으로만 사용되며 식별 정보로 취급하지 않습니다.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">2. 광고 및 쿠키</h2>
            <p>본 서비스는 Google AdSense를 통해 광고를 제공합니다. Google을 포함한 제3자 광고 제공업체는 사용자의 이전 방문 기록을 바탕으로 맞춤형 광고를 제공하기 위해 쿠키를 사용할 수 있습니다. 맞춤형 광고 수신을 원하지 않는 경우 <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-[#9cb5ff] underline">Google 광고 설정</a>에서 거부할 수 있습니다. Google의 광고 쿠키 사용 방식에 대한 자세한 내용은 <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-[#9cb5ff] underline">Google 광고 정책</a>에서 확인할 수 있습니다.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">3. 로그 데이터</h2>
            <p>서버는 서비스 운영 및 어뷰징 방지를 위해 요청 IP 주소와 접속 시각을 일시적으로 기록할 수 있습니다. 해당 정보는 제3자에게 제공되지 않습니다.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">4. 문의</h2>
            <p>개인정보 관련 문의는 <a href="mailto:pupajusang01@gmail.com" className="text-[#9cb5ff] underline">pupajusang01@gmail.com</a>으로 연락주시기 바랍니다.</p>
          </section>

          <p className="text-[12px] text-[rgba(255,255,255,0.33)] mt-4">최종 수정일: 2026년 4월 14일</p>
        </div>
      </div>
    </div>
  );
}
