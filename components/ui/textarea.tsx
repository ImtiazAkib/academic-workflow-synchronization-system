import { cn } from '@/lib/utils';

/*
  The same border, focus ring and invalid treatment as `Input`, so a form that mixes the
  two does not look like it was assembled from two design systems. Only the height rules
  differ: a minimum rather than a fixed one, and `field-sizing-content` so the box grows
  with what is typed instead of making somebody write a five-paragraph announcement
  through a four-line window.
*/
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-background text-foreground placeholder:text-muted-foreground flex field-sizing-content min-h-24 w-full rounded-md border px-3 py-2 text-sm transition-colors',
        'focus-visible:border-ring focus-visible:ring-ring/50 outline-none focus-visible:ring-[3px]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'aria-invalid:border-destructive aria-invalid:ring-destructive/20',
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
