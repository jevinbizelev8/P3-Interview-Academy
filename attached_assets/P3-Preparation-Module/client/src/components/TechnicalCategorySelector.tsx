import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface TechnicalIndustry {
  id: string;
  name: string;
  description: string;
  questionCount: number;
}

interface TechnicalCategorySelectorProps {
  onCategorySelect: (categoryId: string) => void;
  selectedCategory?: string;
}

export default function TechnicalCategorySelector({ onCategorySelect, selectedCategory }: TechnicalCategorySelectorProps) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch technical industries from the API
  const { data: technicalIndustries = [], isLoading, error } = useQuery<TechnicalIndustry[]>({
    queryKey: ['/api/technical-industries'],
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const filteredIndustries = technicalIndustries.filter(industry =>
    industry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    industry.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Select Your Technical Industry</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose the industry that best matches your expertise. Each industry contains 15+ technical questions 
          specifically designed for professionals in that field.
        </p>
        
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search industries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-gray-600">Loading technical industries...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Failed to load technical industries. Please try again.
        </div>
      ) : filteredIndustries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No industries found matching "{searchTerm}". Try a different search term.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredIndustries.map((industry) => {
            const isSelected = selectedCategory === industry.id;
            const isHovered = hoveredCategory === industry.id;
            
            return (
              <Card 
                key={industry.id}
                className={`cursor-pointer transition-all duration-200 h-full ${
                  isSelected 
                    ? 'ring-2 ring-blue-500 border-blue-200 bg-blue-50' 
                    : isHovered
                    ? 'border-blue-300 shadow-md'
                    : 'hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => onCategorySelect(industry.id)}
                onMouseEnter={() => setHoveredCategory(industry.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {industry.questionCount} questions
                    </Badge>
                  </div>
                  <CardTitle className="text-sm font-semibold leading-tight">{industry.name}</CardTitle>
                  <CardDescription className="text-xs leading-relaxed line-clamp-3">
                    {industry.description}
                  </CardDescription>
                </CardHeader>
                
                {isSelected && (
                  <CardContent className="pt-0">
                    <Button 
                      size="sm" 
                      className="w-full text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCategorySelect(industry.id);
                      }}
                    >
                      Start Preparation
                    </Button>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
        <div className="flex items-center justify-center space-x-2 text-blue-700 mb-2">
          <span className="font-medium">🎯 Industry-Specific Questions</span>
        </div>
        <p className="text-blue-600 text-sm">
          Each industry contains technical questions covering key concepts, tools, and methodologies relevant to that field. 
          Questions are further personalised based on your uploaded job description.
        </p>
      </div>
    </div>
  );
}