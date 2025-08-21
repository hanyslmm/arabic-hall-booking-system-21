import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const UserPermissionsDebug = () => {
  const { user, profile, isAdmin, isOwner, isManager, canManageData, canManageUsers, canManageBookings } = useAuth();

  if (!user) return null;

  return (
    <Card className="mb-4 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-800">🔍 Debug: User Permissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User Role:</strong> {profile?.role || 'N/A'}</p>
            <p><strong>Profile Role:</strong> {(profile as any)?.role || 'N/A'}</p>
          </div>
          <div className="space-y-2">
            <Badge variant={isAdmin ? "default" : "outline"}>
              isAdmin: {isAdmin ? "✓" : "✗"}
            </Badge>
            <Badge variant={isOwner ? "default" : "outline"}>
              isOwner: {isOwner ? "✓" : "✗"}
            </Badge>
            <Badge variant={isManager ? "default" : "outline"}>
              isManager: {isManager ? "✓" : "✗"}
            </Badge>
            <Badge variant={canManageData ? "default" : "outline"}>
              canManageData: {canManageData ? "✓" : "✗"}
            </Badge>
            <Badge variant={canManageUsers ? "default" : "outline"}>
              canManageUsers: {canManageUsers ? "✓" : "✗"}
            </Badge>
            <Badge variant={canManageBookings ? "default" : "outline"}>
              canManageBookings: {canManageBookings ? "✓" : "✗"}
            </Badge>
          </div>
        </div>
        <div className="pt-2 border-t">
          <p className="text-sm text-muted-foreground">
            Daily Expenses Visible: {(isAdmin || isOwner || canManageData) ? "✓ YES" : "✗ NO"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};