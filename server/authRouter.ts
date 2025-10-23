/**
 * Simple authentication router for admin dashboard
 */

import { z } from 'zod';
import { publicProcedure, router } from './_core/trpc';
import { 
  verifyAdminCredentials, 
  createAdminToken, 
  setAdminCookie, 
  clearAdminCookie,
  getAdminFromRequest 
} from './_core/simpleAuth';
import { TRPCError } from '@trpc/server';

export const authRouter = router({
  /**
   * Get current admin user
   */
  me: publicProcedure.query(async ({ ctx }) => {
    const admin = await getAdminFromRequest(ctx.req);
    return admin;
  }),

  /**
   * Admin login
   */
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { email, password } = input;

      const isValid = await verifyAdminCredentials(email, password);

      if (!isValid) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Invalid email or password',
        });
      }

      const token = await createAdminToken(email);
      setAdminCookie(ctx.res, token);

      return {
        success: true,
        user: {
          email,
          role: 'admin' as const,
        },
      };
    }),

  /**
   * Admin logout
   */
  logout: publicProcedure.mutation(({ ctx }) => {
    clearAdminCookie(ctx.res);
    return { success: true };
  }),
});

