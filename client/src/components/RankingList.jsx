const medals = ['👑', '🥈', '🥉'];

export function RankingList({ rankings, friendName, setFriendName, dontRecord, setDontRecord }) {
  return (
    <div className="w-full max-w-md text-left space-y-4">
      {/* Rankings */}
      {rankings.map((player, i) => (
        <div key={i} className="flex items-center gap-3 text-2xl">
          <span className="text-3xl">{medals[i]}</span>
          <span className="font-bold">{i + 1}등: {player.name}</span>
          <span className="text-gray-400">- {player.play_count}판 째 게임중!</span>
        </div>
      ))}

      {/* Input Field */}
      <div className="flex items-center gap-3 text-2xl mt-6">
        <input
          type="text"
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
          placeholder="친구 이름 입력"
          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-xl w-48 focus:outline-none focus:border-purple-500"
        />
        <span className="text-gray-400">- ??판 째 게임중!</span>
      </div>

      {/* Don't Record Checkbox */}
      <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer mt-2">
        <input
          type="checkbox"
          checked={dontRecord}
          onChange={(e) => setDontRecord(e.target.checked)}
          className="w-4 h-4"
        />
        랭크에 기록 안 할래요.
      </label>
    </div>
  );
}
