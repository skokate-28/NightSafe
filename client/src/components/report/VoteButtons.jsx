import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import useReportStore from '../../store/reportStore';

export default function VoteButtons({ reportId, upvotes = 0, downvotes = 0, onVote }) {
  const [counts, setCounts] = useState({ upvotes, downvotes });
  const [voted, setVoted] = useState(null);
  const voteReport = useReportStore((s) => s.voteReport);

  const handleVote = async (type) => {
    try {
      const updated = await voteReport(reportId, type);
      setCounts({ upvotes: updated.upvotes, downvotes: updated.downvotes });
      setVoted(type);
      onVote?.(updated);
    } catch {
      // toast handled in store
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote('up')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${voted === 'up' ? 'text-safe bg-safe/10' : 'text-gray-400 hover:text-safe'}`}
      >
        <ThumbsUp size={14} />
        {counts.upvotes}
      </button>
      <button
        onClick={() => handleVote('down')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${voted === 'down' ? 'text-danger bg-danger/10' : 'text-gray-400 hover:text-danger'}`}
      >
        <ThumbsDown size={14} />
        {counts.downvotes}
      </button>
    </div>
  );
}
