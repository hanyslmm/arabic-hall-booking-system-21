import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function UserDebugPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        setError(profilesError.message);
        return;
      }
      
      setUsers(profiles || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading users...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchUsers} className="mt-4">Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const halaUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes('hala') ||
    user.email?.toLowerCase().includes('hala') ||
    user.username?.toLowerCase().includes('hala')
  );

  const hallManagers = users.filter(user => user.user_role === 'space_manager');
  const generalManagers = users.filter(user => user.user_role === 'manager');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            User Debug Information
            <Button onClick={fetchUsers} variant="outline">Refresh</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Total users found: <strong>{users.length}</strong>
          </p>
        </CardContent>
      </Card>

      {/* Hala Users */}
      {halaUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✅ Hala Users Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {halaUsers.map((user, index) => (
              <div key={user.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.user_role}</Badge>
                  <span className="font-medium">{user.full_name || 'No name'}</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Username:</strong> {user.username || 'Not set'}</p>
                  <p><strong>Role:</strong> {user.user_role}</p>
                  <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <p className="text-sm font-medium text-blue-800">🔐 Login Instructions:</p>
                  <p className="text-sm text-blue-700">
                    <strong>Username:</strong> {user.email} <br/>
                    <strong>OR try:</strong> {user.username || user.email.split('@')[0]} <br/>
                    <strong>Password:</strong> hala123 (as you mentioned)
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Hall Managers */}
      <Card>
        <CardHeader>
          <CardTitle>🏢 Hall Managers (space_manager)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {hallManagers.length > 0 ? (
            hallManagers.map((user, index) => (
              <div key={user.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Hall Manager</Badge>
                  <span className="font-medium">{user.full_name || 'No name'}</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Username:</strong> {user.username || 'Not set'}</p>
                  <p><strong>Login:</strong> {user.email} or {user.username || user.email.split('@')[0]}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No hall managers found</p>
          )}
        </CardContent>
      </Card>

      {/* General Managers */}
      <Card>
        <CardHeader>
          <CardTitle>👔 General Managers (manager)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {generalManagers.length > 0 ? (
            generalManagers.map((user, index) => (
              <div key={user.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default">General Manager</Badge>
                  <span className="font-medium">{user.full_name || 'No name'}</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Username:</strong> {user.username || 'Not set'}</p>
                  <p><strong>Login:</strong> {user.email} or {user.username || user.email.split('@')[0]}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground">No general managers found</p>
          )}
        </CardContent>
      </Card>

      {/* All Users */}
      <Card>
        <CardHeader>
          <CardTitle>👥 All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{user.user_role}</Badge>
                  <span className="font-medium">{user.full_name || 'No name'}</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
