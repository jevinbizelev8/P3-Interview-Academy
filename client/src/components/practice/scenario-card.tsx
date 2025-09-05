import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Phone, Users, Bus, ServerCog, Crown } from "lucide-react";

const STAGE_ICONS = {
  'phone-screening': Phone,
  'functional-team': Users,
  'hiring-manager': Bus,
  'subject-matter': ServerCog,
  'executive': Crown,
};

const STAGE_COLORS = {
  'phone-screening': 'bg-blue-500 text-blue-500',
  'functional-team': 'bg-green-500 text-green-500',
  'hiring-manager': 'bg-yellow-500 text-yellow-500',
  'subject-matter': 'bg-purple-500 text-purple-500',
  'executive': 'bg-red-500 text-red-500',
};

interface ScenarioCardProps {
  stage: {
    id: string;
    title: string;
    description: string;
    points: string[];
  };
  jobContext: {
    jobPosition: string;
    companyName: string;
    interviewLanguage?: string;
    jobDescription?: string;
    specificFocus?: string;
  };
  scenarios: Array<{
    id: string;
    title: string;
    sessionCount: number;
    averageRating: number;
  }>;
}

export default function ScenarioCard({ stage, jobContext, scenarios }: ScenarioCardProps) {
  const [, setLocation] = useLocation();

  const Icon = STAGE_ICONS[stage.id as keyof typeof STAGE_ICONS];
  const colors = STAGE_COLORS[stage.id as keyof typeof STAGE_COLORS];
  const [bgColor, textColor] = colors.split(' ');

  const handleCardClick = () => {
    // If there are specific scenarios, navigate to the first one
    // Otherwise, create a default scenario for this stage
    if (scenarios.length > 0) {
      console.log('Navigating to briefing for scenario:', scenarios[0].id);
      console.log('Job context:', jobContext);
      
      // Store job context in session storage for the briefing page
      sessionStorage.setItem('jobContext', JSON.stringify(jobContext));
      
      setLocation(`/practice/briefing/${scenarios[0].id}`);
    } else {
      // For now, we'll need a default scenario for each stage
      // In a real implementation, you might want to show a "no scenarios" message
      // or redirect to create scenario
      console.log(`No scenarios available for ${stage.id}`);
    }
  };

  return (
    <Card 
      className="border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center mb-3">
          <div className={`w-10 h-10 ${bgColor} bg-opacity-10 rounded-lg flex items-center justify-center mr-3`}>
            <Icon className={`w-5 h-5 ${textColor}`} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{stage.title}</h4>
            <p className="text-sm text-gray-600">{stage.description}</p>
          </div>
        </div>
        <ul className="text-sm text-gray-600 space-y-1">
          {stage.points.map((point, index) => (
            <li key={index} className="flex items-start">
              <span className="text-primary mr-2">•</span>
              <span>{point}</span>
            </li>
          ))}
        </ul>
        
        {scenarios.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              {scenarios.length} scenario{scenarios.length === 1 ? '' : 's'} available
              {scenarios[0].sessionCount > 0 && (
                <span className="ml-2">
                  • {scenarios[0].sessionCount} completions
                  {scenarios[0].averageRating > 0 && (
                    <span className="ml-1">
                      • {Number(scenarios[0].averageRating).toFixed(1)}★
                    </span>
                  )}
                </span>
              )}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
