import { FunctionComponent } from 'react';
import { Logo } from './Header.Logo';
import { Navbar } from './Header.Navbar';
import { BottomActions } from '@/components/organisms/Header/Header.BottomActions';

/**
 * @description A header element wrapper for the {@link Logo}, {@link Navbar}, and {@link BottomActions} (Settings and Log out).
 *
 * @see {@link Logo}
 * @see {@link Navbar}
 * @see {@link BottomActions}
 *
 * @constructor
 */
export const Header: FunctionComponent = () => {
  return (
    <header className={`flex h-full w-52 flex-col bg-base-100 p-4`}>
      <Logo />
      <Navbar />
      <BottomActions />
    </header>
  );
};
