"use client";

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader } from 'lucide-react';
import TwoFactorAuthDialog from '@/components/TwoFactorAuthDialog';

interface UserProfile {
  otp_validate: boolean;
  otp_verified: boolean;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  bloodType: string;
  email: string;
  otp_mode: boolean;
  is_superuser: boolean;
}

const UserProfilePage = () => {
  const { user, logout, loading } = useAuth();
  const router = useRouter();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setMessage] = useState('');
  const [is2FASetupOpen, setIs2FASetupOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    } else if (user) {
      const token = localStorage.getItem('authToken');
      if (token) {
        fetchUserProfile(token);
      } else {
        router.push('/');
      }
    }
  }, [user, router, loading]);

  useEffect(() => {
    // Если пользователь должен пройти верификацию OTP и не прошел ее, перенаправляем на страницу OTP
    if (profileData?.otp_validate && !profileData.otp_verified) {
      router.push('/'); 
    }
  }, [profileData, router]);

  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch('http://localhost:8000/profile/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const formattedData: UserProfile = {
          firstName: data.first_name,
          lastName: data.last_name,
          age: data.age,
          gender: data.gender,
          bloodType: data.blood_type,
          email: data.email,
          otp_mode: data.otp_mode,
          otp_verified: data.otp_verified,
          otp_validate: data.otp_validate,
          is_superuser: data.is_superuser,
        };
        setProfileData(formattedData);
        setFormData(formattedData);
      } else {
        setMessage('Failed to load profile data');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FA = async () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        if (profileData?.otp_validate) {
          // Disable 2FA
          const response = await fetch('http://localhost:8000/api/auth/otp/disable', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${token}`,
            },
          });

          if (response.ok) {
            await fetchUserProfile(token);
          } else {
            console.error('Failed to disable 2FA');
          }
        } else {
          // Open dialog for enabling 2FA
          setIs2FASetupOpen(true);
        }
      } catch (error) {
        console.error('Error updating 2FA status:', error);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (token && formData) {
        const response = await fetch('http://localhost:8000/profile/', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            first_name: formData.firstName,
            last_name: formData.lastName,
            age: formData.age,
            gender: formData.gender,
            blood_type: formData.bloodType,
            email: formData.email,
          }),
        });

        if (response.ok) {
          setMessage('Profile updated successfully');
          await fetchUserProfile(token);
        } else {
          setMessage('Failed to update profile');
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('An error occurred while updating the profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('http://localhost:8000/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${token}`,
          },
        });

        if (response.ok) {
          logout();
          router.push('/');
        } else {
          console.error('Logout failed');
        }
      }
    } catch (error) {
      console.error('An error occurred during logout:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin w-6 h-6 text-black dark:text-white" />
      </div>
    );
  }

  if (!profileData) {
    return <div className="flex items-center justify-center min-h-screen">No profile data found.</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-gradient-to-r from-indigo-200 via-blue-200 to-cyan-100 dark:from-gray-800 dark:via-gray-900 dark:to-black">
      <div className="container mx-auto p-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="flex flex-col gap-6">
          {/* User Profile Information */}
          <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg shadow-lg">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">User Profile</h2>
            <div className="mt-4 space-y-2">
              <p className="text-gray-600 dark:text-gray-300">
                <strong>First Name:</strong> {profileData.firstName}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Last Name:</strong> {profileData.lastName}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Age:</strong> {profileData.age}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Gender:</strong> {profileData.gender}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Blood Type:</strong> {profileData.bloodType}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                <strong>Email:</strong> {profileData.email}
              </p>
            </div>
          </div>
          {profileData.is_superuser && (
            <Button
              onClick={() => (window.location.href = 'http://localhost:8000/admin')}
              className="bg-black dark:bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-yellow-600 transition-all duration-300"
            >
              Go to Admin Panel
            </Button>
          )}
          {/* Edit Profile Button and Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-blue-500 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-800 transition-all duration-300">
                Edit Profile
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData?.firstName || ''}
                    onChange={(e) =>
                      setFormData((prev) => prev && { ...prev, firstName: e.target.value })
                    }
                    className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-700"
                  />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData?.lastName || ''}
                    onChange={(e) =>
                      setFormData((prev) => prev && { ...prev, lastName: e.target.value })
                    }
                    className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-700"
                  />
                  <input
                    type="number"
                    name="age"
                    placeholder="Age"
                    value={formData?.age || 18}
                    onChange={(e) =>
                      setFormData((prev) => prev && { ...prev, age: parseInt(e.target.value) })
                    }
                    className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-700"
                  />
                </div>
                <select
                  name="gender"
                  value={formData?.gender || 'M'}
                  onChange={(e) =>
                    setFormData((prev) => prev && { ...prev, gender: e.target.value })
                  }
                  className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-700"
                >
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                </select>
                <select
                  name="bloodType"
                  value={formData?.bloodType || 'I'}
                  onChange={(e) =>
                    setFormData((prev) => prev && { ...prev, bloodType: e.target.value })
                  }
                  className="w-full p-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:border-blue-500 dark:focus:border-blue-700"
                >
                  <option value="I">First</option>
                  <option value="II">Second</option>
                  <option value="III">Third</option>
                  <option value="IV">Fourth</option>
                </select>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-500 dark:bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-800 transition-all duration-300 w-full"
                >
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Enable/Disable 2FA Button */}
          <Button
            onClick={handle2FA}
            className={`${
              profileData.otp_validate
                ? 'bg-red-500 dark:bg-red-700 hover:bg-red-600 dark:hover:bg-red-800'
                : 'bg-green-500 dark:bg-green-700 hover:bg-green-600 dark:hover:bg-green-800'
            } text-white px-4 py-2 rounded-lg transition-all duration-300`}
          >
            {profileData.otp_validate
              ? 'Disable Two-Factor Authentication'
              : 'Enable Two-Factor Authentication'}
          </Button>

          {/* Two-Factor Authentication Setup Dialog */}
          <TwoFactorAuthDialog
            open={is2FASetupOpen}
            onClose={() => setIs2FASetupOpen(false)}
            onOtpGenerated={() => fetchUserProfile(localStorage.getItem('authToken')!)}
          />

          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            className="bg-red-600 dark:bg-red-800 text-white px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-900 transition-all duration-300"
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
