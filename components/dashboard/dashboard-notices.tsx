import { getFormatter, getTranslations } from 'next-intl/server';

import { UserRole } from '@/types';

import { NoticeService, UserService } from '@/lib/services';
import { resolveNoticeAudienceLabel } from '@/lib/utils';

import { NoticeList } from '@/components/notices';
import type { NoticeView } from '@/components/notices';

import type { NoticeDto } from '@/types';

type DashboardNoticesProps = {
  role: UserRole;
  /** How many to show. `null` is every one of them - the admin screen's archive. */
  limit?: number | null;
  /**
   * The viewer's intake, for a student. Threaded in because the session token does not
   * carry it, and it is what lets a session notice reach the batch it names.
   */
  viewerSession?: string | null;
  /**
   * List one account's own notices rather than the viewer's feed. The teacher notices
   * screen passes their id, so an author sees what they published even when it was
   * addressed to students and would never come back through their own feed.
   */
  publisherId?: string;
};

const noticeService = new NoticeService();
const userService = new UserService();

/**
 * How many notices a dashboard shows before it stops being a dashboard.
 *
 * The home screen answers "what should I know today", not "what has ever been announced".
 * The admin screen passes its own limit - none - because that one is the archive.
 */
const FEED_LIMIT = 5;

/*
  The notices feed, on every role's home and on the admin screen, built once here.

  An async server component rather than a client component handed props, and that is what
  makes the audience rule enforceable rather than decorative. The filtering happens in
  `NoticeService.listForRole()`, on the server, before anything crosses to the browser - so a
  student's dashboard is never sent a teachers-only notice to hide. A feed that fetched
  everything and filtered in the browser would have already disclosed it.

  It looks up its own copy with `getTranslations()` instead of taking a label bundle. The
  three home pages render this identically, and threading three dozen strings through each
  of them would be three chances to pass the wrong one.
*/
export async function DashboardNotices({ role, limit = FEED_LIMIT, viewerSession = null, publisherId }: DashboardNoticesProps) {
  const l10n = await getTranslations();
  const format = await getFormatter();

  const noticeResult = publisherId
    ? await noticeService.listForPublisher(publisherId, limit)
    : await noticeService.listForRole(role, viewerSession, limit);

  /*
    A read that failed must not arrive at the same screen as a department with nothing to
    say. `listFailure` carries an empty array, so passing it straight through would render
    "nothing announced yet" over a database that simply could not be reached - and an
    urgent notice would be invisible behind a sentence saying there are none.

    Said inline rather than thrown. The dashboard's error boundary would take the whole
    home screen down, and a student's timetable is still worth reading when the notice
    feed is not available.
  */
  if (!noticeResult.success) {
    return (
      <p role="alert" className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
        {l10n('NOTICES_UNAVAILABLE')}
      </p>
    );
  }

  const notices = noticeResult.result;

  /*
    One query for every publisher on the page, rather than one per notice. Distinct,
    because a department where one administrator writes everything is the normal case.
  */
  const publisherResult = await userService.listByIds([...new Set(notices.map(x => x.publishedById))]);
  const publishers = publisherResult.result;

  const audiences = {
    all: l10n('NOTICES_AUDIENCE_ALL'),
    teachers: l10n('NOTICES_AUDIENCE_TEACHERS'),
    students: l10n('NOTICES_AUDIENCE_STUDENTS'),
  };

  const toView = (notice: NoticeDto): NoticeView => ({
    noticeId: notice.noticeId,
    title: notice.title,
    body: notice.body,
    /*
      Built here rather than stored, because it is derived: a notice either has a picture
      or it does not, and the route that serves one is a fact about the app rather than
      about the notice. The DTO reports `hasImage` and withholds the storage key.
    */
    imageUrl: notice.hasImage ? `/api/notices/${notice.noticeId}/image` : null,
    audience: notice.audience,
    audienceLabel: resolveNoticeAudienceLabel(notice.audience, audiences),
    category: notice.category,
    sessions: notice.sessions,
    /*
      Formatted here and passed down as a string. `getFormatter()` knows the request's
      locale and the department's timezone; the browser knows the visitor's, which for a
      date published at 00:30 in Dhaka is a different day.
    */
    publishedOn: format.dateTime(new Date(notice.publishedAt), 'short'),
    publisherName: publishers.find(x => x.userId === notice.publishedById)?.name ?? null,
  });

  return (
    <NoticeList
      notices={notices.map(toView)}
      preview={limit !== null}
      labels={{
        emptyTitle: l10n('NOTICES_EMPTY_TITLE'),
        emptyDescription: l10n('NOTICES_EMPTY_DESCRIPTION'),
        publishedBy: l10n('NOTICES_PUBLISHED_BY'),
        unknownPublisher: l10n('NOTICES_PUBLISHER_UNKNOWN'),
        sessionsLabel: l10n('NOTICES_SESSIONS_LABEL'),
      }}
    />
  );
}
