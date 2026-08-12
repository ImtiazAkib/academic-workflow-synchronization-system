'use client';

import { useRef } from 'react';

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
} from '@/components/ui';

type AccountMenuProps = {
  name: string;
  roleLabel: string;
  initials: string;
  profileLabel: string;
  signOutLabel: string;
  locale: string;
};

/*
  The account cluster in the topbar's right corner - avatar + name opening a menu with the
  profile link and sign out, replacing the old naked always-visible sign-out button. Sign out
  stays the app's server-action form (so it clears the cookie and redirects the same way); the
  menu item just submits that hidden form, so the whole thing is one click inside the menu
  rather than a button competing for space in the bar.
*/
export function AccountMenu({ name, roleLabel, initials, profileLabel, signOutLabel, locale }: AccountMenuProps) {
  const signOutFormRef = useRef<HTMLFormElement>(null);

  const handleSignOutClick = (): void => {
    signOutFormRef.current?.requestSubmit();
  };

  return (
    <>
      <form ref={signOutFormRef} action={signOutAction} className="hidden">
        <input type="hidden" name={SESSION.LOCALE_FIELD} value={locale} />
      </form>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2 px-2" />}>
          <Avatar className="size-6">
            <AvatarFallback className="text-[0.625rem]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-32 truncate sm:inline">{name}</span>
          <ChevronDown className="text-muted-foreground size-4" />
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
    </>
  );
}
