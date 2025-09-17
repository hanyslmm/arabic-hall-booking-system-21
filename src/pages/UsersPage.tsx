import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { Users, MoreHorizontal, Search, UserPlus, Mail, Phone, Calendar, Shield, Key, UserCheck, GraduationCap } from "lucide-react";
import { getUsers, deleteUser, UserProfile } from "@/api/users";
import { AddUserModal } from "@/components/user/AddUserModal";
import { EditUserModal } from "@/components/user/EditUserModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { getEmployeeUsers, getStudentTeacherUsers } from "@/api/userManagement";

export default function UsersPage() {
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("employees");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // All hooks must be called before any conditional returns
  const { user, isOwner, isAdmin, loading } = useAuth();
  
  // Fetch employee users (admin roles)
  const { data: employeeUsers, isLoading: isLoadingEmployees, error: employeeError } = useQuery({
    queryKey: ["employee-users"],
    queryFn: getEmployeeUsers,
    enabled: !!user && (isOwner || isAdmin),
  });

  // Fetch student & teacher users
  const { data: studentTeacherUsers, isLoading: isLoadingStudentTeacher, error: studentTeacherError } = useQuery({
    queryKey: ["student-teacher-users"],
    queryFn: getStudentTeacherUsers,
    enabled: !!user,
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast({
        title: "تم حذف المستخدم بنجاح",
        description: "تم حذف المستخدم من النظام.",
      });
      queryClient.invalidateQueries({ queryKey: ["employee-users"] });
      queryClient.invalidateQueries({ queryKey: ["student-teacher-users"] });
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
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!isOwner && !isAdmin) {
    return <Navigate to="/" replace />;
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

  const getRoleBadge = (user_role?: string) => {
    switch (user_role) {
      case "owner":
        return (
          <Badge variant="destructive" className="text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            مالك
          </Badge>
        );
      case "manager":
        return (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            مدير
          </Badge>
        );
      case "space_manager":
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Shield className="w-3 h-3" />
            مدير قاعات
          </Badge>
        );
      case "teacher":
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
            <GraduationCap className="w-3 h-3" />
            معلم
          </Badge>
        );
      case "read_only":
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
            <UserCheck className="w-3 h-3" />
            طالب
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs flex items-center gap-1 bg-gray-50 text-gray-700 border-gray-200">
            <Users className="w-3 h-3" />
            مستخدم
          </Badge>
        );
    }
  };

  // Filter functions
  const getFilteredUsers = (users: UserProfile[] | undefined, searchTerm: string) => {
    return users?.filter(user => 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  };

  const filteredEmployeeUsers = getFilteredUsers(employeeUsers, searchTerm);
  const filteredStudentTeacherUsers = getFilteredUsers(studentTeacherUsers, searchTerm);

  const isLoading = isLoadingEmployees || isLoadingStudentTeacher;
  const error = employeeError || studentTeacherError;

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

  const renderUserGrid = (users: UserProfile[], emptyMessage: string, emptyDescription: string) => (
    <>
      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {users?.map((user) => (
          <Card key={user.id} className="group hover:shadow-lg transition-all duration-300 border hover:border-primary/30 hover:scale-[1.02] bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar className="w-14 h-14 ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold text-lg">
                      {user.full_name
                        ? user.full_name.charAt(0).toUpperCase()
                        : user.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base leading-tight truncate font-semibold">
                      {user.full_name || user.email?.split('@')[0]}
                    </CardTitle>
                    <div className="mt-2">
                      {getRoleBadge(user.user_role)}
                    </div>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/10">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border-primary/20">
                    <DropdownMenuItem onClick={() => handleEditUser(user)} className="gap-2 hover:bg-primary/10">
                      <Key className="w-4 h-4" />
                      تعديل المستخدم
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive gap-2 hover:bg-destructive/10"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <Users className="w-4 h-4" />
                      حذف المستخدم
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              {user.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 rounded-md p-2">
                  <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                  <span className="truncate font-mono text-xs">{user.email}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 flex-shrink-0 text-green-600" />
                  <span className="font-medium">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border/50">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                <span>انضم في {format(new Date(user.created_at), "dd/MM/yyyy")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {users?.length === 0 && !searchTerm && (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{emptyMessage}</h3>
            <p className="mb-6 text-lg">{emptyDescription}</p>
            {(isOwner || isAdmin) && (
              <Button onClick={() => setShowAddModal(true)} size="lg" className="gap-2">
                <UserPlus className="w-4 h-4" />
                إضافة مستخدم جديد
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* No Search Results */}
      {users?.length === 0 && searchTerm && (
        <Card className="p-8">
          <div className="text-center text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">لا توجد نتائج</h3>
            <p>لم يتم العثور على مستخدمين يطابقون البحث "{searchTerm}"</p>
          </div>
        </Card>
      )}
    </>
  );

  return (
    <UnifiedLayout>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              إدارة المستخدمين
            </h1>
            <p className="text-muted-foreground mt-2">
              إدارة وتنظيم المستخدمين والصلاحيات في النظام
            </p>
          </div>
          {(isOwner || isAdmin) && (
            <Button onClick={() => setShowAddModal(true)} size="lg" className="gap-2">
              <UserPlus className="w-4 h-4" />
              إضافة مستخدم جديد
            </Button>
          )}
        </div>

        {/* Search Section */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-primary/60" />
              <Input
                placeholder="البحث في المستخدمين بالاسم أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-12 h-12 text-lg bg-background/80 border-primary/30 focus:border-primary focus:ring-primary/20"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-muted-foreground mt-3">
                البحث عن: "{searchTerm}" - النتائج: {activeTab === "employees" ? filteredEmployeeUsers.length : filteredStudentTeacherUsers.length}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="employees" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              الموظفون والإدارة
              <Badge variant="secondary" className="ml-2">
                {employeeUsers?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="students-teachers" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              الطلاب والمعلمون
              <Badge variant="secondary" className="ml-2">
                {studentTeacherUsers?.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  الموظفون والإدارة
                </CardTitle>
                <CardDescription>
                  المالكون والمديرون ومديرو القاعات - لهم صلاحيات إدارية في النظام
                </CardDescription>
              </CardHeader>
            </Card>
            {renderUserGrid(
              filteredEmployeeUsers,
              "لا يوجد موظفون",
              "ابدأ بإضافة موظف أو مدير جديد للنظام"
            )}
          </TabsContent>

          <TabsContent value="students-teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  الطلاب والمعلمون
                </CardTitle>
                <CardDescription>
                  حسابات الطلاب والمعلمين - الطلاب يرون بياناتهم فقط، المعلمون يرون طلابهم
                </CardDescription>
              </CardHeader>
            </Card>
            {renderUserGrid(
              filteredStudentTeacherUsers,
              "لا يوجد طلاب أو معلمون",
              "ابدأ بإضافة حسابات للطلاب والمعلمين"
            )}
          </TabsContent>
        </Tabs>

        {/* Modals */}
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
              queryClient.invalidateQueries({ queryKey: ["employee-users"] });
              queryClient.invalidateQueries({ queryKey: ["student-teacher-users"] });
            }}
          />
        )}
      </div>
    </UnifiedLayout>
  );
}