
import React, { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile, uploadProfilePhoto } from "@/api/user";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  User as UserIcon, Briefcase, Shield, Camera,
  Save, Loader2, AlertCircle, CheckCircle2, Trash2, X
} from "lucide-react";
import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const COMMON_SKILLS = [
  "Leadership", "Communication", "Problem-Solving", "Teamwork", "Adaptability",
  "Project Management", "Data Analysis", "Strategic Thinking", "Creativity",
  "Technical Skills", "Presentation", "Negotiation", "Time Management",
  "Customer Service", "Conflict Resolution", "Mentoring", "Agile/Scrum"
];

const TIMEZONES = [
  "(UTC-12:00) Baker Island",
  "(UTC-11:00) American Samoa, Niue",
  "(UTC-10:00) Hawaii, Tahiti",
  "(UTC-09:30) Marquesas Islands",
  "(UTC-09:00) Alaska",
  "(UTC-08:00) Pacific Time (Los Angeles, Vancouver)",
  "(UTC-07:00) Mountain Time (Denver, Calgary)",
  "(UTC-06:00) Central Time (Chicago, Mexico City)",
  "(UTC-05:00) Eastern Time (New York, Toronto)",
  "(UTC-04:00) Atlantic Time (Halifax, Caracas)",
  "(UTC-03:30) Newfoundland",
  "(UTC-03:00) Buenos Aires, São Paulo",
  "(UTC-02:00) South Georgia",
  "(UTC-01:00) Azores, Cape Verde",
  "(UTC±00:00) Greenwich Mean Time (London, Reykjavik)",
  "(UTC+01:00) Central Europe (Berlin, Paris, Rome, Madrid)",
  "(UTC+02:00) Eastern Europe (Athens, Bucharest, Cairo, Johannesburg)",
  "(UTC+03:00) Moscow, Nairobi, Riyadh",
  "(UTC+03:30) Tehran",
  "(UTC+04:00) Dubai, Baku, Tbilisi",
  "(UTC+04:30) Kabul",
  "(UTC+05:00) Pakistan (Islamabad, Karachi)",
  "(UTC+05:30) India (New Delhi, Mumbai)",
  "(UTC+05:45) Nepal (Kathmandu)",
  "(UTC+06:00) Bangladesh (Dhaka), Almaty",
  "(UTC+06:30) Yangon (Myanmar)",
  "(UTC+07:00) Thailand (Bangkok), Vietnam, Jakarta",
  "(UTC+08:00) Singapore, Kuala Lumpur, Hong Kong, Beijing, Perth",
  "(UTC+09:00) Tokyo, Seoul",
  "(UTC+09:30) Darwin, Adelaide",
  "(UTC+10:00) Sydney, Melbourne, Port Moresby, Vladivostok",
  "(UTC+10:30) Lord Howe Island",
  "(UTC+11:00) Solomon Islands, New Caledonia",
  "(UTC+12:00) New Zealand, Fiji",
  "(UTC+12:45) Chatham Islands",
  "(UTC+13:00) Tonga, Samoa (DST)",
  "(UTC+14:00) Line Islands (Kiribati)"
];

const INDUSTRIES = [
  "Technology / Software",
  "Financial Services / Banking",
  "Healthcare / Pharmaceuticals",
  "Retail / E-commerce",
  "Manufacturing / Engineering",
  "Consulting / Professional Services",
  "Education / Training",
  "Media / Entertainment",
  "Telecommunications",
  "Energy / Utilities",
  "Real Estate / Property",
  "Transportation / Logistics",
  "Hospitality / Tourism",
  "Government / Public Sector",
  "Non-Profit / Charity",
  "Marketing / Advertising",
  "Legal Services",
  "Insurance",
  "Automotive",
  "Aerospace / Defence",
  "Construction",
  "Agriculture / Food",
  "Fashion / Apparel",
  "Sports / Fitness",
  "Other"
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await getUserProfile();

        let userToSet = currentUser;
        // Set default timezone to Singapore if not set
        if (!currentUser.timezone) {
          userToSet = { ...currentUser, timezone: "(UTC+08:00) Singapore, Kuala Lumpur, Hong Kong, Beijing, Perth" };
        }
        setUser(userToSet);

      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const updateProfileMutation = useMutation({
    mutationFn: (data) => updateUserProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['userProfile']);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { profile_photo_url } = await uploadProfilePhoto(file);
      setProfilePhoto(profile_photo_url);
      await updateProfileMutation.mutateAsync({ profile_photo_url });
    } catch (error) {
      console.error("Error uploading photo:", error);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = () => {
    updateProfileMutation.mutate(user);
  };

  const handleAddSkill = (skill) => {
    if (!user.key_skills) user.key_skills = [];
    if (!user.key_skills.includes(skill)) {
      setUser({ ...user, key_skills: [...user.key_skills, skill] });
    }
  };

  const handleRemoveSkill = (skill) => {
    setUser({
      ...user,
      key_skills: user.key_skills.filter(s => s !== skill)
    });
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !user.key_skills?.includes(customSkill.trim())) {
      handleAddSkill(customSkill.trim());
      setCustomSkill("");
    }
  };

  const handleDeactivateAccount = async () => {
    alert("Account deactivation requested. Please contact support to complete this process.");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              My Account
            </span>
          </h1>
          <p className="text-xl text-gray-600">Manage your profile and account settings</p>
        </motion.div>

        {saveStatus === 'success' && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <AlertDescription className="text-green-900">
              Profile updated successfully!
            </AlertDescription>
          </Alert>
        )}

        {saveStatus === 'error' && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <AlertDescription className="text-red-900">
              Failed to update profile. Please try again.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-none shadow-xl mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-purple-50">
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-purple-600" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center overflow-hidden">
                  {(profilePhoto || user?.profile_photo_url) ? (
                    <img
                      src={profilePhoto || user.profile_photo_url}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-bold text-3xl">
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <label
                  htmlFor="photo-upload"
                  className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4 text-white" />
                  )}
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Profile Photo</p>
                <p className="text-xs text-gray-500">
                  Upload a profile photo. JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  value={user?.full_name || ''}
                  onChange={(e) => setUser({ ...user, full_name: e.target.value })}
                  placeholder="John Tan"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={user?.mobile_number || ''}
                  onChange={(e) => setUser({ ...user, mobile_number: e.target.value })}
                  placeholder="+65 9123 4567"
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={user?.country || ''}
                  onChange={(e) => setUser({ ...user, country: e.target.value })}
                  placeholder="Singapore"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timezone">Time Zone</Label>
                <Select
                  value={user?.timezone || ''}
                  onValueChange={(value) => setUser({ ...user, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time zone" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="linkedin">LinkedIn Profile URL</Label>
                <Input
                  id="linkedin"
                  type="url"
                  value={user?.linkedin_url || ''}
                  onChange={(e) => setUser({ ...user, linkedin_url: e.target.value })}
                  placeholder="https://linkedin.com/in/yourname"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {updateProfileMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Career & Learning Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="current_role">Current Role / Job Title</Label>
                <Input
                  id="current_role"
                  value={user?.current_role || ''}
                  onChange={(e) => setUser({ ...user, current_role: e.target.value })}
                  placeholder="Senior Product Manager"
                />
              </div>
              <div>
                <Label htmlFor="years_experience">Years of Experience</Label>
                <Select
                  value={user?.years_experience || ''}
                  onValueChange={(value) => setUser({ ...user, years_experience: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-2">0-2 years</SelectItem>
                    <SelectItem value="3-5">3-5 years</SelectItem>
                    <SelectItem value="6-10">6-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target_role">Target Role / Desired Position</Label>
                <Input
                  id="target_role"
                  value={user?.target_role || ''}
                  onChange={(e) => setUser({ ...user, target_role: e.target.value })}
                  placeholder="VP of Product"
                />
              </div>
              <div>
                <Label htmlFor="target_industry">Target Industry</Label>
                <Select
                  value={user?.target_industry || ''}
                  onValueChange={(value) => setUser({ ...user, target_industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Key Skills / Strengths</Label>
              <p className="text-xs text-gray-500 mb-3">
                Select from common skills or add your own custom skills
              </p>

              {user?.key_skills && user.key_skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {user.key_skills.map((skill) => (
                    <Badge
                      key={skill}
                      className="bg-purple-100 text-purple-800 hover:bg-purple-200 cursor-pointer"
                      onClick={() => handleRemoveSkill(skill)}
                    >
                      {skill}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_SKILLS.filter(skill => !user?.key_skills?.includes(skill)).slice(0, 10).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="cursor-pointer hover:bg-purple-50"
                    onClick={() => handleAddSkill(skill)}
                  >
                    + {skill}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom skill..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomSkill()}
                />
                <Button
                  onClick={handleAddCustomSkill}
                  variant="outline"
                  disabled={!customSkill.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {updateProfileMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl mb-6">
          <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Account & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div>
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  value="••••••••"
                  disabled
                  className="bg-gray-50"
                />
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordReset(true)}
                >
                  Reset Password
                </Button>
              </div>
              {showPasswordReset && (
                <Alert className="mt-3 bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-900">
                    Password reset functionality would typically send a reset link to your email. For this demo, contact support to reset your password.
                  </AlertDescription>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2"
                    onClick={() => setShowPasswordReset(false)}
                  >
                    Close
                  </Button>
                </Alert>
              )}
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-gray-600">Add an extra layer of security to your account</p>
              </div>
              <Switch
                checked={user?.two_factor_enabled || false}
                onCheckedChange={(checked) => setUser({ ...user, two_factor_enabled: checked })}
              />
            </div>

            <div>
              <Label className="mb-3 block">Notification Preferences</Label>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✉️</span>
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-gray-600">Receive updates via email</p>
                    </div>
                  </div>
                  <Switch
                    checked={user?.notification_email !== false}
                    onCheckedChange={(checked) => setUser({ ...user, notification_email: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">💬</span>
                    <div>
                      <p className="font-medium text-sm">WhatsApp Notifications</p>
                      <p className="text-xs text-gray-600">Receive updates via WhatsApp</p>
                    </div>
                  </div>
                  <Switch
                    checked={user?.notification_whatsapp || false}
                    onCheckedChange={(checked) => setUser({ ...user, notification_whatsapp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📱</span>
                    <div>
                      <p className="font-medium text-sm">SMS Notifications</p>
                      <p className="text-xs text-gray-600">Receive updates via text message</p>
                    </div>
                  </div>
                  <Switch
                    checked={user?.notification_sms || false}
                    onCheckedChange={(checked) => setUser({ ...user, notification_sms: checked })}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Deactivate Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will deactivate your account. Your data will be retained for 30 days in case you change your mind. After 30 days, all your data will be permanently deleted and cannot be recovered.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeactivateAccount} className="bg-red-600 hover:bg-red-700">
                      Deactivate Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {updateProfileMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
