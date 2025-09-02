import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen,
  FileText,
  Video,
  CheckSquare,
  Lightbulb,
  Search,
  Filter,
  Clock,
  Star,
  Download,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Users,
  Building2,
  Target,
  MessageCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  resourceType: 'article' | 'video' | 'template' | 'checklist' | 'example';
  category: string;
  interviewStage?: string;
  industry?: string;
  content: string;
  aiGenerated: boolean;
  language: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime?: number;
  popularity: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ResourceLibraryProps {
  preparationSessionId?: string;
  onResourceSelect?: (resource: Resource) => void;
}

const resourceTypeIcons = {
  article: FileText,
  video: Video,
  template: CheckSquare,
  checklist: CheckSquare,
  example: Lightbulb
};

const resourceTypeColors = {
  article: 'bg-blue-100 text-blue-800',
  video: 'bg-red-100 text-red-800',
  template: 'bg-green-100 text-green-800',
  checklist: 'bg-purple-100 text-purple-800',
  example: 'bg-yellow-100 text-yellow-800'
};

const categoryIcons = {
  'star-method': Star,
  'behavioral': Users,
  'company-research': Building2,
  'technical': Target,
  'communication': MessageCircle,
  'leadership': TrendingUp
};

const difficultyColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-red-100 text-red-800'
};

export default function ResourceLibrary({ preparationSessionId, onResourceSelect }: ResourceLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedResourceType, setSelectedResourceType] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedStage, setSelectedStage] = useState<string>("all");
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch resources with filters
  const { data: resources = [], isLoading, error } = useQuery<Resource[]>({
    queryKey: ['/api/prepare/resources', selectedCategory, selectedResourceType, selectedDifficulty, selectedStage],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.set('category', selectedCategory);
      if (selectedResourceType !== 'all') params.set('resourceType', selectedResourceType);
      if (selectedDifficulty !== 'all') params.set('difficulty', selectedDifficulty);
      if (selectedStage !== 'all') params.set('interviewStage', selectedStage);
      
      const response = await apiRequest('GET', `/api/prepare/resources?${params.toString()}`);
      return response.json();
    }
  });

  // Generate dynamic resource mutation
  const generateResourceMutation = useMutation({
    mutationFn: async (data: { topic: string; resourceType: string; interviewStage?: string }) => {
      const response = await apiRequest('POST', '/api/prepare/resources/generate', data);
      return response.json();
    },
    onSuccess: (resource: Resource) => {
      queryClient.invalidateQueries({ queryKey: ['/api/prepare/resources'] });
      toast({
        title: "Resource Generated",
        description: `New ${resource.resourceType} about ${resource.title} has been created.`
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate resource. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Filter resources based on search term
  const filteredResources = resources.filter(resource =>
    resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Group resources by category
  const resourcesByCategory = filteredResources.reduce((acc, resource) => {
    if (!acc[resource.category]) {
      acc[resource.category] = [];
    }
    acc[resource.category].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);

  const handleBookmark = (resourceId: string) => {
    setBookmarkedResources(prev => {
      const newBookmarks = new Set(prev);
      if (newBookmarks.has(resourceId)) {
        newBookmarks.delete(resourceId);
      } else {
        newBookmarks.add(resourceId);
      }
      return newBookmarks;
    });
  };

  const formatReadTime = (minutes?: number): string => {
    if (!minutes) return '';
    return `${minutes} min read`;
  };

  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const Icon = resourceTypeIcons[resource.resourceType];
    const CategoryIcon = categoryIcons[resource.category as keyof typeof categoryIcons] || FileText;
    const isBookmarked = bookmarkedResources.has(resource.id);

    return (
      <Card className="hover:shadow-lg transition-all duration-200 group">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${resourceTypeColors[resource.resourceType]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg leading-snug group-hover:text-blue-600 transition-colors">
                  {resource.title}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-2">
                  <CategoryIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600 capitalize">
                    {resource.category.replace('-', ' ')}
                  </span>
                  {resource.estimatedReadTime && (
                    <>
                      <span className="text-gray-300">•</span>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatReadTime(resource.estimatedReadTime)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleBookmark(resource.id)}
              className="ml-2"
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-blue-600" />
              ) : (
                <Bookmark className="w-4 h-4 text-gray-400 hover:text-blue-600" />
              )}
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Badge className={difficultyColors[resource.difficulty]} variant="secondary">
                {resource.difficulty}
              </Badge>
              {resource.aiGenerated && (
                <Badge variant="outline" className="text-purple-600 border-purple-200">
                  AI Generated
                </Badge>
              )}
              {resource.interviewStage && (
                <Badge variant="outline">
                  {resource.interviewStage}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <TrendingUp className="w-3 h-3 mr-1" />
              {resource.popularity}
            </div>
          </div>

          <p className="text-sm text-gray-600 line-clamp-3 mb-4">
            {resource.content.substring(0, 150)}...
          </p>

          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {resource.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
              {resource.tags.length > 3 && (
                <span className="text-xs text-gray-400">+{resource.tags.length - 3}</span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onResourceSelect?.(resource)}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Open
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const GenerateResourceCard = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState("");
    const [resourceType, setResourceType] = useState<string>("article");

    const handleGenerate = async () => {
      if (!topic.trim()) return;
      
      setIsGenerating(true);
      try {
        await generateResourceMutation.mutateAsync({
          topic: topic.trim(),
          resourceType,
          interviewStage: selectedStage !== 'all' ? selectedStage : undefined
        });
        setTopic("");
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <Card className="border-2 border-dashed border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors">
        <CardContent className="p-6">
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
              <Lightbulb className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="font-semibold text-blue-900 mb-2">Generate Custom Resource</h3>
            <p className="text-sm text-blue-700">
              Create personalized preparation content with AI
            </p>
          </div>

          <div className="space-y-3">
            <Input
              placeholder="Enter topic (e.g., 'leadership examples', 'company culture')"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="border-blue-200 focus:border-blue-400"
            />
            <Select value={resourceType} onValueChange={setResourceType}>
              <SelectTrigger className="border-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="template">Template</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
                <SelectItem value="example">Example</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate Resource"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-red-600 mb-4">
            <FileText className="w-12 h-12 mx-auto mb-2" />
            <h3 className="text-lg font-semibold">Failed to Load Resources</h3>
            <p className="text-sm">Please try refreshing the page</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Library</h2>
          <p className="text-gray-600">
            Comprehensive collection of interview preparation materials
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">
            {filteredResources.length} resources
          </span>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="star-method">STAR Method</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="company-research">Company Research</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="leadership">Leadership</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedResourceType} onValueChange={setSelectedResourceType}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
                <SelectItem value="template">Templates</SelectItem>
                <SelectItem value="checklist">Checklists</SelectItem>
                <SelectItem value="example">Examples</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger>
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger>
                <SelectValue placeholder="Interview Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="phone-screening">Phone Screening</SelectItem>
                <SelectItem value="functional-team">Functional Team</SelectItem>
                <SelectItem value="hiring-manager">Hiring Manager</SelectItem>
                <SelectItem value="subject-matter-expertise">Technical</SelectItem>
                <SelectItem value="executive-final">Executive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
          <TabsTrigger value="popular">Popular</TabsTrigger>
          <TabsTrigger value="recent">Recent</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <Card>
                    <CardHeader>
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <GenerateResourceCard />
              {filteredResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarked">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources
              .filter(resource => bookmarkedResources.has(resource.id))
              .map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
          </div>
          {filteredResources.filter(r => bookmarkedResources.has(r.id)).length === 0 && (
            <div className="text-center py-12">
              <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bookmarked Resources</h3>
              <p className="text-gray-600">Bookmark resources to access them quickly later</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="popular">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources
              .sort((a, b) => b.popularity - a.popularity)
              .map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="recent">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}