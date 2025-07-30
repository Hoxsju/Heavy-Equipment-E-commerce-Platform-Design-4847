import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import SafeIcon from '../../common/SafeIcon';
import FilterBar from '../../components/FilterBar';
import { adminService } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import * as FiIcons from 'react-icons/fi';

const { FiEdit, FiTrash2, FiShield, FiUser, FiAlertCircle, FiUserX, FiUserCheck, FiUserPlus, FiRefreshCw } = FiIcons;

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('firstName');
  const [sortOrder, setSortOrder] = useState('asc');
  const [confirmDeleteUserId, setConfirmDeleteUserId] = useState(null);
  const { user: currentUser } = useAuth();

  // Debug current user
  useEffect(() => {
    console.log('Current user in Users component:', currentUser);
    if (currentUser) {
      console.log('Current user ID:', currentUser.id);
      console.log('Current user role:', currentUser.role);
      console.log('Current user email:', currentUser.email);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortUsers();
  }, [users, searchTerm, sortBy, sortOrder]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users...');
      const data = await adminService.getAllUsers();
      console.log('Fetched users:', data);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUsers = async () => {
    try {
      setSyncing(true);
      toast.info('Synchronizing users with Supabase Auth...');
      const result = await adminService.syncUsers();
      
      if (result.success) {
        toast.success(`Sync completed! Added: ${result.added}, Removed: ${result.removed}`);
        // Refresh the users list
        await fetchUsers();
      } else {
        toast.error('Failed to sync users');
      }
    } catch (error) {
      console.error('Error syncing users:', error);
      toast.error('Error syncing users');
    } finally {
      setSyncing(false);
    }
  };

  const filterAndSortUsers = () => {
    let filtered = users.filter(user =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Error updating user role');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await adminService.updateUserStatus(userId, newStatus);
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      ));
      const statusMessage = newStatus === 'suspended' ? 'User suspended successfully' : 'User activated successfully';
      toast.success(statusMessage);
    } catch (error) {
      toast.error(`Error ${newStatus === 'suspended' ? 'suspending' : 'activating'} user`);
    }
  };

  const handleDeleteUser = async (userId) => {
    // Set the user ID to confirm deletion
    setConfirmDeleteUserId(userId);
  };

  const confirmDelete = async () => {
    try {
      console.log('Deleting user:', confirmDeleteUserId);
      await adminService.deleteUser(confirmDeleteUserId);
      
      // Remove user from local state immediately
      setUsers(users.filter(user => user.id !== confirmDeleteUserId));
      setFilteredUsers(filteredUsers.filter(user => user.id !== confirmDeleteUserId));
      
      toast.success('User deleted successfully');
      setConfirmDeleteUserId(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const cancelDelete = () => {
    setConfirmDeleteUserId(null);
  };

  // Enhanced canModifyUser function with sub_admin restrictions
  const canModifyUser = (user) => {
    console.log('Checking permissions for user:', user);
    console.log('Current user:', currentUser);
    
    if (!currentUser) {
      console.log('No current user found');
      return false;
    }

    // Don't allow users to modify themselves
    if (user.id === currentUser.id || user.email === currentUser.email) {
      console.log('Cannot modify self');
      return false;
    }

    // Main admin can modify everyone except themselves
    if (currentUser.role === 'main_admin') {
      console.log('Main admin can modify this user');
      return true;
    }

    // Admin can modify sub-admins and users, but not main admin or other admins
    if (currentUser.role === 'admin') {
      const canModify = !['main_admin', 'admin'].includes(user.role);
      console.log(`Admin can modify this user (${user.role}):`, canModify);
      return canModify;
    }

    // Sub-admin can modify users only, not other admins or sub-admins
    if (currentUser.role === 'sub_admin') {
      const canModify = user.role === 'user';
      console.log(`Sub-admin can modify this user (${user.role}):`, canModify);
      return canModify;
    }

    console.log('User cannot modify anyone');
    return false;
  };

  // Function to get available roles for dropdown based on current user's role
  const getAvailableRoles = (targetUser) => {
    if (!currentUser) return [];

    if (currentUser.role === 'main_admin') {
      // Main admin can set any role except main_admin for others
      return [
        { value: 'user', label: 'User' },
        { value: 'sub_admin', label: 'Sub Admin' },
        { value: 'admin', label: 'Admin' }
      ];
    }

    if (currentUser.role === 'admin') {
      // Admin can only manage users and sub_admins
      return [
        { value: 'user', label: 'User' },
        { value: 'sub_admin', label: 'Sub Admin' }
      ];
    }

    if (currentUser.role === 'sub_admin') {
      // Sub-admin can only manage regular users
      return [
        { value: 'user', label: 'User' }
      ];
    }

    return [];
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'main_admin':
        return <SafeIcon icon={FiShield} className="h-4 w-4 text-red-500" />;
      case 'admin':
        return <SafeIcon icon={FiShield} className="h-4 w-4 text-orange-500" />;
      case 'sub_admin':
        return <SafeIcon icon={FiShield} className="h-4 w-4 text-yellow-500" />;
      default:
        return <SafeIcon icon={FiUser} className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'suspended':
        return <SafeIcon icon={FiUserX} className="h-4 w-4 text-red-500" />;
      case 'active':
        return <SafeIcon icon={FiUserCheck} className="h-4 w-4 text-green-500" />;
      default:
        return <SafeIcon icon={FiUser} className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'suspended':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Suspended</span>;
      case 'active':
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>;
      default:
        return <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">{status || 'Unknown'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <div className="flex space-x-2">
          {/* Only show sync button for main_admin and admin */}
          {currentUser && ['main_admin', 'admin'].includes(currentUser.role) && (
            <button
              onClick={handleSyncUsers}
              disabled={syncing}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              <SafeIcon icon={FiRefreshCw} className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Users'}
            </button>
          )}
          <button
            onClick={() => toast.info('User creation functionality would be here')}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
          >
            <SafeIcon icon={FiUserPlus} className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* User Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">User Management Status</h3>
        <div className="text-sm text-blue-700">
          <p><strong>Total Users:</strong> {users.length}</p>
          <p><strong>Current User:</strong> {currentUser?.email || 'Not found'} ({currentUser?.role || 'No role'})</p>
          <p><strong>Permission Level:</strong> {
            currentUser?.role === 'main_admin' ? 'Full Access' :
            currentUser?.role === 'admin' ? 'Admin Access (Cannot edit Main Admin)' :
            currentUser?.role === 'sub_admin' ? 'Sub-Admin Access (Users only)' :
            'Limited Access'
          }</p>
          <p><strong>Data Source:</strong> Supabase Auth + Database</p>
          {currentUser && ['main_admin', 'admin'].includes(currentUser.role) && (
            <p className="mt-2 text-xs">Click "Sync Users" to synchronize with Supabase Auth if you notice discrepancies.</p>
          )}
        </div>
      </div>

      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        sortOptions={[
          { value: 'firstName', label: 'First Name' },
          { value: 'lastName', label: 'Last Name' },
          { value: 'email', label: 'Email' },
          { value: 'role', label: 'Role' },
          { value: 'status', label: 'Status' },
          { value: 'createdAt', label: 'Date Joined' }
        ]}
      />

      {/* Confirmation Modal */}
      {confirmDeleteUserId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4 text-red-600">
              <SafeIcon icon={FiAlertCircle} className="h-6 w-6 mr-2" />
              <h3 className="text-lg font-semibold">Confirm User Deletion</h3>
            </div>
            <p className="mb-6 text-gray-700">
              Are you sure you want to permanently delete this user? This action will:
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li>Delete the user's profile information</li>
                <li>Remove their account from the authentication system</li>
                <li>Delete any related data (except orders)</li>
              </ul>
              <p className="mt-2 text-sm font-medium text-red-600">This action cannot be undone.</p>
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto" style={{ minWidth: '100%' }}>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Date Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Last Login
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => {
                const canModify = canModifyUser(user);
                const availableRoles = getAvailableRoles(user);
                console.log(`Can modify user ${user.email}:`, canModify);
                
                return (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {user.firstName[0]}{user.lastName[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getRoleIcon(user.role)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(user.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        {canModify ? (
                          <>
                            {/* Role Dropdown */}
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              {availableRoles.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>

                            {/* Status Toggle Button */}
                            {user.status === 'active' ? (
                              <button
                                onClick={() => handleStatusChange(user.id, 'suspended')}
                                className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 p-1 rounded"
                                title="Suspend User"
                              >
                                <SafeIcon icon={FiUserX} className="h-4 w-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(user.id, 'active')}
                                className="text-green-600 hover:text-green-900 bg-green-100 p-1 rounded"
                                title="Activate User"
                              >
                                <SafeIcon icon={FiUserCheck} className="h-4 w-4" />
                              </button>
                            )}

                            {/* Delete Button - Only for main_admin and admin */}
                            {currentUser && ['main_admin', 'admin'].includes(currentUser.role) && (
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900 bg-red-100 p-1 rounded"
                                title="Delete User"
                              >
                                <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-gray-400 text-sm whitespace-nowrap">
                            {user.id === currentUser?.id ? 'Cannot modify self' : 
                             user.role === 'main_admin' ? 'Main Admin (Protected)' :
                             currentUser?.role === 'sub_admin' && ['admin', 'sub_admin'].includes(user.role) ? 'No permission' :
                             'No permission'}
                          </span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Help section */}
      <div className="bg-blue-50 rounded-lg p-4 mt-6">
        <h3 className="text-sm font-medium text-blue-800 mb-2">User Management Help</h3>
        <div className="text-sm text-blue-700 space-y-2">
          <p>
            <strong>Roles:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Main Admin:</strong> Full access to all features and can manage all users</li>
              <li><strong>Admin:</strong> Can manage all aspects except other admins and main admin</li>
              <li><strong>Sub Admin:</strong> Limited administrative privileges - can only manage regular users</li>
              <li><strong>User:</strong> Regular customer account with no administrative access</li>
            </ul>
          </p>
          <p>
            <strong>Permission Matrix:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Main Admin:</strong> Can modify all users except themselves</li>
              <li><strong>Admin:</strong> Can modify sub-admins and users (not main admin or other admins)</li>
              <li><strong>Sub Admin:</strong> Can only modify regular users</li>
            </ul>
          </p>
          <p>
            <strong>User Status:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li><strong>Active:</strong> User can log in and access their account</li>
              <li><strong>Suspended:</strong> User cannot log in until their account is reactivated</li>
            </ul>
          </p>
          {currentUser && ['main_admin', 'admin'].includes(currentUser.role) && (
            <p>
              <strong>Sync Users:</strong> Synchronizes the user list with Supabase Auth to ensure data consistency. Use this if you notice users appearing/disappearing unexpectedly.
            </p>
          )}
          <p>
            <strong>Note:</strong> Deleting a user permanently removes them from both the database and the authentication system. This action cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Users;