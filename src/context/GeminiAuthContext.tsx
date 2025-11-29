/**
 * Gemini Auth Context
 *
 * This component wires up Clerk authentication with the Gemini service.
 * It provides the session token to the gemini.ts service so that all
 * API calls include proper authentication.
 *
 * Must be used inside a Clerk SignedIn context.
 */

import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setSessionTokenGetter } from '../services/gemini';

interface GeminiAuthProviderProps {
  children: ReactNode;
}

export const GeminiAuthProvider = ({ children }: GeminiAuthProviderProps) => {
  const { getToken } = useAuth();

  useEffect(() => {
    // Set up the session token getter for the Gemini service
    // This allows gemini.ts to get fresh tokens for each API call
    setSessionTokenGetter(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.error('Failed to get session token:', error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
};

export default GeminiAuthProvider;
