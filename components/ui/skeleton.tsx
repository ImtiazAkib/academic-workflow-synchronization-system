import { cn } from '@/lib/utils';

/**
 * A grey block that pulses while the real thing is on its way.
 *
 * Three of these hand-written divs were the whole of the app's loading vocabulary until
 * step 15b; making it a primitive is what lets each route describe its own shape without
 * repeating the classes eighteen times.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="skeleton" className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />;
}

export { Skeleton };
