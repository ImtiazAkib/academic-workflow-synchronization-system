import { z } from 'zod';

import { userFields } from './user-fields.schema';

/*
  Four fields, and the list of what is missing is the whole security story.

  There is no `userId`: the account being edited is the one the session names, so there is
  nothing here for a hand-built request to point at somebody else's row. There is no
  `role`, no `isApproved` and no `isActive` — an account that could grant itself those
  would be a privilege escalation with a friendly form around it. And there is no `roll`,
  `registrationNo`, `session`, `semester` or `department`: those are the department's
  record of a person, not the person's own description of themselves, and correcting them
  is an administrator's job at the same moment they are already checking who somebody is.

  Nothing is filtered out downstream. The fields simply do not exist here, so a request
  naming them is not refused — it is parsed, and they are gone.

  Email is present, unlike `UserUpdateSchema`, and it is the reason this step needs a
  service method of its own: an address somebody types about themselves has to be proven
  before it is trusted, which is a different act from an administrator correcting a name.
*/
export const ProfileUpdateSchema = z.object({
  name: userFields.name,
  email: userFields.email,
  phone: userFields.phone.optional().or(z.literal('')),
  address: userFields.address.optional().or(z.literal('')),
});

export type ProfileUpdateInput = z.input<typeof ProfileUpdateSchema>;
export type ProfileUpdateOutput = z.output<typeof ProfileUpdateSchema>;
