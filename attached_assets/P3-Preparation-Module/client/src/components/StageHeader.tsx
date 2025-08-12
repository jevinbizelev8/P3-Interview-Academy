import { Code, Phone, Users, TrendingUp, Building, Info } from "lucide-react";
import type { InterviewType } from "@shared/schema";

interface StageHeaderProps {
  title: string;
  subtitle: string;
  description: string;
  interviewType: InterviewType;
}

const stageConfig = {
  'phone-screening': {
    icon: Phone,
    focusTitle: 'Phone Screening Focus',
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-500'
  },
  'functional-team': {
    icon: Users,
    focusTitle: 'Team Interview Focus', 
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500'
  },
  'hiring-manager': {
    icon: TrendingUp,
    focusTitle: 'Manager Interview Focus',
    bgColor: 'bg-purple-500', 
    borderColor: 'border-purple-500'
  },
  'subject-matter-expertise': {
    icon: Code,
    focusTitle: 'Subject-Matter Expertise Focus',
    bgColor: 'bg-primary-blue',
    borderColor: 'border-primary-blue'
  },
  'executive-final': {
    icon: Building,
    focusTitle: 'Executive Round Focus',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500'
  }
};

export default function StageHeader({ title, subtitle, description, interviewType }: StageHeaderProps) {
  const config = stageConfig[interviewType];
  
  // Fallback if config is not found
  if (!config) {
    console.error(`StageHeader: No config found for interview type: ${interviewType}`);
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
            <Code className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
            <p className="text-sm text-neutral-gray">{subtitle}</p>
          </div>
        </div>
        <div className="bg-blue-50 border-l-4 border-gray-500 p-4 rounded-r-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Interview Focus</h4>
              <p className="text-sm text-gray-700">{description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const IconComponent = config.icon;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <div className={`w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center`}>
          <IconComponent className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-neutral-gray">{subtitle}</p>
        </div>
      </div>
      
      <div className={`bg-blue-50 border-l-4 ${config.borderColor} p-4 rounded-r-lg`}>
        <div className="flex items-start space-x-3">
          <Info className={`w-5 h-5 ${config.bgColor.replace('bg-', 'text-')} mt-0.5 flex-shrink-0`} />
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">{config.focusTitle}</h4>
            <p className="text-sm text-gray-700">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
