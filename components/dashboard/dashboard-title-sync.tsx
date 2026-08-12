'use client';

import { useLayoutEffect } from 'react';

import { useTranslations } from 'next-intl';

import { usePathname } from '@/l10n/navigation';

/*
  Route metadata is streamed during client-side navigation. The shared dashboard title
  can therefore briefly reach the document before the destination page's server
  metadata does, which makes the browser tab visibly flicker. Set the known destination
  title as soon as the pathname changes; the server metadata then confirms the same
  value once it arrives.
*/
export function DashboardTitleSync() {
  const pathname = usePathname();
  const l10n = useTranslations();

  useLayoutEffect(() => {
    const titles: Record<string, string> = {
      '/admin/courses': l10n('COURSES_METADATA_TITLE'),
      '/admin/courses/new': l10n('COURSES_CREATE_TITLE'),
      '/admin/notices': l10n('NOTICES_METADATA_TITLE'),
      '/admin/notices/new': l10n('NOTICES_CREATE_TITLE'),
      '/admin/schedule': l10n('SCHEDULE_METADATA_TITLE'),
      '/admin/schedule/new': l10n('SCHEDULE_CREATE_TITLE'),
      '/admin/uploads': l10n('UPLOADS_METADATA_TITLE'),
      '/admin/users': l10n('USERS_METADATA_TITLE'),
      '/admin/users/new': l10n('USERS_CREATE_TITLE'),
      '/profile': l10n('PROFILE_METADATA_TITLE'),
      '/student/materials': l10n('STUDENT_MATERIALS_METADATA_TITLE'),
      '/student/schedule': l10n('STUDENT_SCHEDULE_METADATA_TITLE'),
      '/student/teachers': l10n('STUDENT_TEACHERS_METADATA_TITLE'),
      '/teacher/courses': l10n('TEACHER_COURSES_METADATA_TITLE'),
      '/teacher/materials': l10n('MATERIALS_METADATA_TITLE'),
      '/teacher/notices': l10n('NOTICES_METADATA_TITLE'),
      '/teacher/notices/new': l10n('NOTICES_CREATE_TITLE'),
      '/teacher/schedule': l10n('TEACHER_SCHEDULE_METADATA_TITLE'),
      '/teacher/uploads': l10n('UPLOADS_METADATA_TITLE'),
    };

    document.title = titles[pathname] ?? l10n('DASHBOARD_METADATA_TITLE');
  }, [l10n, pathname]);

  return null;
}
