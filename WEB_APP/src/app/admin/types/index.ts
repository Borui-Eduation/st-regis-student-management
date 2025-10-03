/**
 * Admin Page Type Definitions
 */

export interface Student {
  studentId: string;
  name: string;
  email: string;
  phoneNumber?: string;
  parentName?: string;
  parentEmail?: string;
  currentCourses: number;
  completedCourses: number;
  status: string;
  enrollmentDate: string;
  createdAt: string;
  updatedAt?: string;
  school?: string;
  // 按状态筛选时的额外字段
  coursesInStatus?: number;
  enrollmentsInStatus?: StudentEnrollment[];
}

export interface StudentEnrollment {
  enrollmentId: string;
  courseName: string;
  teacherName: string;
  status: 'pending' | 'ready' | 'open' | 'rejected';
  academicYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface Enrollment {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  courseName: string;
  status: string;
  payment: {
    paid: boolean;
    amount: number;
  };
  academicYear: string;
  semester: string;
  createdAt: string;
}

export interface Stats {
  enrollments: {
    pending: number;
    ready: number;
    open: number;
    rejected: number;
    total: number;
  };
  courses: {
    active: number;
  };
  students: {
    active: number;
  };
}

export type FilterStatus = 'all' | 'pending' | 'ready' | 'open' | 'rejected';
export type SearchType = 'all' | 'name' | 'email' | 'course' | 'teacher';



