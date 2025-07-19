export const queryKeys = {
  // Auth
  profile: (userId: string) => ['profile', userId],
  
  // Students
  students: () => ['students'],
  student: (id: string) => ['student', id],
  studentSearch: (term: string) => ['students', 'search', term],
  
  // Bookings
  bookings: () => ['bookings'],
  booking: (id: string) => ['booking', id],
  bookingsFiltered: (hallId?: string, teacherId?: string) => ['bookings', { hallId, teacherId }],
  
  // Registrations
  registrations: () => ['registrations'],
  registration: (id: string) => ['registration', id],
  registrationsByBooking: (bookingId: string) => ['registrations', 'booking', bookingId],
  
  // Teachers
  teachers: () => ['teachers'],
  teacher: (id: string) => ['teacher', id],
  
  // Halls
  halls: () => ['halls'],
  hall: (id: string) => ['hall', id],
  hallOccupancy: () => ['hall-occupancy'],
  
  // Stages
  stages: () => ['stages'],
  stage: (id: string) => ['stage', id],
  
  // Subjects
  subjects: () => ['subjects'],
  subject: (id: string) => ['subject', id],
  
  // Attendance
  attendance: () => ['attendance'],
  attendanceByRegistration: (registrationId: string) => ['attendance', 'registration', registrationId],
  
  // Payments
  payments: () => ['payments'],
  paymentsByRegistration: (registrationId: string) => ['payments', 'registration', registrationId],
  
  // Reports
  financialReports: () => ['financial-reports'],
  
  // Users
  users: () => ['users'],
  user: (id: string) => ['user', id],
} as const;