import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { insertUserSchema, insertOrganizerSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, User, Building2, Mail, Lock, Globe } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// User registration schema for regular users
const userSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  bio: z.string().optional(),
  interests: z.string().optional(),
  isOrganizer: z.literal(false).default(false),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Organizer registration schema with organization data
const organizerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Please provide a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  bio: z.string().optional(),
  interests: z.string().optional(),
  isOrganizer: z.literal(true).default(true),
  organization: z.object({
    name: z.string().min(2, "Organization name is required"),
    description: z.string().min(10, "Please provide a description"),
    website: z.string().optional(),
    email: z.string().email("Please provide a valid email").optional(),
    categories: z.string().optional(),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type UserFormValues = z.infer<typeof userSchema>;
type OrganizerFormValues = z.infer<typeof organizerSchema>;

export default function AuthPage() {
  const [authType, setAuthType] = useState<"login" | "register">("login");
  const [registerType, setRegisterType] = useState<"user" | "organizer">("user");
  
  const { user, loginMutation, registerUserMutation, registerOrganizerMutation } = useAuth();
  
  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // User registration form
  const userForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      bio: "",
      interests: "",
      isOrganizer: false,
    },
  });

  // Organizer registration form
  const organizerForm = useForm<OrganizerFormValues>({
    resolver: zodResolver(organizerSchema),
    defaultValues: {
      name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      bio: "",
      interests: "",
      isOrganizer: true,
      organization: {
        name: "",
        description: "",
        website: "",
        email: "",
        categories: "",
      },
    },
  });

  // Form submission handlers
  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onUserRegisterSubmit = (data: UserFormValues) => {
    registerUserMutation.mutate(data);
  };

  const onOrganizerRegisterSubmit = (data: OrganizerFormValues) => {
    registerOrganizerMutation.mutate(data);
  };
  
  // Redirect if user is already logged in
  if (user) {
    return user.isOrganizer ? <Redirect to="/organizer" /> : <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Auth forms */}
      <div className="flex-1 flex flex-col justify-center p-6 md:p-10">
        <div className="w-full max-w-md mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Globe className="h-8 w-8 text-white" />
            </div>
            <div className="ml-4">
              <h1 className="text-2xl font-bold">Civvy</h1>
              <p className="text-gray-500">Connect with local organizations</p>
            </div>
          </div>

          <Tabs defaultValue={authType} onValueChange={(v) => setAuthType(v as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Card>
                <CardContent className="pt-6">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input className="pl-10" placeholder="johndoe" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                <Input className="pl-10" type="password" placeholder="••••••••" {...field} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        Login
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Forms */}
            <TabsContent value="register">
              <Card>
                <CardContent className="pt-6">
                  {/* Toggle between user and organizer registration */}
                  <div className="flex mb-6">
                    <Button
                      type="button"
                      variant={registerType === "user" ? "default" : "outline"}
                      className="flex-1 rounded-r-none"
                      onClick={() => setRegisterType("user")}
                    >
                      Regular User
                    </Button>
                    <Button
                      type="button"
                      variant={registerType === "organizer" ? "default" : "outline"}
                      className="flex-1 rounded-l-none"
                      onClick={() => setRegisterType("organizer")}
                    >
                      Community Organizer
                    </Button>
                  </div>

                  {/* User Registration Form */}
                  {registerType === "user" && (
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit(onUserRegisterSubmit)} className="space-y-4">
                        <FormField
                          control={userForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input className="pl-10" placeholder="John Doe" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input className="pl-10" placeholder="john@example.com" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={userForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={userForm.control}
                          name="bio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio (Optional)</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Tell us about yourself..." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="interests"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Interests (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Environment, Education, Community" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerUserMutation.isPending}
                        >
                          {registerUserMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Create Account
                        </Button>
                      </form>
                    </Form>
                  )}

                  {/* Organizer Registration Form */}
                  {registerType === "organizer" && (
                    <Form {...organizerForm}>
                      <form onSubmit={organizerForm.handleSubmit(onOrganizerRegisterSubmit)} className="space-y-4">
                        <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                        <FormField
                          control={organizerForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input className="pl-10" placeholder="John Doe" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={organizerForm.control}
                          name="username"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Username</FormLabel>
                              <FormControl>
                                <Input placeholder="johndoe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={organizerForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                                  <Input className="pl-10" placeholder="john@example.com" {...field} />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={organizerForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={organizerForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password</FormLabel>
                                <FormControl>
                                  <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <Separator className="my-4" />
                        
                        <h3 className="text-lg font-medium mb-2">Organization Information</h3>
                        <FormField
                          control={organizerForm.control}
                          name="organization.name"
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
                          control={organizerForm.control}
                          name="organization.description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Organization Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your organization's mission and focus..."
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={organizerForm.control}
                          name="organization.categories"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Categories</FormLabel>
                              <FormControl>
                                <Input placeholder="Environment, Conservation, Volunteering" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={organizerForm.control}
                            name="organization.website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website (Optional)</FormLabel>
                                <FormControl>
                                  <Input placeholder="https://example.org" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={organizerForm.control}
                            name="organization.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Organization Email</FormLabel>
                                <FormControl>
                                  <Input placeholder="info@organization.org" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <Button
                          type="submit"
                          className="w-full"
                          disabled={registerOrganizerMutation.isPending}
                        >
                          {registerOrganizerMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Create Organization Account
                        </Button>
                      </form>
                    </Form>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Hero section */}
      <div className="hidden md:flex flex-1 bg-primary text-white p-10 flex-col justify-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-3xl font-bold mb-4">Connect with your community</h2>
          <p className="text-lg opacity-90 mb-6">
            Join Community Connect to discover local organizations, participate in events, and make a positive impact in your community.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">For Regular Users</h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2 text-xs">✓</div>
                  Find local community organizations
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2 text-xs">✓</div>
                  Track upcoming events
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2 text-xs">✓</div>
                  Earn points for participation
                </li>
              </ul>
            </div>
            <div className="bg-white/10 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">For Organizers</h3>
              <ul className="space-y-2 text-sm opacity-90">
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2 text-xs">✓</div>
                  Create and manage events
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2 text-xs">✓</div>
                  Build your community presence
                </li>
                <li className="flex items-center">
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center mr-2 text-xs">✓</div>
                  Connect with volunteers
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
