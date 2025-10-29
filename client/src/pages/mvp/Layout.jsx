

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, BookOpen, Target, TrendingUp, Award, Zap, ArrowRight, LogOut, User as UserIcon, Users } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import FloatingAICoach from "./components/shared/FloatingAICoach";

const navigationItems = [
  {
    title: "Home",
    url: createPageUrl("Home"),
    icon: Home,
    description: "Your interview journey overview"
  },
  {
    title: "Prepare",
    url: createPageUrl("Prepare"),
    icon: BookOpen,
    description: "Build your foundation"
  },
  {
    title: "Practice",
    url: createPageUrl("Practice"),
    icon: Target,
    description: "AI interview simulations"
  },
  {
    title: "Perform",
    url: createPageUrl("Perform"),
    icon: TrendingUp,
    description: "Analytics & growth"
  },
  {
    title: "Refer Friend",
    url: createPageUrl("Referral"),
    icon: Users,
    description: "Earn rewards"
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [credits, setCredits] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [userProgress, setUserProgress] = React.useState({ readiness: 0, xp: 0 });

  React.useEffect(() => {
    const fetchUserAndCredits = async () => {
      try {
        // Check if user is authenticated first
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          // User not logged in, skip fetching, set state to null to reflect unauthenticated state
          setUser(null);
          setCredits(null);
          setUserProgress({ readiness: 0, xp: 0 });
          return;
        }

        const currentUser = await base44.auth.me();
        setUser(currentUser);
        
        // Fetch subscription for credits
        const subs = await base44.entities.Subscription.filter({ user_id: currentUser.id });
        if (subs.length > 0) {
          setCredits(subs[0].current_credits);
        } else {
          // Create initial subscription for new users if none found
          const newSub = await base44.entities.Subscription.create({
            user_id: currentUser.id,
            plan_type: "STARTER",
            billing_cycle: "monthly",
            seats: 1,
            monthly_credits: 50,
            current_credits: 50,
            price_per_seat: 0,
            status: "active"
          });
          setCredits(50); // Set credits from the new subscription
        }

        // Fetch user profile for progress
        const profiles = await base44.entities.UserProfile.filter({ user_id: currentUser.id });
        if (profiles.length > 0) {
          setUserProgress({
            readiness: Math.round(profiles[0].readiness_score || 0),
            xp: profiles[0].xp_points || 0
          });
        } else {
          // Create initial profile
          await base44.entities.UserProfile.create({
            user_id: currentUser.id,
            xp_points: 0,
            current_streak: 0,
            total_simulations: 0,
            readiness_score: 0
          });
          setUserProgress({ readiness: 0, xp: 0 });
        }
      } catch (error) {
        // Silently handle error - user might be on a public page or token expired
        console.error("Error fetching user and credits (possibly unauthenticated):", error);
        setUser(null);
        setCredits(null);
        setUserProgress({ readiness: 0, xp: 0 });
      }
    };
    fetchUserAndCredits();
    
    // Set up interval for refreshing user and credits data
    const interval = setInterval(fetchUserAndCredits, 30000);
    return () => clearInterval(interval); // Clear interval on component unmount
  }, []);

  const handleLogout = () => {
    base44.auth.logout(createPageUrl("Landing"));
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <Sidebar className="border-r border-purple-100 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col h-full">
            <SidebarHeader className="border-b border-purple-100 p-4 flex-shrink-0">
              <Link to={createPageUrl("Landing")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-base">P³ Interview Academy</h2>
                </div>
              </Link>
            </SidebarHeader>
            
            <SidebarContent className="flex-1 overflow-y-auto">
              <div className="px-3 pt-8">
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu className="space-y-2">
                      {navigationItems.map((item) => {
                        const isActive = location.pathname === item.url;
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                              asChild 
                              className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all rounded-xl ${
                                isActive ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 shadow-sm' : ''
                              }`}
                            >
                              <Link to={item.url} className="flex items-start gap-3 px-3 py-3 w-full min-w-0">
                                <item.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <span className="font-semibold block text-sm truncate">{item.title}</span>
                                  <span className="text-xs text-gray-500 block truncate">{item.description}</span>
                                </div>
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>

                <div className="mt-6 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-semibold text-purple-900">Your Progress</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Readiness</span>
                      <span className="font-bold text-purple-700">{userProgress.readiness}%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Rewards Points</span>
                      <span className="font-bold text-blue-700">{userProgress.xp}</span>
                    </div>
                  </div>
                </div>

                {user && ( // Only show credits block if user is logged in
                  <Link to={createPageUrl("Billing")} className="block mt-4">
                    <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border-2 border-yellow-300 hover:shadow-md transition-all cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          <span className="text-xs font-semibold text-yellow-900">Credits</span>
                        </div>
                        <ArrowRight className="w-3 h-3 text-yellow-700" />
                      </div>
                      <p className="text-2xl font-bold text-yellow-700">
                        {credits !== null ? credits : '...'}
                      </p>
                      <p className="text-xs text-yellow-600 mt-1">Click to manage</p>
                    </div>
                  </Link>
                )}
              </div>
            </SidebarContent>

            <SidebarFooter className="border-t border-purple-100 p-4 bg-white/50 flex-shrink-0">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-3 w-full hover:bg-purple-50 rounded-lg p-2 transition-colors">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          {user.full_name || 'User'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = createPageUrl("Profile")}>
                      <UserIcon className="w-4 h-4 mr-2" />
                      Profile Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = createPageUrl("Billing")}>
                      <Zap className="w-4 h-4 mr-2" />
                      Billing & Credits
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to={createPageUrl("Landing")}>
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                    Sign In
                  </Button>
                </Link>
              )}
            </SidebarFooter>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-6 py-4 lg:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Link to={createPageUrl("Landing")}>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  P³ Interview Academy
                </h1>
              </Link>
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>

        <FloatingAICoach currentPage={currentPageName} />
      </div>
    </SidebarProvider>
  );
}

