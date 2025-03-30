import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import UserLayout from "@/components/layouts/user-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Star, BookmarkIcon, Settings, Edit, LogOut } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  bio: z.string(),
  interests: z.string(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function UserProfile() {
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || "",
      bio: user?.bio || "",
      interests: user?.interests || "",
    },
  });
  
  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const updatedUser = await apiRequest("PUT", "/api/user/profile", data);
      queryClient.setQueryData(["/api/user"], updatedUser);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <UserLayout title="My Profile">
      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-5 text-center">
            <div className="relative inline-block">
              <Avatar className="w-24 h-24 mx-auto">
                <AvatarFallback className="bg-primary text-white text-xl">
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <Button variant="default" size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8">
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            
            <h2 className="text-xl font-bold mt-3">{user?.name}</h2>
            <p className="text-gray-500 mt-1">{user?.email}</p>
            
            <Badge variant="secondary" className="mt-3 bg-blue-100 text-blue-800 hover:bg-blue-100">
              <Star className="mr-1 h-3 w-3" />
              <span>{user?.points || 0} points</span>
            </Badge>
          </CardContent>
        </Card>
        
        {/* Edit Profile */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-lg mb-4">Edit Profile</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={3} 
                          placeholder="Interested in environmental conservation and community building. I enjoy participating in local events and making a positive impact."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Environment, Education, Community" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-gray-500 mt-1 font-normal">
                        Separate interests with commas
                      </FormMessage>
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full">
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Activity */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-lg mb-4">Activity</h3>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">You joined <strong>Community Connect</strong></p>
                  <p className="text-xs text-gray-500">
                    {user?.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString("en-US", { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }) 
                      : "Recently"}
                  </p>
                </div>
                <span className="text-xs font-medium text-green-600">+5 pts</span>
              </div>
              
              <div className="flex items-start">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <BookmarkIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm">Complete your profile to earn more points</p>
                  <p className="text-xs text-gray-500">Add a bio and interests</p>
                </div>
                <span className="text-xs font-medium text-green-600">+10 pts</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full py-3" 
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    </UserLayout>
  );
}
