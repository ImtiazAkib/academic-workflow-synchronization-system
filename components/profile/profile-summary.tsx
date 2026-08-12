import { resolveSemesterLabel } from '@/lib/utils';

import { Badge } from '@/components/ui';

import { ProfileLoginId } from './profile-login-id';

import type { ProfileCourse, ProfileFact, ProfileSummaryLabels } from './profile.types';

type ProfileSummaryProps = {
  loginId: string | null;
  facts: ProfileFact[];
  courses: ProfileCourse[] | null;
  labels: ProfileSummaryLabels;
};

/*
  Everything on this screen that somebody may read and may not change.

  The division is not cosmetic. A roll number, a session, a semester, a department, a role
  and an approval are the department's record of a person — issued by the application or
  set by an administrator at the moment they are already checking who somebody is. Showing
  them matters, because "what does the office have written down about me" is a real
  question and this is the only screen that answers it. Making them editable would be a
  privilege escalation with a friendly form around it.

  `courses` is null for everybody who is not a teacher, rather than an empty array. An
  empty list means "assigned nothing yet" and says so; a student has no such list to be
  empty, and rendering "no courses" at them would answer a question they did not ask.
*/
export function ProfileSummary({ loginId, facts, courses, labels }: ProfileSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <ProfileLoginId loginId={loginId} labels={labels.loginId} />

      <section className="border-border bg-card flex flex-col gap-4 rounded-lg border p-4 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg">{labels.recordTitle}</h2>
          <p className="text-muted-foreground text-sm">{labels.recordHint}</p>
        </div>

        <dl className="grid gap-4 sm:grid-cols-2">
          {facts.map(x => (
            <div key={x.label} className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground text-xs font-medium">{x.label}</dt>
              <dd className="text-sm">{x.value}</dd>
            </div>
          ))}
        </dl>

        {courses && (
          <div className="border-border flex flex-col gap-1.5 border-t pt-4">
            <p className="text-muted-foreground text-xs font-medium">{labels.coursesTitle}</p>

            {courses.length === 0 ? (
              <p className="text-muted-foreground text-sm">{labels.coursesEmpty}</p>
            ) : (
              <ul className="flex flex-wrap gap-1">
                {courses.slice(0, 4).map(x => (
                  <li key={x.courseId}>
                    {/* Code and year, matching the teacher directory — the titles wrap badly at this size. */}
                    <Badge variant="secondary">
                      {x.code} · {resolveSemesterLabel(x.semester)}
                    </Badge>
                  </li>
                ))}
                {courses.length > 4 && (
                  <li>
                    <Badge variant="neutral">+{courses.length - 4}</Badge>
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
