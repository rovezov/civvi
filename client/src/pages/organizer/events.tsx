import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useQuery, useMutation } from "@tanstack/react-query";
import OrganizerLayout from "@/components/layouts/organizer-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, MapPin, Users, Award, PlusCircle, Edit, Copy } from "lucide-react";
import { Event, insertEventSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Event form schema
const eventFormSchema = insertEventSchema
  .omit({ organizerId: true, organizationId: true })
  .extend({
    date: z.string().min(1, "Date is required"),
    time: z.string().min(1, "Time is required"),
  })
  .refine(
    (data) => {
      const date = new Date(`${data.date}T${data.time}`);
      return date > new Date();
    },
    {
      message: "Event date must be in the future",
      path: ["date"],
    }
  );

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function OrganizerEvents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "past">("all");
  
  // Fetch organizer's events
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/events?organizerId=${user?.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch events");
      return res.json();
    },
    enabled: !!user,
  });
  
  // Create event form
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      location: "",
      pointsValue: 15,
      status: "active",
    },
  });
  
  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormValues) => {
      try {
        // Combine date and time
        const dateTime = new Date(`${data.date}T${data.time}`);
        
        // Check if date is valid before proceeding
        if (isNaN(dateTime.getTime())) {
          throw new Error("Invalid date or time format");
        }
        
        // Create the event payload
        const eventData = {
          title: data.title,
          description: data.description,
          date: dateTime.toISOString(),
          location: data.location,
          pointsValue: data.pointsValue,
          status: data.status,
          organizerId: user!.id,
        };
        
        return apiRequest("POST", "/api/events", eventData);
      } catch (error) {
        throw new Error("Please enter a valid date and time");
      }
    },
    onSuccess: () => {
      toast({
        title: "Event created",
        description: "Your event has been created successfully.",
      });
      setIsCreateEventOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/events", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create event",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: EventFormValues) => {
    createEventMutation.mutate(data);
  };
  
  // Filter events
  const filteredEvents = events?.filter(event => {
    const eventDate = new Date(event.date);
    const now = new Date();
    
    switch (filterStatus) {
      case "upcoming":
        return eventDate >= now;
      case "past":
        return eventDate < now;
      default:
        return true;
    }
  });
  
  // Get stats
  const getStats = () => {
    if (!events) return { total: 0, upcoming: 0, rsvps: 0 };
    
    const now = new Date();
    const upcoming = events.filter(event => new Date(event.date) >= now).length;
    
    return {
      total: events.length,
      upcoming,
      rsvps: 0, // This would come from the event participants data
    };
  };
  
  const stats = getStats();

  return (
    <OrganizerLayout title="Manage Events">
      <div className="p-4 space-y-6">
        {/* Create New Event Button */}
        <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
          <DialogTrigger asChild>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              <PlusCircle className="mr-2 h-5 w-5" />
              Create New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <p className="text-sm text-gray-500 mt-1">Fill out the form below to create a new community event.</p>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter event name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter location" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your event" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="pointsValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points Value</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={e => field.onChange(Number(e.target.value))} 
                          min={5} 
                          max={50} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-gray-500 mt-1 font-normal">
                        Points awarded to participants (5-50)
                      </FormMessage>
                    </FormItem>
                  )}
                />
                
                <div className="flex space-x-3 pt-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsCreateEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={createEventMutation.isPending}>
                    {createEventMutation.isPending ? "Creating..." : "Create Event"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        
        {/* Event Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-primary">{stats.total}</div>
            <div className="text-xs text-gray-500">Total Events</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-green-600">{stats.upcoming}</div>
            <div className="text-xs text-gray-500">Upcoming</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <div className="text-xl font-bold text-purple-600">{stats.rsvps}</div>
            <div className="text-xs text-gray-500">RSVPs</div>
          </div>
        </div>
        
        {/* Events List */}
        <section>
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Your Events</h2>
            <Select 
              defaultValue="all"
              onValueChange={(value) => setFilterStatus(value as "all" | "upcoming" | "past")}
            >
              <SelectTrigger className="w-[140px] h-8 text-sm">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="past">Past</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <>
              <EventSkeleton />
              <EventSkeleton />
            </>
          ) : filteredEvents && filteredEvents.length > 0 ? (
            filteredEvents.map((event) => {
              const eventDate = new Date(event.date);
              const isPast = eventDate < new Date();
              
              return (
                <Card key={event.id} className="mb-4 relative">
                  <div className={`absolute right-0 top-0 ${isPast ? 'bg-gray-500' : 'bg-green-500'} text-white text-xs px-2 py-1 font-medium`}>
                    {isPast ? 'Past' : 'Active'}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-medium">{event.title}</h3>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                      {format(new Date(event.date), "MMMM d, yyyy • h:mm a")}
                    </div>
                    
                    <div className="mt-1 flex items-start text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                      <span>{event.location}</span>
                    </div>
                    
                    <div className="mt-2 bg-gray-100 rounded-lg px-3 py-2 flex justify-between">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1 text-green-500" />
                        <span className="text-sm text-gray-700">0 RSVPs</span>
                      </div>
                      <div className="flex items-center">
                        <Award className="h-4 w-4 mr-1 text-primary" />
                        <span className="text-sm text-gray-700">{event.pointsValue} pts</span>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex space-x-2">
                      <Button variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      
                      {isPast ? (
                        <Button variant="outline" className="flex-1">
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                      ) : (
                        <Button variant="outline" className="flex-1">
                          <Users className="h-4 w-4 mr-1" />
                          View RSVPs
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No events found.</p>
                <p className="text-sm text-gray-400 mt-1">Click "Create New Event" to get started!</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </OrganizerLayout>
  );
}

const EventSkeleton = () => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <Skeleton className="h-6 w-3/4 mb-3" />
      
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-3" />
      
      <Skeleton className="h-10 w-full mb-3 rounded" />
      
      <div className="flex space-x-2">
        <Skeleton className="h-9 flex-1 rounded" />
        <Skeleton className="h-9 flex-1 rounded" />
      </div>
    </CardContent>
  </Card>
);
