import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import UserLayout from "@/components/layouts/user-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Calendar, MapPin, Bookmark, ArrowRight } from "lucide-react";
import { Event, Organization } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

export default function UserDashboard() {
  const { user } = useAuth();
  
  // Fetch upcoming events
  const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    retry: 1,
  });
  
  // Fetch saved organizations
  const { data: savedOrgs, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ["/api/user/saved-organizations"],
    retry: 1,
  });
  
  // RSVP function
  const handleRSVP = async (eventId: number) => {
    try {
      await apiRequest("POST", `/api/events/${eventId}/register`);
      // Would normally invalidate the events cache here
    } catch (error) {
      console.error("Failed to RSVP:", error);
    }
  };
  
  // Save org function
  const handleSaveOrg = async (orgId: number) => {
    try {
      await apiRequest("POST", `/api/organizations/${orgId}/save`);
      // Would normally invalidate the saved orgs cache here
    } catch (error) {
      console.error("Failed to save organization:", error);
    }
  };

  return (
    <UserLayout title="Dashboard" points={user?.points || 0}>
      <div className="p-4 space-y-6">
        {/* Upcoming Events */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Upcoming Events</h2>
          
          {eventsLoading ? (
            <>
              <EventSkeleton />
              <EventSkeleton />
            </>
          ) : events && events.length > 0 ? (
            events.slice(0, 3).map((event) => (
              <Card key={event.id} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">by Organization Name</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                      {event.pointsValue} pts
                    </Badge>
                  </div>
                  
                  <div className="mt-3 flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {format(new Date(event.date), "MMMM d, yyyy • h:mm a")}
                  </div>
                  
                  <div className="mt-2 flex items-start text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                    <span>{event.location}</span>
                  </div>
                  
                  <div className="mt-4 flex space-x-2">
                    <Button className="flex-1" onClick={() => handleRSVP(event.id)}>
                      RSVP
                    </Button>
                    <Button variant="outline" size="icon">
                      <Bookmark className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No upcoming events found.</p>
                <p className="text-sm text-gray-400 mt-1">Check back later or search for organizations to follow!</p>
              </CardContent>
            </Card>
          )}
          
          {events && events.length > 0 && (
            <Button variant="link" className="text-primary font-medium text-sm flex items-center p-0">
              See all events
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </section>
        
        {/* Saved Organizations */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Saved Organizations</h2>
          
          {orgsLoading ? (
            <>
              <OrgSkeleton />
              <OrgSkeleton />
            </>
          ) : savedOrgs && savedOrgs.length > 0 ? (
            savedOrgs.map((org) => (
              <Card key={org.id} className="mb-4">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">{org.name}</h3>
                      <p className="text-sm text-gray-500">
                        {org.categories ? org.categories.split(',')[0] : "Community Organization"}
                      </p>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-auto">
                      <Bookmark className="h-5 w-5 text-primary" />
                    </Button>
                  </div>
                  
                  <div className="mt-3 flex justify-between">
                    <span className="text-xs text-gray-500">Upcoming events</span>
                    <Button variant="link" className="text-primary text-sm font-medium p-0 h-auto">View</Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No saved organizations found.</p>
                <p className="text-sm text-gray-400 mt-1">Visit the discover tab to find organizations to follow!</p>
              </CardContent>
            </Card>
          )}
        </section>
        
        {/* Points & Progress */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Progress</h2>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">Sustainability Champion</h3>
                <span className="text-sm text-gray-500">{user?.points || 0}/500 pts</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${Math.min(((user?.points || 0) / 500) * 100, 100)}%` }}
                ></div>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                {500 - (user?.points || 0)} points to reach the next level
              </p>
              
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">0</div>
                  <div className="text-xs text-gray-500">Events</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">{savedOrgs?.length || 0}</div>
                  <div className="text-xs text-gray-500">Organizations</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-primary">{user?.points || 0}</div>
                  <div className="text-xs text-gray-500">Points</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </UserLayout>
  );
}

const EventSkeleton = () => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex justify-between items-start">
        <div className="w-2/3">
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      
      <div className="mt-3">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
      
      <div className="mt-4 flex space-x-2">
        <Skeleton className="h-9 w-full rounded" />
        <Skeleton className="h-9 w-9 rounded" />
      </div>
    </CardContent>
  </Card>
);

const OrgSkeleton = () => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex items-center">
        <Skeleton className="w-12 h-12 rounded-full mr-3" />
        <div className="w-2/3">
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-16" />
      </div>
    </CardContent>
  </Card>
);
