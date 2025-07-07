
import { useState } from "react";
import { BookingForm } from "@/components/booking/BookingForm";
import { AddTeacherModal } from "@/components/teacher/AddTeacherModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";

const BookingPage = () => {
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        userRole={profile?.user_role} 
        userName={profile?.full_name || profile?.email || undefined}
      />
      
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">حجز قاعة جديد</h1>
            <p className="text-muted-foreground mt-2">
              قم بملء النموذج أدناه لحجز قاعة
            </p>
          </div>
          
          <Button
            onClick={() => setShowAddTeacher(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            إضافة معلم جديد
          </Button>
        </div>

        <BookingForm />
        
        <AddTeacherModal 
          isOpen={showAddTeacher}
          onClose={() => setShowAddTeacher(false)}
        />
      </main>
    </div>
  );
};

export default BookingPage;
