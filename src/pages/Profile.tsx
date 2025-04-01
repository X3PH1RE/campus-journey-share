
import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BikeIcon, BadgeIcon, GraduationCapIcon, PhoneIcon, StarIcon, UserIcon } from 'lucide-react';
import { UserProfile, VehicleInfo, CollegeInfo } from '@/types/profile';

const Profile = () => {
  const { user, profile, updateProfile } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    full_name: profile?.full_name || '',
    phone_number: profile?.phone_number || '',
    bio: profile?.bio || '',
    college_info: profile?.college_info as CollegeInfo || {
      name: '',
      student_id: '',
      department: '',
      year_of_study: '',
    },
    vehicle_info: profile?.vehicle_info as VehicleInfo || {
      make: '',
      model: '',
      year: '',
      type: '',
      license_plate: '',
      color: '',
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData({
        ...formData,
        [section]: {
          ...(formData as any)[section],
          [field]: value,
        },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSave = async () => {
    try {
      if (updateProfile) {
        await updateProfile(formData);
      }
      setIsEditMode(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const vehicleInfo = profile?.vehicle_info as VehicleInfo;
  const collegeInfo = profile?.college_info as CollegeInfo;

  return (
    <MainLayout>
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card className="hailo-card">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24 ring-4 ring-primary/20">
                    <AvatarImage src={profile?.avatar_url || ''} alt={profile?.username} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle>{profile?.full_name || user?.email?.split('@')[0]}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-1">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  {profile?.rating || '5.0'} ({profile?.total_rides || '0'} rides)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <UserIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">{profile?.username || user?.email?.split('@')[0]}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <PhoneIcon className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone Number</p>
                    <p className="font-medium">{profile?.phone_number || 'Not provided'}</p>
                  </div>
                </div>
                {profile?.bio && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">About</p>
                    <p className="text-sm">{profile.bio}</p>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button className="w-full hailo-btn-gradient" onClick={() => setIsEditMode(true)}>
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-2 space-y-6">
            {isEditMode ? (
              <Card className="hailo-card">
                <CardHeader>
                  <CardTitle>Edit Profile</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone_number">Phone Number</Label>
                        <Input
                          id="phone_number"
                          name="phone_number"
                          value={formData.phone_number || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        value={formData.bio || ''}
                        onChange={handleInputChange}
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-medium flex items-center gap-2">
                      <GraduationCapIcon className="h-5 w-5 text-primary" />
                      College Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="college_info.name">College Name</Label>
                        <Input
                          id="college_info.name"
                          name="college_info.name"
                          value={(formData.college_info as CollegeInfo)?.name || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="college_info.student_id">Student ID</Label>
                        <Input
                          id="college_info.student_id"
                          name="college_info.student_id"
                          value={(formData.college_info as CollegeInfo)?.student_id || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="college_info.department">Department</Label>
                        <Input
                          id="college_info.department"
                          name="college_info.department"
                          value={(formData.college_info as CollegeInfo)?.department || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="college_info.year_of_study">Year of Study</Label>
                        <Input
                          id="college_info.year_of_study"
                          name="college_info.year_of_study"
                          value={(formData.college_info as CollegeInfo)?.year_of_study || ''}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                  </div>

                  {profile?.is_driver && (
                    <div className="space-y-4 border-t pt-6">
                      <h3 className="text-lg font-medium flex items-center gap-2">
                        <BikeIcon className="h-5 w-5 text-primary" />
                        Vehicle Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_info.make">Vehicle Make</Label>
                          <Input
                            id="vehicle_info.make"
                            name="vehicle_info.make"
                            value={(formData.vehicle_info as VehicleInfo)?.make || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_info.model">Vehicle Model</Label>
                          <Input
                            id="vehicle_info.model"
                            name="vehicle_info.model"
                            value={(formData.vehicle_info as VehicleInfo)?.model || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_info.year">Year</Label>
                          <Input
                            id="vehicle_info.year"
                            name="vehicle_info.year"
                            value={(formData.vehicle_info as VehicleInfo)?.year || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_info.type">Type</Label>
                          <Input
                            id="vehicle_info.type"
                            name="vehicle_info.type"
                            value={(formData.vehicle_info as VehicleInfo)?.type || ''}
                            onChange={handleInputChange}
                            placeholder="Scooter, Motorcycle, etc."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_info.license_plate">License Plate</Label>
                          <Input
                            id="vehicle_info.license_plate"
                            name="vehicle_info.license_plate"
                            value={(formData.vehicle_info as VehicleInfo)?.license_plate || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vehicle_info.color">Vehicle Color</Label>
                          <Input
                            id="vehicle_info.color"
                            name="vehicle_info.color"
                            value={(formData.vehicle_info as VehicleInfo)?.color || ''}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsEditMode(false)}>Cancel</Button>
                  <Button className="hailo-btn-gradient" onClick={handleSave}>Save Changes</Button>
                </CardFooter>
              </Card>
            ) : (
              <>
                {collegeInfo && Object.values(collegeInfo).some(val => val) && (
                  <Card className="hailo-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <GraduationCapIcon className="h-5 w-5 text-primary" />
                        College Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {collegeInfo.name && (
                        <div>
                          <p className="text-sm text-muted-foreground">College Name</p>
                          <p className="font-medium">{collegeInfo.name}</p>
                        </div>
                      )}
                      {collegeInfo.student_id && (
                        <div>
                          <p className="text-sm text-muted-foreground">Student ID</p>
                          <p className="font-medium">{collegeInfo.student_id}</p>
                        </div>
                      )}
                      {collegeInfo.department && (
                        <div>
                          <p className="text-sm text-muted-foreground">Department</p>
                          <p className="font-medium">{collegeInfo.department}</p>
                        </div>
                      )}
                      {collegeInfo.year_of_study && (
                        <div>
                          <p className="text-sm text-muted-foreground">Year of Study</p>
                          <p className="font-medium">{collegeInfo.year_of_study}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {profile?.is_driver && vehicleInfo && Object.values(vehicleInfo).some(val => val) && (
                  <Card className="hailo-card">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BikeIcon className="h-5 w-5 text-primary" />
                        Vehicle Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vehicleInfo.make && (
                        <div>
                          <p className="text-sm text-muted-foreground">Vehicle Make</p>
                          <p className="font-medium">{vehicleInfo.make}</p>
                        </div>
                      )}
                      {vehicleInfo.model && (
                        <div>
                          <p className="text-sm text-muted-foreground">Vehicle Model</p>
                          <p className="font-medium">{vehicleInfo.model}</p>
                        </div>
                      )}
                      {vehicleInfo.year && (
                        <div>
                          <p className="text-sm text-muted-foreground">Year</p>
                          <p className="font-medium">{vehicleInfo.year}</p>
                        </div>
                      )}
                      {vehicleInfo.type && (
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">{vehicleInfo.type}</p>
                        </div>
                      )}
                      {vehicleInfo.license_plate && (
                        <div>
                          <p className="text-sm text-muted-foreground">License Plate</p>
                          <p className="font-medium">{vehicleInfo.license_plate}</p>
                        </div>
                      )}
                      {vehicleInfo.color && (
                        <div>
                          <p className="text-sm text-muted-foreground">Vehicle Color</p>
                          <p className="font-medium">{vehicleInfo.color}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                <Card className="hailo-card">
                  <CardHeader>
                    <CardTitle>Ride History</CardTitle>
                    <CardDescription>View your past rides</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <BikeIcon className="mx-auto h-12 w-12 mb-3 text-primary/40" />
                      <p className="text-lg font-medium">No ride history yet</p>
                      <p className="text-sm">Your completed rides will appear here</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;
