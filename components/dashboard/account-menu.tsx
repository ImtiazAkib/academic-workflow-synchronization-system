'use client';

import { useTransition } from 'react';

import { ChevronDown, LogOut, UserRound } from 'lucide-react';

import { Link } from '@/l10n/navigation';

import { SESSION } from '@/constants/auth.const';
import { ROUTES } from '@/constants/routes.const';

import { signOutAction } from '@/components/auth/actions';
import {
  Avatar,
  AvatarFallback,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuLinkItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Spinner,
} from '@/components/ui';

type AccountMenuProps = {
  name: string;
  roleLabel: string;
  initials: string;
  profileLabel: string;
  signOutLabel: string;
  signingOutLabel: string;
  locale: string;
};

/*
  The account cluster in the topbar's right corner - avatar + name opening a menu with the
  profile link and sign out. Signing out clears the cookie and redirects to sign-in exactly as
  before; it just calls the `signOutAction` server action directly inside a transition rather
  than submitting a hidden form, so the click now carries a pending state through the redirect.

  The busy indicator lives on the trigger, not on the menu item: clicking a menu item closes the
  popup at once, so a spinner on it would disappear before the redirect landed. The trigger is
  the one control still on screen during the round-trip - it swaps its name for "Signing out…"
  and its chevron for a spinner, and disables itself so the menu can't be reopened mid-flight.
*/
export function AccountMenu({ name, roleLabel, initials, profileLabel, signOutLabel, signingOutLabel, locale }: AccountMenuProps) {
  const [isSigningOut, startSignOut] = useTransition();

  const handleSignOutClick = (): void => {
    /*
      `next/root-params` is unavailable inside a server action, so the locale it redirects back
      into is handed over explicitly - the same field the old hidden sign-out form carried.
    */
    const data = new FormData();
    data.set(SESSION.LOCALE_FIELD, locale);
    startSignOut(() => signOutAction(data));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2 px-2" aria-busy={isSigningOut} disabled={isSigningOut} />}>
        <Avatar className="size-6">
          <AvatarFallback className="text-[0.625rem]">{initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-32 truncate sm:inline">{isSigningOut ? signingOutLabel : name}</span>
        {isSigningOut ? <Spinner className="size-4" /> : <ChevronDown className="text-muted-foreground size-4" />}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-foreground truncate text-sm font-medium">{name}</span>
          <span className="text-muted-foreground text-xs font-normal">{roleLabel}</span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuLinkItem render={<Link href={ROUTES.PROFILE.HREF} />}>
          <UserRound />
          {profileLabel}
        </DropdownMenuLinkItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem variant="destructive" onClick={handleSignOutClick}>
          <LogOut />
          {signOutLabel}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
