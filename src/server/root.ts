import { router } from './trpc';
import { invitationRouter } from './routers/invitation';
import { guestRouter } from './routers/guest';
import { wishRouter } from './routers/wish';
import { templateRouter } from './routers/template';
import { analyticsRouter } from './routers/analytics';
import { adminRouter } from './routers/admin';
import { paymentRouter } from './routers/payment';
import { checkinRouter } from './routers/checkin';
import { userRouter } from './routers/user';

export const appRouter = router({
  invitation: invitationRouter,
  guest: guestRouter,
  wish: wishRouter,
  template: templateRouter,
  analytics: analyticsRouter,
  admin: adminRouter,
  payment: paymentRouter,
  checkin: checkinRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
