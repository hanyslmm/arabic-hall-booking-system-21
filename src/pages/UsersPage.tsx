import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Users, MoreHorizontal } from "lucide-react";
import { getUsers, deleteUser, UserProfile } from "@/api/users";
import { AddUserModal } from "@/components/user/AddUserModal";
import { EditUserModal } from "@/components/user/EditUserModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // All hooks must be called before any conditional returns
  const { user, isOwner, isAdmin, loading } = useAuth();
  
  const { data: users, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: !!user && (isOwner || isAdmin), // Only fetch if user has permissions
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast({
        title: "تم حذف المستخدم بنجاح",
        description: "تم حذف المستخدم من النظام.",
      });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: any) => {
      toast({
        title: "خطأ في حذف المستخدم",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle loading state
  if (loading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </UnifiedLayout>
    );
  }

  // Check if user has permission to access users page
  if (!user || (!isOwner && !isAdmin)) {
    return <Navigate to="/login" replace />;
  }

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المستخدم؟")) {
      deleteUserMutation.mutate(userId);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "owner":
        return (
          <Badge variant="destructive" className="text-xs">
            مالك
          </Badge>
        );
      case "manager":
        return (
          <Badge variant="secondary" className="text-xs">
            مدير
          </Badge>
        );
      case "space_manager":
        return (
          <Badge variant="outline" className="text-xs">
            مدير قاعات
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            مستخدم
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <LoadingSpinner />
        </div>
      </UnifiedLayout>
    );
  }

  if (error) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-destructive">خطأ في تحميل البيانات: {(error as Error).message}</div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
          <Button onClick={() => setShowAddModal(true)}>
            <Users className="ml-2 h-4 w-4" />
            إضافة مستخدم
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user) => (
            <Card key={user.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {user.full_name
                          ? user.full_name.charAt(0).toUpperCase()
                          : user.email?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        {user.full_name || user.email}
                      </CardTitle>
                      <CardDescription>
                        {getRoleBadge(user.user_role)}
                      </CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditUser(user)}>
                        تعديل
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        حذف
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">البريد الإلكتروني:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium">تاريخ الإنشاء:</span>{" "}
                    {format(new Date(user.created_at), "dd/MM/yyyy")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {users?.length === 0 && (
          <Card className="p-8">
            <div className="text-center text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">لا يوجد مستخدمين</h3>
              <p className="mb-4">ابدأ بإضافة مستخدم جديد</p>
              <Button onClick={() => setShowAddModal(true)}>
                <Users className="ml-2 h-4 w-4" />
                إضافة مستخدم
              </Button>
            </div>
          </Card>
        )}

        {showAddModal && (
          <AddUserModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUserModal
            user={selectedUser}
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
              queryClient.invalidateQueries({ queryKey: ["users"] });
            }}
          />
        )}
      </div>
    </UnifiedLayout>
  );
}