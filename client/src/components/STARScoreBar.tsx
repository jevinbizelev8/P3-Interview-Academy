interface STARScoreBarProps {
  scores: {
    situation: number;
    task: number;
    action: number;
    result: number;
    overall: number;
  };
  questionNumber?: number | null;
}

export function STARScoreBar({ scores }: STARScoreBarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const scoreItems = [
    { key: 'situation', label: 'S', score: scores.situation },
    { key: 'task', label: 'T', score: scores.task },
    { key: 'action', label: 'A', score: scores.action },
    { key: 'result', label: 'R', score: scores.result },
  ];

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-gray-600">STAR:</span>
      <div className="flex items-center gap-2">
        {scoreItems.map(({ key, label, score }) => (
          <div key={key} className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-500">{label}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((dot) => (
                <div
                  key={dot}
                  className={`w-2 h-2 rounded-full ${
                    dot <= score ? getScoreColor(score) : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="ml-2 text-xs text-gray-500">
        Overall: {scores.overall}/5
      </div>
    </div>
  );
}