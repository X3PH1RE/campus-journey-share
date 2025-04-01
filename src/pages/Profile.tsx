
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2Icon, StarIcon, BookOpenIcon, GraduationCapIcon, PhoneIcon, MailIcon } from 'lucide-react';
import { VehicleInfo } from '@/lib/supabase';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const Profile = () => {
  const { user, profile, isLoading } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    phoneNumber: profile?.phone_number || '',
    collegeName: '',
    collegeYear: '',
    courseMajor: '',
    studentId: '',
    bio: '',
    // Two-wheeler info
    vehicleMake: '',
    vehicleModel: '',
    vehicleColor: '',
    vehiclePlate: '',
    vehicleYear: '',
    vehicleType: 'Scooter',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (profile?.vehicle_info) {
      try {
        const vehicleInfo = profile.vehicle_info as unknown as VehicleInfo;
        setFormData(prev => ({
          ...prev,
          vehicleMake: vehicleInfo.make || '',
          vehicleModel: vehicleInfo.model || '',
          vehicleColor: vehicleInfo.color || '',
          vehiclePlate: vehicleInfo.plate || '',
          vehicleYear: vehicleInfo.year || '',
          vehicleType: vehicleInfo.type || 'Scooter',
        }));
      } catch (error) {
        console.error('Error parsing vehicle info:', error);
      }
    }

    if (profile?.college_info) {
      try {
        const collegeInfo = profile.college_info as any;
        setFormData(prev => ({
          ...prev,
          collegeName: collegeInfo.name || '',
          collegeYear: collegeInfo.year || '',
          courseMajor: collegeInfo.major || '',
          studentId: collegeInfo.student_id || '',
          bio: profile.bio || '',
        }));
      } catch (error) {
        console.error('Error parsing college info:', error);
      }
    }
  }, [profile]);

  // Redirect to auth if not logged in
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen hailo-bg-pattern">
        <div className="hailo-gradient p-8 rounded-xl shadow-lg">
          <Loader2Icon className="h-12 w-12 animate-spin text-white mx-auto" />
          <p className="text-white mt-4 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          bio: formData.bio,
          college_info: {
            name: formData.collegeName,
            year: formData.collegeYear,
            major: formData.courseMajor,
            student_id: formData.studentId,
          },
          vehicle_info: {
            make: formData.vehicleMake,
            model: formData.vehicleModel,
            color: formData.vehicleColor,
            plate: formData.vehiclePlate,
            year: formData.vehicleYear,
            type: formData.vehicleType,
          },
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Your Hailo Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your personal information and vehicle details</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 hailo-card">
              <CardHeader className="hailo-gradient text-white rounded-t-lg">
                <CardTitle className="text-center">Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center pt-6">
                <Avatar className="h-28 w-28 mb-4 ring-4 ring-primary/20">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center mb-4">
                  <h3 className="font-medium text-xl">{profile?.full_name || "Complete Your Profile"}</h3>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>
                
                <div className="w-full space-y-4 mt-2">
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted">
                    <PhoneIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profile?.phone_number || "Add phone number"}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted">
                    <MailIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user?.email}</span>
                  </div>
                  
                  {profile?.is_driver && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted">
                      <StarIcon className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">
                        {profile.rating ? `${profile.rating} / 5` : "No ratings yet"} 
                        <span className="text-muted-foreground ml-1">({profile.total_rides || 0} rides)</span>
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2 hailo-card">
              <Tabs defaultValue="personal" onValueChange={setActiveTab} className="w-full">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle>Edit Profile</CardTitle>
                    <TabsList className="grid w-full sm:w-auto grid-cols-2">
                      <TabsTrigger value="personal">Personal Info</TabsTrigger>
                      <TabsTrigger value="vehicle">Two-Wheeler Details</TabsTrigger>
                    </TabsList>
                  </div>
                  <CardDescription>
                    {activeTab === 'personal' 
                      ? 'Update your personal and college information'
                      : 'Update your two-wheeler details for ride sharing'}
                  </CardDescription>
                </CardHeader>
                
                <form onSubmit={handleSubmit}>
                  <TabsContent value="personal" className="m-0">
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          placeholder="Your full name"
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="+91 98765 43210"
                          className="border-primary/20 focus:border-primary"
                        />
                      </div>
                      
                      <div className="pt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <GraduationCapIcon className="h-5 w-5 text-primary" />
                          <h3 className="text-sm font-medium">College Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="collegeName">College Name</Label>
                            <Input
                              id="collegeName"
                              name="collegeName"
                              value={formData.collegeName}
                              onChange={handleInputChange}
                              placeholder="Your college"
                              className="border-primary/20 focus:border-primary"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="collegeYear">Year of Study</Label>
                            <Select
                              value={formData.collegeYear}
                              onValueChange={(value) => handleSelectChange('collegeYear', value)}
                            >
                              <SelectTrigger id="collegeYear" className="border-primary/20 focus:border-primary">
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">First Year</SelectItem>
                                <SelectItem value="2">Second Year</SelectItem>
                                <SelectItem value="3">Third Year</SelectItem>
                                <SelectItem value="4">Fourth Year</SelectItem>
                                <SelectItem value="5+">Fifth+ Year</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="courseMajor">Course/Major</Label>
                            <Input
                              id="courseMajor"
                              name="courseMajor"
                              value={formData.courseMajor}
                              onChange={handleInputChange}
                              placeholder="Your major"
                              className="border-primary/20 focus:border-primary"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="studentId">Student ID</Label>
                            <Input
                              id="studentId"
                              name="studentId"
                              value={formData.studentId}
                              onChange={handleInputChange}
                              placeholder="Student ID number"
                              className="border-primary/20 focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea
                          id="bio"
                          name="bio"
                          value={formData.bio}
                          onChange={handleInputChange}
                          placeholder="Tell others a bit about yourself..."
                          className="border-primary/20 focus:border-primary resize-none h-20"
                        />
                      </div>
                    </CardContent>
                  </TabsContent>
                  
                  <TabsContent value="vehicle" className="m-0">
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vehicleType">Vehicle Type</Label>
                          <Select 
                            value={formData.vehicleType}
                            onValueChange={(value) => handleSelectChange('vehicleType', value)}
                          >
                            <SelectTrigger id="vehicleType" className="border-primary/20 focus:border-primary">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Scooter">Scooter</SelectItem>
                              <SelectItem value="Motorcycle">Motorcycle</SelectItem>
                              <SelectItem value="Electric">Electric Two-Wheeler</SelectItem>
                              <SelectItem value="Moped">Moped</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vehicleMake">Make/Brand</Label>
                          <Input
                            id="vehicleMake"
                            name="vehicleMake"
                            value={formData.vehicleMake}
                            onChange={handleInputChange}
                            placeholder="Honda, TVS, etc."
                            className="border-primary/20 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vehicleModel">Model</Label>
                          <Input
                            id="vehicleModel"
                            name="vehicleModel"
                            value={formData.vehicleModel}
                            onChange={handleInputChange}
                            placeholder="Activa, Apache, etc."
                            className="border-primary/20 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vehicleYear">Year</Label>
                          <Input
                            id="vehicleYear"
                            name="vehicleYear"
                            value={formData.vehicleYear}
                            onChange={handleInputChange}
                            placeholder="Manufacturing year"
                            className="border-primary/20 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vehicleColor">Color</Label>
                          <Input
                            id="vehicleColor"
                            name="vehicleColor"
                            value={formData.vehicleColor}
                            onChange={handleInputChange}
                            placeholder="Vehicle color"
                            className="border-primary/20 focus:border-primary"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="vehiclePlate">License Plate</Label>
                          <Input
                            id="vehiclePlate"
                            name="vehiclePlate"
                            value={formData.vehiclePlate}
                            onChange={handleInputChange}
                            placeholder="Registration number"
                            className="border-primary/20 focus:border-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="px-4 py-3 bg-muted rounded-lg mt-4">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Note:</span> Vehicle details are required for drivers. This information helps riders identify you and your vehicle when you arrive.
                        </p>
                      </div>
                    </CardContent>
                  </TabsContent>
                  
                  <CardFooter>
                    <Button 
                      type="submit" 
                      disabled={isUpdating}
                      className="w-full sm:w-auto hailo-btn-gradient"
                    >
                      {isUpdating ? (
                        <>
                          <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                          Saving Changes...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
