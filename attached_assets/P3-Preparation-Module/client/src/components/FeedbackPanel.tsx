import { CheckCircle, AlertTriangle } from "lucide-react";

interface FeedbackPanelProps {
  feedback: {
    overall: string;
    items: Array<{ type: 'positive' | 'improvement'; message: string }>;
  };
}

export default function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  if (!feedback || !feedback.items?.length) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="w-6 h-6 bg-success-green rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <h5 className="font-semibold text-gray-900 mb-2">{feedback.overall}</h5>
          <div className="space-y-1 text-sm">
            {feedback.items.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                {item.type === 'positive' ? (
                  <CheckCircle className="w-4 h-4 text-success-green flex-shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-warning-yellow flex-shrink-0" />
                )}
                <span className="text-gray-700">{item.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
