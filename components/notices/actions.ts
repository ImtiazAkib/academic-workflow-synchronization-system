'use server';

import { NoticeDto } from '@/types';

import { gateAdminArea } from '@/lib/auth';
import { SingleResult, singleFailureWithErrors } from '@/lib/result';
import { NoticeCreateSchema } from '@/lib/schemas';
import { NoticeService } from '@/lib/services';
import { mapZodErrorsToErrorDto } from '@/lib/utils';

const noticeService = new NoticeService();

/**
 * Publish a notice.
 *
 * Gated with the shared admin-area gate rather than a check of its own — a Server Action
 * is a public endpoint, and the screen that only an administrator can open proves nothing
 * about who is posting to it. Publishing to the whole department is exactly the kind of
 * write that would matter if the gate were forgotten.
 *
 * There is no read action here. Every list on this feature is fetched by a server
 * component, so the audience filter runs before anything is sent to a browser; an action
 * that returned notices would be a second, unguarded way to ask for them.
 *
 * @param values - Raw form values, validated here rather than trusted.
 *
 * @returns The published notice, or a failure carrying the reason's code.
 */
export async function createNoticeAction(values: unknown): Promise<SingleResult<NoticeDto>> {
  const gate = await gateAdminArea<NoticeDto>();

  if (!gate.allowed) {
    return gate.refusal;
  }

  const validation = NoticeCreateSchema.safeParse(values);

  if (!validation.success) {
    return singleFailureWithErrors(mapZodErrorsToErrorDto(validation.error));
  }

  return noticeService.create(validation.data, gate.requester);
}
