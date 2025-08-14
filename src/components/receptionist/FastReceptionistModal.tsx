import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Search, UserPlus, CreditCard, Clock, Phone, MapPin, Hash, Scan } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi, studentRegistrationsApi, paymentsApi } from '@/api/students';
import { attendanceApi } from '@/api/students';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Scanner } from '@alzera/react-scanner';
interface FastReceptionistModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialStudentId?: string;
}

interface StudentInfo {
  id: string;
  serial_number: string;
  name: string;
  mobile_phone: string;
  parent_phone?: string;
  city?: string;
  registrations?: Array<{
    id: string;
    booking_id: string;
    total_fees: number;
    paid_amount: number;
    payment_status: string;
    booking?: {
      class_code?: string;
      teachers?: { name: string };
      halls?: { name: string };
      start_time: string;
      days_of_week: string[];
    };
  }>;
}

export function FastReceptionistModal({ isOpen, onClose, initialStudentId }: FastReceptionistModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [selectedForAttendance, setSelectedForAttendance] = useState<Record<string, boolean>>({});
  const [markPaid, setMarkPaid] = useState<Record<string, boolean>>({});
  const [ultraFastMode, setUltraFastMode] = useState(false);
  const [searchByNameMobile, setSearchByNameMobile] = useState(false);
  const [autoProcessed, setAutoProcessed] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showScanner, setShowScanner] = useState(false);

  const today = new Date();
  const weekdays = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const todayWeekday = weekdays[today.getDay()];
  const todayISO = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;
    async function preload() {
      if (isOpen && initialStudentId && !selectedStudent) {
        try {
          const { studentsApi } = await import('@/api/students');
          const s = await studentsApi.getById(initialStudentId);
          if (!cancelled && s) {
            setSelectedStudent(s as any);
          }
        } catch (_) {
          // ignore
        }
      }
    }
    preload();
    return () => { cancelled = true; };
  }, [isOpen, initialStudentId, selectedStudent]);
  // Search students - prioritize serial number, optionally include name/mobile
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['student-search', searchTerm, searchByNameMobile],
    queryFn: async () => {
      if (searchTerm.length < 1) return [];
      
      if (!searchByNameMobile) {
        // Serial number only search - exact match
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('serial_number', searchTerm)
          .limit(1);
        return data || [];
      } else {
        // Flexible search by serial, name, or mobile
        return searchTerm.length >= 3 ? studentsApi.search(searchTerm) : [];
      }
    },
    enabled: searchTerm.length >= 1
  });

  // Get student registrations when student is selected
  const { data: registrations } = useQuery({
    queryKey: ['student-registrations', selectedStudent?.id],
    queryFn: async () => {
      if (!selectedStudent?.id) return [] as any[];
      return await studentRegistrationsApi.getByStudentWithPayments(selectedStudent.id);
    },
    enabled: !!selectedStudent?.id
  });

  // Initialize selections when registrations change
  useEffect(() => {
    if (!registrations) return;
    const sel: Record<string, boolean> = {};
    const paid: Record<string, boolean> = {};
    (registrations as any[]).forEach((reg: any) => {
      const isToday = (reg.booking?.days_of_week || []).includes(todayWeekday);
      sel[reg.id] = isToday;
      // Paid this month if any payment record within current month or status says paid and payment_date in current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const paidThisMonth = (reg.payment_records || []).some((p: any) => {
        const d = new Date(p.payment_date);
        return d >= monthStart && d < monthEnd;
      }) || (reg.payment_status === 'paid');
      paid[reg.id] = false; // default unchecked; will be disabled if already paid
      (reg as any)._paidThisMonth = paidThisMonth;
    });
    setSelectedForAttendance(sel);
    setMarkPaid(paid);
  }, [registrations, todayWeekday]);

  const paymentMutation = useMutation({
    mutationFn: async (data: { registrationId: string; amount: number }) => {
      return await paymentsApi.create({
        student_registration_id: data.registrationId,
        amount: data.amount,
        payment_date: todayISO,
        payment_method: 'cash',
        notes: `Fast payment - ${format(new Date(), 'MMM dd, yyyy HH:mm')}`
      });
    },
    onSuccess: () => {
      toast({ title: 'تم إضافة الدفعة بنجاح', description: 'تم تسجيل الدفعة في النظام' });
      queryClient.invalidateQueries({ queryKey: ['student-registrations'] });
    },
    onError: (error) => {
      toast({ title: 'خطأ في إضافة الدفعة', description: String(error), variant: 'destructive' });
    }
  });

  const attendanceMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      return await attendanceApi.markPresentForDate(registrationId, todayISO);
    },
    onSuccess: () => {
      toast({ title: 'تم تسجيل الحضور اليوم', description: 'تم وضع علامة حضور لهذا التسجيل' });
    },
    onError: (error) => {
      toast({ title: 'خطأ في تسجيل الحضور', description: String(error), variant: 'destructive' });
    }
  });

  const handleConfirm = useCallback(async () => {
    if (!registrations || !selectedStudent) return;
    const regs = registrations as any[];
    const selectedIds = regs.filter(r => selectedForAttendance[r.id]).map(r => r.id);
    if (selectedIds.length === 0) {
      toast({ title: 'لا توجد دروس محددة لليوم', variant: 'destructive' });
      return;
    }
    
    try {
      // Mark attendance for selected
      await Promise.all(selectedIds.map(id => attendanceMutation.mutateAsync(id)));
      
      // Create full payments where requested
      await Promise.all(regs.map(async (r) => {
        if (markPaid[r.id] && !(r as any)._paidThisMonth) {
          const amount = Number(r.total_fees || 0);
          if (amount > 0) {
            await paymentMutation.mutateAsync({ registrationId: r.id, amount });
          }
        }
      }));
      
      setAutoProcessed(true);
      toast({ title: 'تم التسجيل بنجاح', description: 'تم تسجيل الحضور والدفعات' });
      
      // In ultra fast mode, keep result displayed for review
      if (!ultraFastMode) {
        // Normal mode - reset immediately
        setTimeout(() => handleReset(), 1000);
      }
    } catch (error) {
      toast({ title: 'خطأ في المعالجة', description: String(error), variant: 'destructive' });
    }
  }, [registrations, selectedStudent, selectedForAttendance, markPaid, ultraFastMode, attendanceMutation, paymentMutation, toast]);

  const handleReset = useCallback(() => {
    setSelectedStudent(null);
    setSearchTerm('');
    setSelectedForAttendance({});
    setMarkPaid({});
    setAutoProcessed(false);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const autoProcessStudent = useCallback(async (student: any) => {
    if (!ultraFastMode) return;
    
    setSelectedStudent(student);
    setSearchTerm('');
    
    // Wait for registrations to load
    setTimeout(async () => {
      const regs = await studentRegistrationsApi.getByStudentWithPayments(student.id);
      if (!regs) return;
      
      // Auto-select today's classes and mark unpaid ones for payment
      const sel: Record<string, boolean> = {};
      const paid: Record<string, boolean> = {};
      
      regs.forEach((reg: any) => {
        const isToday = (reg.booking?.days_of_week || []).includes(todayWeekday);
        sel[reg.id] = isToday;
        
        // Check if paid this month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const paidThisMonth = (reg.payment_records || []).some((p: any) => {
          const d = new Date(p.payment_date);
          return d >= monthStart && d < monthEnd;
        }) || (reg.payment_status === 'paid');
        
        paid[reg.id] = !paidThisMonth; // Auto-mark for payment if not paid
        (reg as any)._paidThisMonth = paidThisMonth;
      });
      
      setSelectedForAttendance(sel);
      setMarkPaid(paid);
      
      // Auto-process immediately
      if (Object.values(sel).some(Boolean)) {
        setTimeout(() => handleConfirm(), 500);
      }
    }, 300);
  }, [ultraFastMode, todayWeekday, handleConfirm]);

  // Hit Enter to confirm or in ultra-fast mode to auto-process
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedStudent && !autoProcessed) {
          handleConfirm();
        } else if (autoProcessed && ultraFastMode) {
          handleReset();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, selectedStudent, autoProcessed, ultraFastMode, handleConfirm, handleReset]);

  // Auto-focus search when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-search when user types serial/mobile
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setSelectedStudent(null);
    setAutoProcessed(false);
  };

  const handleStudentSelect = (student: any) => {
    if (ultraFastMode) {
      autoProcessStudent(student);
    } else {
      setSelectedStudent(student);
      setSearchTerm('');
    }
  };

  // Removed quick payment handler (unused); payments are handled per registration via checkboxes above

  const formatTime = (timeStr: string) => {
    return format(new Date(`2000-01-01T${timeStr}`), 'h:mm a');
  };

  const formatDays = (days: string[]) => {
    const dayMap: Record<string, string> = {
      'saturday': 'السبت',
      'sunday': 'الأحد',
      'monday': 'الاثنين',
      'tuesday': 'الثلاثاء',
      'wednesday': 'الأربعاء',
      'thursday': 'الخميس',
      'friday': 'الجمعة'
    };
    return days.map(day => dayMap[day] || day).join(', ');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="h-5 w-5 text-primary" />
              التسجيل السريع - الاستقبال
            </DialogTitle>
            <Button
              variant={ultraFastMode ? "default" : "outline"}
              size="sm"
              onClick={() => setUltraFastMode(!ultraFastMode)}
              className="whitespace-nowrap"
            >
              {ultraFastMode ? "إيقاف" : "تفعيل"} التسجيل فائق السرعة
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Search Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5" />
                البحث عن الطالب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="search">
                  {searchByNameMobile ? 'الرقم التسلسلي أو الاسم أو الموبايل' : 'الرقم التسلسلي'}
                </Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    ref={searchInputRef}
                    id="search"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const term = searchTerm.trim();
                        const results = (searchResults as any[]) || [];
                        const exact = results.find((s: any) => 
                          s.serial_number === term || 
                          (searchByNameMobile && (s.mobile_phone === term || s.name.includes(term)))
                        );
                        if (exact) {
                          handleStudentSelect(exact);
                        } else if (results.length === 1) {
                          handleStudentSelect(results[0]);
                        }
                      }
                    }}
                    placeholder={searchByNameMobile ? "ادخل الرقم التسلسلي أو الاسم أو الموبايل..." : "ادخل الرقم التسلسلي..."}
                    className="text-lg flex-1"
                  />
                  <Button type="button" variant={showScanner ? 'secondary' : 'outline'} onClick={() => setShowScanner(v => !v)} className="whitespace-nowrap">
                    <Scan className="h-4 w-4 ml-2" />
                    {showScanner ? 'إيقاف الماسح' : 'تشغيل الماسح'}
                  </Button>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="search-mode"
                    checked={searchByNameMobile}
                    onChange={(e) => setSearchByNameMobile(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="search-mode" className="text-sm">
                    بحث بالاسم أو الموبايل
                  </Label>
                </div>
              </div>

              {showScanner && (
                <div className="rounded-md border p-2 bg-muted/30">
                  <Scanner 
                    onScan={(d: string | null) => {
                      const v = (d || '').trim();
                      if (!v) return;
                      setShowScanner(false);
                      handleSearch(v);
                      // Try to auto-select if result appears
                      setTimeout(() => {
                        const results = (searchResults as any[]) || [];
                        const exact = results.find((s: any) => s.serial_number === v || s.mobile_phone === v);
                        if (exact) handleStudentSelect(exact);
                      }, 400);
                    }}
                    decoderOptions={{ formats: ['qr_code','code_128','code_39','ean_13','ean_8','upc_a','upc_e'] }}
                    aspectRatio="4/3"
                    className="w-full rounded-md overflow-hidden"
                  />
                  <p className="text-xs text-muted-foreground mt-2">يمكنك أيضاً استخدام قارئ الباركود المتصل كلوحة مفاتيح؛ سيملأ الحقل تلقائياً.</p>
                </div>
              )}

              {/* Search Results */}
              {searching && (
                <div className="text-center py-4 text-muted-foreground">
                  جاري البحث...
                </div>
              )}

              {searchTerm.length >= 1 && searchResults && searchResults.length > 0 && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.map((student) => (
                    <Card 
                      key={student.id} 
                      className="cursor-pointer hover:bg-muted/50 transition-colors border"
                      onClick={() => handleStudentSelect(student)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-3">
                              <span className="flex items-center gap-1">
                                <Hash className="h-3 w-3" />
                                {student.serial_number}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {student.mobile_phone}
                              </span>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">اختيار</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchTerm.length >= 1 && searchResults?.length === 0 && !searching && (
                <div className="text-center py-4 text-muted-foreground">
                  لم يتم العثور على نتائج
                </div>
              )}
              
              {ultraFastMode && autoProcessed && (
                <div className="text-center py-2">
                  <Button onClick={handleReset} className="w-full">
                    جاهز للطالب التالي (Enter)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Info & Payment Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                معلومات الطالب والدفع
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedStudent ? (
                <>
                  {/* Student Details */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg">{selectedStudent.name}</h3>
                      <Badge variant="outline" className="text-primary">
                        #{selectedStudent.serial_number}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>الموبايل: {selectedStudent.mobile_phone}</span>
                      </div>
                      {selectedStudent.parent_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>هاتف الوالدين: {selectedStudent.parent_phone}</span>
                        </div>
                      )}
                      {selectedStudent.city && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>المدينة: {selectedStudent.city}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Registrations - preselect today's classes, with payment checkbox */}
                  <div className="space-y-3">
                    <h4 className="font-medium">التسجيلات الحالية</h4>
                    {registrations && registrations.length > 0 ? (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {registrations.map((reg) => (
                          <Card key={reg.id} className="bg-muted/30">
                            <CardContent className="p-3">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">
                                    {reg.booking?.class_code || 'غير محدد'}
                                  </div>
                                  <Badge 
                                    variant={reg.payment_status === 'paid' ? 'default' : 'destructive'}
                                  >
                                    {reg.payment_status === 'paid' ? 'مدفوع' : 
                                     reg.payment_status === 'partial' ? 'جزئي' : 'معلق'}
                                  </Badge>
                                </div>
                                
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <div>المدرس: {reg.booking?.teachers?.name || 'غير محدد'}</div>
                                  <div>القاعة: {reg.booking?.halls?.name || 'غير محدد'}</div>
                                  <div>الوقت: {reg.booking?.start_time ? formatTime(reg.booking.start_time) : 'غير محدد'}</div>
                                  <div>الأيام: {reg.booking?.days_of_week ? formatDays(reg.booking.days_of_week) : 'غير محدد'}</div>
                                </div>
 
                                <div className="flex items-center justify-between text-sm">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={!!selectedForAttendance[reg.id]}
                                      onChange={(e) => setSelectedForAttendance(prev => ({ ...prev, [reg.id]: e.target.checked }))}
                                    />
                                    <span>تأكيد حضور اليوم</span>
                                  </label>
                                  <div className="flex items-center gap-3">
                                    <span>رسوم: {reg.total_fees} LE</span>
                                    {(reg as any)._paidThisMonth ? (
                                      <Badge variant="secondary">مدفوع هذا الشهر</Badge>
                                    ) : (
                                      <label className="flex items-center gap-2">
                                        <input
                                          type="checkbox"
                                          checked={!!markPaid[reg.id]}
                                          onChange={(e) => setMarkPaid(prev => ({ ...prev, [reg.id]: e.target.checked }))}
                                        />
                                        <span>تأكيد استلام رسوم هذا الشهر</span>
                                      </label>
                                    )}
                                  </div>
                                </div>
 
                                 <div className="flex items-center justify-end gap-2 pt-2">
                                   {!ultraFastMode && (
                                     <Button size="sm" variant="default" onClick={handleConfirm}>
                                       تأكيد (Enter)
                                     </Button>
                                   )}
                                   {autoProcessed && (
                                     <div className="text-green-600 text-sm font-medium">
                                       ✓ تم المعالجة تلقائياً
                                     </div>
                                   )}
                                 </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        لا توجد تسجيلات حالية
                      </div>
                    )}
                  </div>

                  {/* Payment section removed; handled inline with full-fee confirmation */}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserPlus className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  اختر طالب من نتائج البحث لعرض المعلومات
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}