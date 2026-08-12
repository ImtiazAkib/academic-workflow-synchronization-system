import { NOTICE_AUDIENCES } from '@/constants/notice.const';

import { Badge } from '@/components/ui';

type NoticeBadgeProps = {
  audience: string;
  label: string;
};

/*
  Who the notice was addressed to, on every card including the ones in a reader's own feed.

  Worth showing there and not only on the admin screen: "everyone" and "students" are
  different messages even when they reach the same person, and a student who cannot tell a
  department-wide announcement from one aimed at them has lost the only piece of context
  the audience field carries.

  `all` is informational rather than primary: department-wide notices are important
  context, not a call to action competing with the notice itself.
*/
export function NoticeBadge({ audience, label }: NoticeBadgeProps) {
  return <Badge variant={audience === NOTICE_AUDIENCES.ALL ? 'info' : 'secondary'}>{label}</Badge>;
}
