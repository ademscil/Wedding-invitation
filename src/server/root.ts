import { router } from './trpc';
import { invitationRouter } from './routers/invitation';
import { guestRouter } from './routers/guest';
import { wishRouter } from './routers/wish';
import { templateRouter } from './routers/template';
import { analyticsRouter } from './routers/analytics';

export const appRouter = router({
  invitation: invitationRouter,
  guest: guestRouter,
  wish: wishRouter,
  template: templateRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
