import { UserRole } from '@/types';

export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const satisfies Record<string, UserRole>;

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  teacher: 'Teacher',
  student: 'Student',
};
