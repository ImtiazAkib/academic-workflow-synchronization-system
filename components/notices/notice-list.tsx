import { NoticeCard } from './notice-card';
import { NoticesEmpty } from './notices-empty';

import type { NoticeListLabels, NoticeView } from './notices.types';

type NoticeListProps = {
  notices: NoticeView[];
  labels: NoticeListLabels;
  /** Dashboard feeds show a quick preview; archive pages show the complete notice. */
  preview?: boolean;
  canDelete?: boolean;
};

/*
  Cards in a column rather than rows in a table, unlike every other admin list in the app.
  A notice is a paragraph of prose, and prose in a table cell either wraps into an
  unreadable column or gets truncated into uselessness - which for an announcement means
  the screen shows that something was said without showing what.

  The same list serves the admin screen and the feed on each role's home, so the two can
  never disagree about how a notice looks. What differs is only which notices the server
  put in the array, and that decision lives in `NoticeService`, not here.
*/
export function NoticeList({ notices, labels, preview = false, canDelete = false }: NoticeListProps) {
  if (notices.length === 0) {
    return <NoticesEmpty title={labels.emptyTitle} description={labels.emptyDescription} />;
  }

  return (
    <div className="flex max-w-full min-w-0 flex-col gap-3">
      {notices.map(x => (
        <NoticeCard key={x.noticeId} notice={x} labels={labels} preview={preview} canDelete={canDelete} />
      ))}
    </div>
  );
}
