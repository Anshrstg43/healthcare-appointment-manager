import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import { adminApi } from '../../api';
import { TableRowSkeleton } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import type { User } from '../../types';

const AdminUsers: React.FC = () => {
  const { data: pageData, isLoading } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: async () => (await adminApi.listUsers({ size: 50 })).data,
  });

  const users: User[] = pageData?.content || [];

  return (
    <div className="page space-y-8 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Registered patient, physician, and administrative accounts.</p>
      </div>

      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="table-wrapper border-0">
            <table className="table">
              <tbody>
                <TableRowSkeleton cols={5} />
                <TableRowSkeleton cols={5} />
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="No users found" description="No user accounts currently registered." />
        ) : (
          <div className="table-wrapper border-0">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email & Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registered Date</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="font-semibold text-foreground">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground">ID: #{u.id}</div>
                    </td>
                    <td>
                      <div className="text-xs">{u.email}</div>
                      <div className="text-[11px] text-muted-foreground">{u.phone || '—'}</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          u.role === 'ADMIN'
                            ? 'badge-danger'
                            : u.role === 'DOCTOR'
                            ? 'badge-warning'
                            : 'badge-primary'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'badge-success' : 'badge-muted'}`}>
                        {u.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="text-xs text-muted-foreground">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
