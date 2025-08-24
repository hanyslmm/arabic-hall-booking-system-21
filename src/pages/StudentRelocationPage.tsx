import { UnifiedLayout } from "@/components/layout/UnifiedLayout";
import { StudentRelocationManager } from "@/components/student/StudentRelocationManager";

export default function StudentRelocationPage() {
  return (
    <UnifiedLayout>
      <StudentRelocationManager />
    </UnifiedLayout>
  );
}