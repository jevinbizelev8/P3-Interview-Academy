import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface STARScoreBarProps {
  scores?: {
    situation: number;
    task: number;
    action: number;
    result: number;
    overall: number;
  };
  questionNumber?: number;
}

const STAR_COMPONENTS = [
  { key: 'situation', label: 'Situation', description: 'Context setting' },
  { key: 'task', label: 'Task', description: 'Your responsibility' },
  { key: 'action', label: 'Action', description: 'Steps you took' },
  { key: 'result', label: 'Result', description: 'Outcome & impact' },
] as const;

export function STARScoreBar({ scores, questionNumber }: STARScoreBarProps) {
  if (!scores) return null;

  const getScoreColor = (score: number) => {
    if (score >= 4) return 'bg-green-500';
    if (score >= 3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLevel = (score: number) => {
    if (score >= 4) return 'Strong';
    if (score >= 3) return 'Good';
    return 'Weak';
  };

  const overallScore = scores.overall;
  const overallColor = getScoreColor(overallScore);
  const overallLevel = getScoreLevel(overallScore);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">STAR Analysis</CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">{overallScore}/5</div>
            <div className={`text-xs px-2 py-1 rounded-full ${
              overallScore >= 4 ? 'bg-green-100 text-green-800' :
              overallScore >= 3 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {overallLevel}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Overall Score Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Score</span>
            <span className="text-sm text-gray-600">{overallScore}/5</span>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${overallColor}`}
                style={{ width: `${(overallScore / 5) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* Individual STAR Components */}
        <div className="space-y-3">
          {STAR_COMPONENTS.map(({ key, label, description }) => {
            const score = scores[key as keyof typeof scores];
            const scoreColor = getScoreColor(score);
            
            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="text-sm font-medium text-gray-900">{label}</span>
                    <span className="text-xs text-gray-500 ml-2">{description}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">{score}/5</span>
                    <div className={`w-2 h-2 rounded-full ${scoreColor}`} />
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${scoreColor}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-gray-600 border-t">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>1-2 Weak</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span>3 Good</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>4-5 Strong</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}