import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { studentsApi, studentRegistrationsApi, paymentsApi, Student } from "@/api/students";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Scan, DollarSign, Calendar, Users, Camera, X, CreditCard } from "lucide-react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";

interface FastRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Booking {
  id: string;
  hall_id: string;
  teacher_id: string;
  academic_stage_id: string;
  start_time: string;
  days_of_week: string[];
  number_of_students: number;
  class_fees: number;
  halls?: { name: string };
  teachers?: { name: string };
  academic_stages?: { name: string };
}

interface SelectedClass {
  id: string;
  checked: boolean;
  fees: number;
}

export const FastRegistrationModal = ({ isOpen, onClose }: FastRegistrationModalProps) => {
  const queryClient = useQueryClient();
  const [scannerActive, setScannerActive] = useState(false);
  const [scannerPreference, setScannerPreference] = useState(() => {
    return localStorage.getItem('scanner-preference') === 'camera';
  });
  const [barcodeInput, setBarcodeInput] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Record<string, SelectedClass>>({});
  const [totalAmount, setTotalAmount] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [autoRegisterMode, setAutoRegisterMode] = useState(false);

  // Get today's weekday to filter relevant classes
  const today = new Date();
  const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const todayWeekday = weekdays[today.getDay()];

  // Fetch today's active bookings
  const { data: todaysBookings = [] } = useQuery({
    queryKey: ["todays-bookings", todayWeekday],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          halls(name),
          teachers(name),
          academic_stages(name)
        `)
        .eq("status", "active")
        .contains("days_of_week", [todayWeekday])
        .order("start_time");
      
      if (error) throw error;
      return data as Booking[];
    },
  });

  // Fetch existing registrations for the selected student
  const { data: existingRegistrations = [] } = useQuery({
    queryKey: ["student-existing-registrations", selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return [];
      
      const { data, error } = await supabase
        .from("student_registrations")
        .select(`
          id,
          booking_id,
          bookings!inner(
            id,
            days_of_week,
            status
          )
        `)
        .eq("student_id", selectedStudent.id)
        .eq("bookings.status", "active");
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedStudent?.id,
  });

  const searchMutation = useMutation({
    mutationFn: studentsApi.search,
    onSuccess: (students) => {
      if (students.length === 1) {
        setSelectedStudent(students[0]);
        // Clear any previous selections since we're showing registered classes only
        setSelectedClasses({});
        setTotalAmount(0);
        setPaymentAmount("0");
      } else if (students.length === 0) {
        toast.error("لم يتم العثور على الطالب");
      }
    },
    onError: () => {
      toast.error("فشل في البحث عن الطالب");
    }
  });

  const registerMutation = useMutation({
    mutationFn: async ({ registrations }: { registrations: Array<{ student_id: string; booking_id: string; total_fees: number; paid_amount: number }> }) => {
      // Register student in multiple classes
      const registrationPromises = registrations.map(reg => 
        studentRegistrationsApi.create({
          student_id: reg.student_id,
          booking_id: reg.booking_id,
          total_fees: reg.total_fees,
          notes: reg.paid_amount > 0 ? `دفع سريع: ${reg.paid_amount} ر.س` : undefined
        })
      );
      
      const createdRegistrations = await Promise.all(registrationPromises);
      
      // Create payment records for paid amounts
      const paymentPromises = createdRegistrations
        .map((registration, index) => {
          const paidAmount = registrations[index].paid_amount;
          if (paidAmount > 0) {
            return paymentsApi.create({
              student_registration_id: registration.id,
              amount: paidAmount,
              payment_method: 'cash',
              notes: 'دفع سريع عند التسجيل'
            });
          }
          return null;
        })
        .filter(Boolean);
      
      if (paymentPromises.length > 0) {
        await Promise.all(paymentPromises);
      }
      
      return createdRegistrations;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["student-registrations"] });
      queryClient.invalidateQueries({ queryKey: ["student-existing-registrations"] });
      toast.success(`تم تسجيل الطالب في ${results.length} دورة بنجاح`);
      
      // Reset form but keep scanner preference for fast sequential scanning
      const wasScanning = scannerActive;
      setBarcodeInput("");
      setSelectedStudent(null);
      setSelectedClasses({});
      setTotalAmount(0);
      setPaymentAmount("");
      setIsRegistering(false);
      searchMutation.reset();
      
      // Auto-reactivate scanner/input for fast sequential scanning
      setTimeout(() => {
        if (wasScanning) {
          // Keep camera active for next student
          setScannerActive(true);
        } else {
          // Auto-focus on barcode input for next manual entry
          const barcodeInput = document.getElementById('barcode') as HTMLInputElement;
          if (barcodeInput) {
            barcodeInput.focus();
          }
        }
      }, 100);
    },
    onError: (error: any) => {
      if (error.message?.includes('student_id, booking_id')) {
        toast.error("الطالب مسجل بالفعل في إحدى هذه الدورات");
      } else {
        toast.error("فشل في تسجيل الطالب");
      }
    }
  });

  // Handle barcode scan
  const handleBarcodeScan = (result: string) => {
    setBarcodeInput(result);
    setScannerActive(false);
    if (result.trim()) {
      searchMutation.mutate(result.trim());
    }
  };

  // Handle manual barcode input
  const handleBarcodeSubmit = () => {
    if (barcodeInput.trim()) {
      searchMutation.mutate(barcodeInput.trim());
    }
  };

  // Handle class selection
  const handleClassToggle = (bookingId: string, checked: boolean) => {
    setSelectedClasses(prev => {
      const updated = { ...prev };
      
      if (checked) {
        const booking = todaysBookings.find(b => b.id === bookingId);
        updated[bookingId] = {
          id: bookingId,
          checked: true,
          fees: booking?.class_fees || 0
        };
      } else {
        delete updated[bookingId];
      }
      
      return updated;
    });
  };

  // Handle fees change
  const handleFeesChange = (bookingId: string, fees: number) => {
    setSelectedClasses(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        fees: fees
      }
    }));
  };

  // Auto-activate scanner on modal open based on preference
  useEffect(() => {
    if (isOpen) {
      if (scannerPreference) {
        // Auto-activate camera scanner
        setTimeout(() => setScannerActive(true), 500);
      } else {
        // Auto-focus on input field
        setTimeout(() => {
          const input = document.getElementById('barcode') as HTMLInputElement;
          if (input) input.focus();
        }, 500);
      }
    }
  }, [isOpen, scannerPreference]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      // Escape to close
      if (e.key === 'Escape' && !isRegistering) {
        handleClose();
        return;
      }
      
      // Space to toggle scanner (when not in input)
      if (e.key === ' ' && e.target === document.body) {
        e.preventDefault();
        setScannerActive(prev => {
          const newValue = !prev;
          localStorage.setItem('scanner-preference', newValue ? 'camera' : 'manual');
          setScannerPreference(newValue);
          return newValue;
        });
        return;
      }
      
      // Ctrl+Enter for quick register with default fees
      if (e.ctrlKey && e.key === 'Enter' && selectedStudent && !isRegistering) {
        e.preventDefault();
        handleRegister();
        return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedStudent, isRegistering]);

  // Calculate total when selected classes change
  useEffect(() => {
    const total = Object.values(selectedClasses).reduce((sum, cls) => sum + cls.fees, 0);
    setTotalAmount(total);
    setPaymentAmount(total.toString());
  }, [selectedClasses]);

  // Handle registration
  const handleRegister = async () => {
    if (!selectedStudent) {
      toast.error("يرجى مسح رمز الطالب أولاً");
      return;
    }

    const selectedClassesList = Object.values(selectedClasses).filter(cls => cls.checked);
    if (selectedClassesList.length === 0) {
      toast.error("يرجى اختيار دورة واحدة على الأقل");
      return;
    }

    const paidAmount = parseFloat(paymentAmount) || 0;
    const amountPerClass = selectedClassesList.length > 0 ? paidAmount / selectedClassesList.length : 0;

    const registrations = selectedClassesList.map(cls => ({
      student_id: selectedStudent.id,
      booking_id: cls.id,
      total_fees: cls.fees,
      paid_amount: amountPerClass
    }));

    setIsRegistering(true);
    try {
      await registerMutation.mutateAsync({ registrations });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleClose = () => {
    setBarcodeInput("");
    setSelectedStudent(null);
    setSelectedClasses({});
    setTotalAmount(0);
    setPaymentAmount("");
    setScannerActive(false);
    setIsRegistering(false);
    searchMutation.reset();
    onClose();
  };

  const getDaysInArabic = (days: string[]) => {
    const daysMap: { [key: string]: string } = {
      'sunday': 'الأحد',
      'monday': 'الاثنين',
      'tuesday': 'الثلاثاء',
      'wednesday': 'الأربعاء',
      'thursday': 'الخميس',
      'friday': 'الجمعة',
      'saturday': 'السبت'
    };
    return days.map(day => daysMap[day]).join(', ');
  };

  const selectedClassCount = Object.values(selectedClasses).filter(cls => cls.checked).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-right text-lg flex items-center justify-between">
            استعلام عن دورات الطالب
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                Space: كاميرا | Esc: إغلاق
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Compact Barcode Scanner Section */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="رقم الطالب أو امسح الباركود"
                  className="text-right"
                  onKeyPress={(e) => e.key === 'Enter' && handleBarcodeSubmit()}
                />
                <Button 
                  onClick={handleBarcodeSubmit}
                  disabled={searchMutation.isPending || !barcodeInput.trim()}
                  size="sm"
                >
                  {searchMutation.isPending ? "بحث..." : "بحث"}
                </Button>
              </div>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScannerActive(!scannerActive)}
                  className="flex-1"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {scannerActive ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
                </Button>
              </div>

              {scannerActive && (
                <div className="border-2 border-dashed border-primary rounded-lg p-2 h-40 bg-background/50">
                  <BarcodeScannerComponent
                    width="100%"
                    height={140}
                    delay={300}
                    facingMode="environment"
                    onUpdate={(err, result) => {
                      if (result) {
                        handleBarcodeScan(result.getText());
                        // Visual feedback for successful scan
                        const scanArea = document.querySelector('.border-dashed');
                        if (scanArea) {
                          scanArea.classList.add('border-green-500', 'bg-green-50');
                          setTimeout(() => {
                            scanArea.classList.remove('border-green-500', 'bg-green-50');
                          }, 500);
                        }
                      }
                    }}
                  />
                  <div className="text-center text-xs text-muted-foreground mt-1">
                    وجه الكاميرا نحو الباركود | Space للتبديل | Esc للإغلاق
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compact Selected Student Info */}
          {selectedStudent && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-green-600" />
                  <div>
                    <span className="font-medium text-green-600">{selectedStudent.name}</span>
                    <Badge variant="outline" className="ml-2 text-xs">{selectedStudent.serial_number}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Student's Registered Classes */}
          {selectedStudent && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <Label className="text-base font-medium">
                      دورات الطالب ({todaysBookings.filter(booking => existingRegistrations.some(reg => reg.booking_id === booking.id)).length}) - {today.toLocaleDateString('ar-SA')}
                    </Label>
                  </div>

                  {todaysBookings.filter(booking => existingRegistrations.some(reg => reg.booking_id === booking.id)).length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-semibold mb-2">لا توجد دورات مسجلة</h3>
                      <p className="text-muted-foreground">
                        الطالب غير مسجل في أي دورة لليوم
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {todaysBookings
                        .filter((booking) => {
                          // Only show classes the student is already registered for
                          return existingRegistrations.some(reg => reg.booking_id === booking.id);
                        })
                        .map((booking) => {
                        const isSelected = selectedClasses[booking.id]?.checked || false;
                        const fees = selectedClasses[booking.id]?.fees || booking.class_fees || 0;
                        const isAlreadyRegistered = true; // All filtered bookings are already registered

                        return (
                          <div key={booking.id} className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 p-3 border rounded-lg bg-green-50 border-green-200">
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                  <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                      <p className="font-medium text-sm sm:text-base">
                                        {booking.halls?.name} - {booking.teachers?.name}
                                      </p>
                                       <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                                         مسجل
                                       </Badge>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                                      {booking.academic_stages?.name} | {getDaysInArabic(booking.days_of_week)} | 
                                      {booking.start_time ? 
                                        new Date(`2000-01-01T${booking.start_time}`).toLocaleTimeString('ar-SA', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                          hour12: true
                                        }) : ''
                                      }
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Label className="text-xs sm:text-sm flex-shrink-0">الرسوم:</Label>
                                    <span className="font-medium text-sm">{(booking.class_fees || 0).toFixed(2)} ر.س</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button type="button" onClick={handleClose} className="w-full">
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};