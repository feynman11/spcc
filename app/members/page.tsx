"use client";

import { trpc } from "@/lib/trpc/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { usePageViewTracking } from "@/lib/analytics";

export default function Members() {
  usePageViewTracking();
  const { data: session } = useSession();
  const router = useRouter();
  const utils = trpc.useUtils();
  const { data: currentUser, isLoading: userLoading } = trpc.members.getCurrentUser.useQuery();
  const { data: usersData, isLoading: usersLoading } = trpc.members.getAllUsers.useQuery(undefined, {
    enabled: currentUser?.role === "member" || currentUser?.role === "admin",
  });
  const { data: currentMember } = trpc.members.getCurrentMember.useQuery();

  // Redirect unapproved users to welcome page
  useEffect(() => {
    if (!userLoading && currentUser?.role === "user") {
      router.push("/welcome");
    }
  }, [currentUser, userLoading, router]);

  // If we have a session but no currentUser, the user was likely deleted - sign them out
  useEffect(() => {
    if (session && !currentUser && !userLoading) {
      signOut({ callbackUrl: "/" });
    }
  }, [session, currentUser, userLoading]);
  
  const approveUser = trpc.members.approveUser.useMutation({
    onSuccess: () => {
      toast.success("User approved successfully!");
      utils.members.getAllUsers.invalidate();
      utils.members.getCurrentUser.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to approve user");
    },
  });

  const togglePaidStatus = trpc.members.togglePaidStatus.useMutation({
    onSuccess: () => {
      toast.success("Payment status updated successfully!");
      utils.members.getAllUsers.invalidate();
      utils.members.getCurrentMember.invalidate();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update payment status");
    },
  });

  const deleteUser = trpc.members.deleteUser.useMutation({
    onSuccess: (data) => {
      toast.success(`User deleted successfully${data.routesReassigned > 0 ? ` (${data.routesReassigned} route${data.routesReassigned === 1 ? '' : 's'} reassigned)` : ''}!`);
      utils.members.getAllUsers.invalidate();
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete user");
    },
  });

  const createMember = trpc.members.createMember.useMutation({
    onSuccess: () => {
      toast.success("Member profile created successfully!");
      utils.members.getCurrentMember.invalidate();
      utils.members.getCurrentUser.invalidate();
      setShowForm(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        emergencyContact: "",
        emergencyPhone: "",
        membershipType: "full",
      });
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create member profile");
    },
  });

  const updateMember = trpc.members.updateMember.useMutation({
    onSuccess: () => {
      toast.success("Member profile updated successfully!");
      utils.members.getCurrentMember.invalidate();
      setShowEditForm(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update member profile");
    },
  });

  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{ id: string; email: string; name?: string | null } | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    emergencyContact: "",
    emergencyPhone: "",
    membershipType: "full" as "full" | "social" | "junior",
  });

  // Auto-fill email when form is opened
  useEffect(() => {
    if (showForm && currentUser?.email) {
      setFormData(prev => ({
        ...prev,
        email: currentUser.email || "",
      }));
    }
  }, [showForm, currentUser?.email]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createMember.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone || undefined,
      emergencyContact: formData.emergencyContact || undefined,
      emergencyPhone: formData.emergencyPhone || undefined,
      membershipType: formData.membershipType,
    });
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMember) return;
    
    updateMember.mutate({
      memberId: currentMember.id,
      firstName: formData.firstName || undefined,
      lastName: formData.lastName || undefined,
      phone: formData.phone || undefined,
      emergencyContact: formData.emergencyContact || undefined,
      emergencyPhone: formData.emergencyPhone || undefined,
      membershipType: formData.membershipType || undefined,
    });
  };

  const handleEditClick = () => {
    if (currentMember) {
      setFormData({
        firstName: currentMember.firstName,
        lastName: currentMember.lastName,
        email: currentMember.email,
        phone: currentMember.phone || "",
        emergencyContact: currentMember.emergencyContact || "",
        emergencyPhone: currentMember.emergencyPhone || "",
        membershipType: currentMember.membershipType,
      });
      setShowEditForm(true);
    }
  };

  const handleApproveUser = (userId: string) => {
    if (confirm("Are you sure you want to approve this user?")) {
      approveUser.mutate({ userId });
    }
  };

  const handleDeleteUser = (userId: string, email: string, name?: string | null) => {
    setUserToDelete({ id: userId, email, name });
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteUser.mutate({ userId: userToDelete.id });
    }
  };

  if (userLoading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // If user is not approved, they should be redirected (handled by useEffect)
  if (currentUser?.role === "user") {
    return (
      <div className="flex justify-center items-center min-h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-600 mt-2">View and manage club members</p>
        </div>
        {!currentMember && (currentUser?.role === "member" || currentUser?.role === "admin") && (
          <button
            onClick={() => {
              setFormData({
                firstName: "",
                lastName: "",
                email: currentUser?.email || "",
                phone: "",
                emergencyContact: "",
                emergencyPhone: "",
                membershipType: "full",
              });
              setShowForm(true);
            }}
            className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium inline-flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Member Profile
          </button>
        )}
      </div>

      {/* Current Member Profile */}
      {currentMember && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {currentMember.firstName} {currentMember.lastName}
              </h2>
              <p className="text-gray-600 mt-1">{currentMember.email}</p>
            </div>
            <button
              onClick={handleEditClick}
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Membership Type</h3>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {currentMember.membershipType}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Join Date</h3>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(currentMember.joinDate).toLocaleDateString()}
              </p>
            </div>
            {currentMember.phone && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Phone</h3>
                <p className="text-lg font-semibold text-gray-900">{currentMember.phone}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Status</h3>
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                currentMember.isActive 
                  ? "bg-green-100 text-green-800" 
                  : "bg-gray-100 text-gray-800"
              }`}>
                {currentMember.isActive ? "Active" : "Inactive"}
              </span>
            </div>
            {currentMember.emergencyContact && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Emergency Contact</h3>
                <p className="text-lg font-semibold text-gray-900">
                  {currentMember.emergencyContact}
                  {currentMember.emergencyPhone && ` - ${currentMember.emergencyPhone}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Member Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Create Member Profile</h3>
          <form onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  readOnly
                  value={formData.email}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed"
                  title="Email cannot be changed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Membership Type *
              </label>
              <select
                required
                value={formData.membershipType}
                onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as any })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="full">Full</option>
                <option value="social">Social</option>
                <option value="junior">Junior</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={createMember.isPending}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {createMember.isPending ? "Creating..." : "Create Profile"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Member Form */}
      {showEditForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit Member Profile</h3>
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Membership Type
                </label>
                <select
                  value={formData.membershipType}
                  onChange={(e) => setFormData({ ...formData, membershipType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="full">Full</option>
                  <option value="social">Social</option>
                  <option value="junior">Junior</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  value={formData.emergencyContact}
                  onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyPhone}
                  onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={updateMember.isPending}
                className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {updateMember.isPending ? "Updating..." : "Update Profile"}
              </button>
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Users Table - Only visible to members and admins */}
      {(currentUser?.role === "member" || currentUser?.role === "admin") && (
        <div className="space-y-6">
          {usersLoading ? (
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            </div>
          ) : usersData ? (
            <>
              {/* Users by Role Sections */}
              {usersData.grouped.user.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-yellow-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Pending Approval ({usersData.grouped.user.length})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Users waiting for admin approval</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          {currentUser?.role === "admin" && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usersData.grouped.user.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            {currentUser?.role === "admin" && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleApproveUser(user.id)}
                                    disabled={approveUser.isPending}
                                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                  >
                                    Approve
                                  </button>
                                  {user.id !== currentUser?.id && (
                                    <button
                                      onClick={() => handleDeleteUser(user.id, user.email, user.name)}
                                      disabled={deleteUser.isPending}
                                      className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Members Section */}
              {usersData.grouped.member.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Members ({usersData.grouped.member.length})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Approved members with full access</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Membership
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Join Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Paid
                          </th>
                          {currentUser?.role === "admin" && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usersData.grouped.member.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.member 
                                  ? `${user.member.firstName} ${user.member.lastName}`
                                  : user.name || user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.member ? (
                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                  {user.member.membershipType}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">No profile</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {user.member 
                                  ? new Date(user.member.joinDate).toLocaleDateString()
                                  : new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                user.member?.isActive 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-gray-100 text-gray-800"
                              }`}>
                                {user.member?.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {user.member ? (
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  user.member.isPaid 
                                    ? "bg-green-100 text-green-800" 
                                    : "bg-red-100 text-red-800"
                                }`}>
                                  {user.member.isPaid ? "Paid" : "Unpaid"}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </td>
                            {currentUser?.role === "admin" && user.member && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      togglePaidStatus.mutate({
                                        memberId: user.member!.id,
                                        isPaid: !user.member!.isPaid,
                                      });
                                    }}
                                    disabled={togglePaidStatus.isPending}
                                    className={`text-sm px-3 py-1 rounded-lg transition-colors disabled:opacity-50 ${
                                      user.member.isPaid
                                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                                        : "bg-green-100 text-green-700 hover:bg-green-200"
                                    }`}
                                  >
                                    {user.member.isPaid ? "Mark Unpaid" : "Mark Paid"}
                                  </button>
                                  {user.id !== currentUser?.id && (
                                    <button
                                      onClick={() => handleDeleteUser(user.id, user.email, user.name)}
                                      disabled={deleteUser.isPending}
                                      className="text-sm bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Admins Section */}
              {usersData.grouped.admin.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Administrators ({usersData.grouped.admin.length})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Users with admin privileges</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          {currentUser?.role === "admin" && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usersData.grouped.admin.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            {currentUser?.role === "admin" && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.id !== currentUser?.id && (
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.email, user.name)}
                                    disabled={deleteUser.isPending}
                                    className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Public Users Section (if any) */}
              {usersData.grouped.public.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Public Users ({usersData.grouped.public.length})
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">Public users</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          {currentUser?.role === "admin" && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Actions
                            </th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usersData.grouped.public.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || user.email}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </div>
                            </td>
                            {currentUser?.role === "admin" && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                {user.id !== currentUser?.id && (
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.email, user.name)}
                                    disabled={deleteUser.isPending}
                                    className="text-sm bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                  >
                                    Delete
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmOpen && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Delete User</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete <strong>{userToDelete.name || userToDelete.email}</strong>?
              This action will:
            </p>
            <ul className="list-disc list-inside text-gray-700 mb-6 space-y-1">
              <li>Permanently delete the user account</li>
              <li>Delete their member profile (if exists)</li>
              <li>Reassign all routes they created to you</li>
            </ul>
            <p className="text-red-600 font-semibold mb-6">This action cannot be undone.</p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setUserToDelete(null);
                }}
                disabled={deleteUser.isPending}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteUser.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteUser.isPending ? "Deleting..." : "Delete User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
