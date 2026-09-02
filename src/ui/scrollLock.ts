import { createContext, useContext } from 'react';

type ScrollLock = {
  lock: () => void;
  unlock: () => void;
};

export const ScrollLockContext = createContext<ScrollLock>({
  lock: () => undefined,
  unlock: () => undefined,
});

export function useScrollLock(): ScrollLock {
  return useContext(ScrollLockContext);
}
