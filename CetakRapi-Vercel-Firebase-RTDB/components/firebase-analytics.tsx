'use client';

import { useEffect } from 'react';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseApp } from '@/lib/firebase/client';

export function FirebaseAnalytics() {
  useEffect(() => {
    void isSupported().then((supported) => {
      if (supported && process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) getAnalytics(firebaseApp);
    });
  }, []);

  return null;
}
