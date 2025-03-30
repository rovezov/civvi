import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/layouts/user-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchIcon, Star, BookmarkPlus } from "lucide-react";
import { Organization } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserSearch() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  
  // Fetch organizations
  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/organizations", searchQuery],
    queryFn: async () => {
      const url = searchQuery 
        ? `/api/organizations?search=${encodeURIComponent(searchQuery)}`
        : "/api/organizations";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch organizations");
      return res.json();
    }
  });
  
  const categories = ["All", "Environmental", "Education", "Social Justice", "Health"];
  
  // Save organization function
  const handleSaveOrganization = async (orgId: number) => {
    try {
      await apiRequest("POST", `/api/organizations/${orgId}/save`);
      toast({
        title: "Organization saved",
        description: "Organization has been added to your saved list.",
      });
      
      // Invalidate saved organizations query
      queryClient.invalidateQueries({ queryKey: ["/api/user/saved-organizations"] });
    } catch (error: any) {
      toast({
        title: "Failed to save",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  return (
    <UserLayout title="Discover">
      <div className="p-4 space-y-5">
        {/* Search bar */}
        <div className="mb-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="search"
              placeholder="Search organizers or events..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          {/* Categories */}
          <div className="flex mt-3 space-x-2 overflow-x-auto py-1 scrollbar-hide">
            {categories.map((category) => (
              <Button
                key={category}
                variant={activeCategory === category ? "default" : "outline"}
                className="px-3 py-1 h-auto text-sm whitespace-nowrap"
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
        
        <h2 className="text-lg font-semibold">Organizations</h2>
        
        {/* Organizations list */}
        {isLoading ? (
          <>
            <OrganizationSkeleton />
            <OrganizationSkeleton />
            <OrganizationSkeleton />
          </>
        ) : organizations && organizations.length > 0 ? (
          organizations.map((org) => (
            <Card key={org.id} className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">{org.name}</h3>
                    <p className="text-sm text-gray-500">{org.description.length > 40 
                      ? org.description.substring(0, 40) + '...' 
                      : org.description}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4].map((star) => (
                          <Star key={star} className="h-3 w-3 text-yellow-400 fill-current" />
                        ))}
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      </div>
                      <span className="text-xs text-gray-500 ml-1">(5.0)</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 flex flex-wrap gap-1">
                  {org.categories && org.categories.split(',').map((category, index) => {
                    const colors = ["green", "blue", "purple", "yellow", "red"];
                    const colorIndex = index % colors.length;
                    const color = colors[colorIndex];
                    
                    return (
                      <Badge
                        key={index}
                        variant="outline"
                        className={`bg-${color}-100 text-${color}-800 hover:bg-${color}-100 px-2 py-1 h-auto text-xs`}
                      >
                        {category.trim()}
                      </Badge>
                    );
                  })}
                </div>
                
                <div className="mt-3 flex justify-between">
                  <Button variant="link" className="text-primary text-sm font-medium p-0 h-auto">
                    View profile
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-1 h-auto"
                    onClick={() => handleSaveOrganization(org.id)}
                  >
                    <BookmarkPlus className="h-5 w-5 text-gray-400" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">No organizations found.</p>
              {searchQuery && (
                <p className="text-sm text-gray-400 mt-1">Try a different search term.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </UserLayout>
  );
}

const OrganizationSkeleton = () => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex items-center">
        <Skeleton className="w-14 h-14 rounded-full mr-3" />
        <div className="w-2/3">
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      
      <div className="mt-3 flex gap-1">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </CardContent>
  </Card>
);
