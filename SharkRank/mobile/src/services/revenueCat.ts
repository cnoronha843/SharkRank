/**
 * SharkRank — RevenueCat Service
 * Sprint 4: Paywalls e Planos
 */

import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, CustomerInfo, PurchasesPackage } from 'react-native-purchases';

// Chaves geradas no painel do RevenueCat (Mocks por enquanto)
const API_KEYS = {
  apple: "appl_XXXX",
  google: "goog_XXXX",
};

export const ENTITLEMENT_PREMIUM = "premium_arena";

export async function setupRevenueCat(arenaId: string) {
  if (Platform.OS === 'web') {
    console.log('[RevenueCat] Web platform detected. Mocking initialization.');
    return;
  }

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  
  if (Platform.OS === 'ios') {
    Purchases.configure({ apiKey: API_KEYS.apple, appUserID: arenaId });
  } else if (Platform.OS === 'android') {
    Purchases.configure({ apiKey: API_KEYS.google, appUserID: arenaId });
  }
}

export async function getOfferings(): Promise<PurchasesPackage[]> {
  if (Platform.OS === 'web') {
    console.log('[RevenueCat] Web platform - Mocking offerings');
    return [
      {
        identifier: '$rc_monthly',
        packageType: 'MONTHLY' as any,
        product: {
          identifier: 'sharkrank_premium_month',
          description: 'Desbloqueio do Ranking Oficial',
          title: 'Premium Arena (Mensal)',
          price: 99.90,
          priceString: 'R$ 99,90',
          currencyCode: 'BRL',
          introPrice: null,
          discounts: null,
        } as any,
        offeringIdentifier: 'default',
      } as any as PurchasesPackage
    ];
  }

  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
      return offerings.current.availablePackages;
    }
    return [];
  } catch (e) {
    console.error("[RevenueCat] Error getting offerings", e);
    return [];
  }
}

export async function purchasePackage(pack: PurchasesPackage): Promise<CustomerInfo | null> {
  if (Platform.OS === 'web') {
    console.log('[RevenueCat] Web platform - Mocking purchase');
    // Emula sucesso
    return {
      entitlements: {
        active: {
          [ENTITLEMENT_PREMIUM]: {
            identifier: ENTITLEMENT_PREMIUM,
            isActive: true,
            willRenew: true,
            periodType: 'NORMAL',
            latestPurchaseDate: new Date().toISOString(),
            originalPurchaseDate: new Date().toISOString(),
            expirationDate: null,
            store: 'APP_STORE',
            productIdentifier: pack.product.identifier,
            isSandbox: true,
            unsubscribeDetectedAt: null,
            billingIssueDetectedAt: null,
          } as any
        },
        all: {}
      },
      activeSubscriptions: [pack.product.identifier],
      allPurchasedProductIdentifiers: [pack.product.identifier],
      firstSeen: new Date().toISOString(),
      originalAppUserId: 'arena-blumenau-01',
      requestDate: new Date().toISOString(),
      originalApplicationVersion: '1.0',
      originalPurchaseDate: new Date().toISOString(),
      managementURL: null,
      nonSubscriptionTransactions: [],
    } as any as CustomerInfo;
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pack);
    return customerInfo;
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error("[RevenueCat] Error purchasing", e);
    }
    return null;
  }
}

export async function checkPremiumStatus(): Promise<boolean> {
  if (Platform.OS === 'web') return false; // Default para web test

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[ENTITLEMENT_PREMIUM] !== "undefined";
  } catch (e) {
    return false;
  }
}
