import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import Purchases, { type PurchasesPackage } from "react-native-purchases";
import {
  getGetMySubscriptionQueryOptions,
  getGetMyProfileViewsQueryOptions,
  useSyncSubscription,
} from "@workspace/api-client-react";
import type { CustomerInfo } from "react-native-purchases";
import { Button, Card, H1, H2, Muted } from "@/components/UI";
import { useTheme, type Theme } from "@/lib/theme";
import { formatDateTr } from "@/lib/format";
import { useAuth } from "@/lib/auth";
import { useSubscription } from "@/lib/revenuecat";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const FEATURES_EMPLOYER = [
  { icon: "search", text: "Sınırsız arama ve filtreleme" },
  { icon: "trending-up", text: "İlanlarınız öne çıksın" },
  { icon: "users", text: "İş arayan listelerinde Premium rozeti" },
];

const FEATURES_WORKER = [
  { icon: "eye", text: "Profilinizi kim görüntüledi görün" },
  { icon: "award", text: "Premium rozeti ve +N ay göstergesi" },
  { icon: "trending-up", text: "İşveren akışında üst sıralarda yer alın" },
];

export default function PremiumScreen() {
  const theme = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const router = useRouter();
  const auth = useAuth();
  const qc = useQueryClient();
  const { offerings, isSubscribed, customerInfo, purchase, restore, isPurchasing, isRestoring, isLoading } =
    useSubscription();

  const [confirmPkg, setConfirmPkg] = useState<PurchasesPackage | null>(null);
  const syncSub = useSyncSubscription();

  const features = auth.user?.role === "worker" ? FEATURES_WORKER : FEATURES_EMPLOYER;

  const packages = offerings?.current?.availablePackages ?? [];

  const expiresAt = customerInfo?.entitlements.active?.["premium"]?.expirationDate;
  const monthsActive = customerInfo?.entitlements.active?.["premium"]
    ? Math.ceil(
        (new Date().getTime() -
          new Date(
            customerInfo.entitlements.active["premium"].originalPurchaseDate,
          ).getTime()) /
          (1000 * 60 * 60 * 24 * 30),
      )
    : 0;

  const syncToBackend = async (info: CustomerInfo) => {
    const entitlement = info.entitlements.active?.["premium"];
    const isActive = !!entitlement;
    const result = await syncSub.mutateAsync({
      data: {
        tier: isActive ? "premium" : "free",
        productId: entitlement?.productIdentifier,
        purchasedAt: entitlement?.originalPurchaseDate
          ? new Date(entitlement.originalPurchaseDate).toISOString()
          : undefined,
        expiresAt: entitlement?.expirationDate
          ? new Date(entitlement.expirationDate).toISOString()
          : undefined,
        autoRenew: entitlement?.willRenew,
      },
    });
    if (auth.user) {
      await auth.setUser({ ...auth.user, subscriptionTier: result.tier });
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: getGetMySubscriptionQueryOptions().queryKey }),
      qc.invalidateQueries({ queryKey: getGetMyProfileViewsQueryOptions().queryKey }),
    ]);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setConfirmPkg(null);
    try {
      const info = await purchase(pkg);
      await syncToBackend(info);
      Alert.alert("Başarılı", "Premium üyeliğiniz aktif edildi!");
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String(err.message)
          : "Bilinmeyen hata";
      if (!msg.includes("userCancelled")) {
        Alert.alert("Hata", "Satın alma başarısız oldu: " + msg);
      }
    }
  };

  const handleRestore = async () => {
    try {
      const info = await restore();
      await syncToBackend(info);
      Alert.alert("Tamamlandı", "Satın alımlarınız geri yüklendi.");
    } catch {
      Alert.alert("Hata", "Geri yükleme başarısız oldu.");
    }
  };

  return (
    <>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroBadge}>
            <Feather name="award" size={28} color="#fff" />
          </View>
          <H1 style={{ color: "#fff" }}>Premium Üyelik</H1>
          <Text style={styles.heroSub}>
            {auth.user?.role === "worker"
              ? "Daha fazla teklif alın, profilinize ilgi çekin."
              : "Daha hızlı iş arayan bulun, ilanlarınızı öne çıkarın."}
          </Text>
        </View>

        {isSubscribed ? (
          <Card style={{ borderColor: theme.colors.premium, borderWidth: 1.5 }}>
            <H2>Premium Aktif ✓</H2>
            <Muted>
              {expiresAt
                ? `Bitiş: ${formatDateTr(expiresAt)} · ${monthsActive} ay aktif`
                : "Üyeliğiniz aktif"}
            </Muted>
          </Card>
        ) : null}

        <Card>
          <H2>Avantajlar</H2>
          <View style={{ marginTop: 8, gap: 10 }}>
            {features.map((f) => (
              <View key={f.text} style={styles.featRow}>
                <View style={styles.featIcon}>
                  <Feather
                    name={f.icon as FeatherIconName}
                    size={16}
                    color={theme.colors.premium}
                  />
                </View>
                <Text style={styles.featText}>{f.text}</Text>
              </View>
            ))}
          </View>
        </Card>

        {!isSubscribed ? (
          <View style={{ gap: 10 }}>
            <H2>Planlar</H2>

            {isLoading ? (
              <Muted style={{ textAlign: "center" }}>Planlar yükleniyor…</Muted>
            ) : packages.length === 0 ? (
              <Muted style={{ textAlign: "center" }}>
                Şu an satın alma mevcut değil.
              </Muted>
            ) : (
              packages.map((pkg) => {
                const product = pkg.product;
                const badge =
                  pkg.packageType === Purchases.PACKAGE_TYPE.ANNUAL
                    ? "%30 Tasarruf"
                    : pkg.packageType === Purchases.PACKAGE_TYPE.THREE_MONTH
                      ? "Popüler"
                      : undefined;
                return (
                  <View key={pkg.identifier} style={styles.plan}>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: "row",
                          gap: 8,
                          alignItems: "center",
                        }}
                      >
                        <Text style={styles.planTitle}>
                          {product.title || pkg.identifier}
                        </Text>
                        {badge ? (
                          <View style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>{badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.planPrice}>
                        {product.priceString}
                      </Text>
                    </View>
                    <Button
                      title="Satın al"
                      onPress={() => setConfirmPkg(pkg)}
                      loading={isPurchasing}
                    />
                  </View>
                );
              })
            )}

            <Muted style={{ textAlign: "center", marginTop: 4 }}>
              Abonelik otomatik yenilenir. App Store / Google Play üzerinden
              istediğiniz zaman iptal edebilirsiniz.
            </Muted>

            <TouchableOpacity
              onPress={handleRestore}
              disabled={isRestoring}
              style={{ alignItems: "center", paddingVertical: 8 }}
            >
              <Text
                style={{
                  color: theme.colors.primary,
                  fontFamily: theme.font.medium,
                  fontSize: 14,
                }}
              >
                {isRestoring ? "Geri yükleniyor…" : "Satın alımlarımı geri yükle"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      {/* Purchase confirmation modal */}
      <Modal
        visible={confirmPkg !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmPkg(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Satın almayı onayla</Text>
            {confirmPkg && (
              <>
                <Text style={styles.modalBody}>
                  <Text style={{ fontFamily: theme.font.bold }}>
                    {confirmPkg.product.title}
                  </Text>
                  {" — "}
                  {confirmPkg.product.priceString}
                </Text>
                <Text style={styles.modalSub}>
                  Bu işlem {confirmPkg.product.priceString} tutarında ücretlendirilecek.
                </Text>
              </>
            )}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <Button
                title="İptal"
                variant="ghost"
                onPress={() => setConfirmPkg(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Satın al"
                onPress={() => confirmPkg && handlePurchase(confirmPkg)}
                loading={isPurchasing}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function makeStyles(theme: Theme) {
  return StyleSheet.create({
    container: { padding: theme.spacing.lg, gap: 14, paddingBottom: 80 },
    hero: {
      backgroundColor: theme.colors.premium,
      padding: theme.spacing.xl,
      borderRadius: theme.radius.xl,
      alignItems: "center",
      gap: 8,
    },
    heroBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.2)",
      alignItems: "center",
      justifyContent: "center",
    },
    heroSub: {
      color: "#fff",
      opacity: 0.9,
      textAlign: "center",
      fontFamily: theme.font.regular,
    },
    featRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    featIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${theme.colors.premium}1A`,
      alignItems: "center",
      justifyContent: "center",
    },
    featText: {
      flex: 1,
      fontFamily: theme.font.medium,
      color: theme.colors.text,
    },
    plan: {
      backgroundColor: theme.colors.card,
      padding: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    },
    planTitle: {
      fontFamily: theme.font.bold,
      fontSize: 16,
      color: theme.colors.text,
    },
    planPrice: {
      fontFamily: theme.font.semibold,
      color: theme.colors.premium,
      fontSize: 14,
    },
    planBadge: {
      backgroundColor: `${theme.colors.premium}1A`,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: theme.radius.full,
    },
    planBadgeText: {
      color: theme.colors.premium,
      fontSize: 10,
      fontFamily: theme.font.bold,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalBox: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.radius.xl,
      padding: 24,
      width: "100%",
      maxWidth: 380,
    },
    modalTitle: {
      fontFamily: theme.font.bold,
      fontSize: 18,
      color: theme.colors.text,
      marginBottom: 8,
    },
    modalBody: {
      fontFamily: theme.font.regular,
      fontSize: 15,
      color: theme.colors.text,
    },
    modalSub: {
      fontFamily: theme.font.regular,
      fontSize: 13,
      color: theme.colors.subtext,
      marginTop: 4,
    },
  });
}
