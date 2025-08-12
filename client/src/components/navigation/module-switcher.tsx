import { Link } from "wouter";
import { BookOpen, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModuleSwitcherProps {
  currentModule?: string;
}

export default function ModuleSwitcher({ currentModule }: ModuleSwitcherProps) {
  const modules = [
    {
      id: "prepare",
      name: "Prepare",
      icon: BookOpen,
      color: "blue",
      href: "/prepare"
    },
    {
      id: "practice", 
      name: "Practice",
      icon: Target,
      color: "green",
      href: "/practice"
    },
    {
      id: "perform",
      name: "Perform", 
      icon: Award,
      color: "purple",
      href: "/perform"
    }
  ];

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-8 py-4">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = currentModule === module.id;
            const colorClasses = {
              blue: isActive ? "text-blue-600 border-blue-600" : "text-gray-600 hover:text-blue-600 border-transparent hover:border-blue-600",
              green: isActive ? "text-green-600 border-green-600" : "text-gray-600 hover:text-green-600 border-transparent hover:border-green-600", 
              purple: isActive ? "text-purple-600 border-purple-600" : "text-gray-600 hover:text-purple-600 border-transparent hover:border-purple-600"
            }[module.color];

            return (
              <Link key={module.id} href={module.href}>
                <div className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${colorClasses}`}>
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{module.name}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}