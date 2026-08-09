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

  `all` is the default variant and the other two are `secondary`, so a department-wide
  notice reads as the louder of the two at a glance rather than needing the label read.
*/
export function NoticeBadge({ audience, label }: NoticeBadgeProps) {
  return <Badge variant={audience === NOTICE_AUDIENCES.ALL ? 'default' : 'secondary'}>{label}</Badge>;
}
