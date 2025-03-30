import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import OrganizerLayout from "@/components/layouts/organizer-layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Organization } from "@shared/schema";
import { Building2, Users, Calendar, Edit, Globe, Mail, X, Plus, BarChart } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Organization profile form schema
const organizationFormSchema = z.object({
  name: z.string().min(2, "Organization name is required"),
  description: z.string().min(10, "Please provide a description"),
  website: z.string().optional(),
  email: z.string().email("Please provide a valid email").optional(),
  categories: z.string(),
});

type OrganizationFormValues = z.infer<typeof organizationFormSchema>;

export default function OrganizerProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newCategory, setNewCategory] = useState("");
  
  // Fetch organization data
  const { data: organization, isLoading } = useQuery<Organization>({
    queryKey: ["/api/organizations/user", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID not found");
      const res = await fetch(`/api/organizations?organizerId=${user.id}`, { 
        credentials: "include" 
      });
      if (!res.ok) throw new Error("Failed to fetch organization");
      const organizations = await res.json();
      return organizations.length > 0 ? organizations[0] : null;
    },
    enabled: !!user,
  });
  
  // Organization profile form
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: organization?.name || "",
      description: organization?.description || "",
      website: organization?.website || "",
      email: organization?.email || "",
      categories: organization?.categories || "",
    },
  });
  
  // Update when organization data is loaded
  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        description: organization.description,
        website: organization.website || "",
        email: organization.email || "",
        categories: organization.categories || "",
      });
    }
  }, [organization, form]);
  
  // Update organization mutation
  const updateOrgMutation = useMutation({
    mutationFn: async (data: OrganizationFormValues) => {
      if (!organization?.id) throw new Error("Organization ID not found");
      const response = await apiRequest("PUT", `/api/organizations/${organization.id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization updated",
        description: "Your organization profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/user", user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: OrganizationFormValues) => {
    updateOrgMutation.mutate(data);
  };
  
  // Handle category actions
  const addCategory = () => {
    if (!newCategory.trim()) return;
    
    const currentCategories = form.getValues("categories");
    const categoriesArray = currentCategories ? currentCategories.split(",").map(c => c.trim()) : [];
    
    if (!categoriesArray.includes(newCategory.trim())) {
      const updatedCategories = [...categoriesArray, newCategory.trim()].join(", ");
      form.setValue("categories", updatedCategories);
    }
    
    setNewCategory("");
  };
  
  const removeCategory = (categoryToRemove: string) => {
    const currentCategories = form.getValues("categories");
    const categoriesArray = currentCategories.split(",").map(c => c.trim());
    const updatedCategories = categoriesArray.filter(c => c !== categoryToRemove).join(", ");
    form.setValue("categories", updatedCategories);
  };
  
  // Parse categories into array
  const categoriesArray = organization?.categories 
    ? organization.categories.split(",").map(c => c.trim()).filter(Boolean)
    : [];

  return (
    <OrganizerLayout title="Organization Profile">
      <div className="p-4 space-y-6">
        {/* Organization Profile Card */}
        {isLoading ? (
          <Card>
            <div className="h-32 bg-gray-200"></div>
            <CardContent className="px-5 pb-5 pt-14 relative">
              <Skeleton className="absolute -top-12 left-1/2 transform -translate-x-1/2 w-24 h-24 rounded-full" />
              <Skeleton className="h-7 w-3/4 mx-auto mb-2" />
              <Skeleton className="h-5 w-2/3 mx-auto mb-3" />
              <div className="flex justify-center gap-3">
                <Skeleton className="h-8 w-28 rounded-full" />
                <Skeleton className="h-8 w-28 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="h-32 bg-primary"></div>
            <CardContent className="px-5 pb-5 pt-16 relative">
              <div className="absolute -top-12 left-1/2 transform -translate-x-1/2">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-white overflow-hidden">
                    <Building2 className="h-12 w-12 text-primary" />
                  </div>
                  <Button variant="default" size="icon" className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 rounded-full h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-center">
                <h2 className="text-xl font-bold">{organization?.name}</h2>
                <p className="text-gray-500 mt-1">
                  {organization?.description && organization.description.length > 60
                    ? `${organization.description.substring(0, 60)}...`
                    : organization?.description}
                </p>
                
                <div className="flex justify-center mt-3 space-x-3">
                  <Badge variant="secondary" className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 h-auto">
                    <Users className="h-3 w-3 mr-1" />
                    {organization?.followers || 0} followers
                  </Badge>
                  <Badge variant="secondary" className="flex items-center bg-green-100 text-green-800 px-3 py-1 h-auto">
                    <Calendar className="h-3 w-3 mr-1" />
                    0 events
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Edit Organization Profile */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-lg mb-4">Edit Organization Profile</h3>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input className="pl-10" placeholder="Green Earth Initiative" {...field} />
                        </div>
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
                          rows={3} 
                          placeholder="We are dedicated to promoting environmental conservation through education, advocacy, and community action."
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Globe className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input className="pl-10" placeholder="https://organization.org" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                          <Input className="pl-10" placeholder="info@organization.org" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="categories"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Categories</FormLabel>
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {field.value.split(',').map((category, index) => {
                            const trimmedCategory = category.trim();
                            if (!trimmedCategory) return null;
                            
                            const bgColors = ["green", "blue", "purple", "yellow", "red"];
                            const colorIndex = index % bgColors.length;
                            const bgColor = bgColors[colorIndex];
                            
                            const getColorClass = (color: string) => {
                              switch (color) {
                                case "green": return "bg-green-100 text-green-800";
                                case "blue": return "bg-blue-100 text-blue-800";
                                case "purple": return "bg-purple-100 text-purple-800";
                                case "yellow": return "bg-yellow-100 text-yellow-800";
                                case "red": return "bg-red-100 text-red-800";
                                default: return "bg-gray-100 text-gray-800";
                              }
                            };
                            
                            return (
                              <Badge 
                                key={index}
                                variant="outline"
                                className={`px-3 py-1.5 h-auto text-sm ${getColorClass(bgColor)} flex items-center`}
                              >
                                {trimmedCategory}
                                <button 
                                  type="button" 
                                  className="ml-1.5"
                                  onClick={() => removeCategory(trimmedCategory)}
                                >
                                  <X className={`h-3 w-3 text-${bgColor}-800`} />
                                </button>
                              </Badge>
                            );
                          })}
                          <div className="flex items-center">
                            <Input
                              placeholder="Add category"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="w-32 h-8"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={addCategory}
                              className="ml-1"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <input type="hidden" {...field} />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={updateOrgMutation.isPending}
                >
                  {updateOrgMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        
        {/* Analytics */}
        <Card>
          <CardContent className="p-5">
            <h3 className="font-semibold text-lg mb-4">Analytics</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Profile Views</span>
                  <span className="text-sm text-gray-500">This month</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-md overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "0%" }}></div>
                </div>
                <div className="mt-1 text-sm text-gray-500">0 views this month</div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Event Attendance</span>
                  <span className="text-sm text-gray-500">Overall rate</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-md overflow-hidden">
                  <div className="h-full bg-purple-600" style={{ width: "0%" }}></div>
                </div>
                <div className="mt-1 text-sm text-gray-500">No attendance data yet</div>
              </div>
              
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">New Followers</span>
                  <span className="text-sm text-gray-500">This month</span>
                </div>
                <div className="h-8 bg-gray-200 rounded-md overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: "0%" }}></div>
                </div>
                <div className="mt-1 text-sm text-gray-500">0 new followers this month</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OrganizerLayout>
  );
}
