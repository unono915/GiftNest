export type GifticonCategory =
  | "cafe"
  | "convenience_store"
  | "bakery"
  | "restaurant"
  | "delivery_food"
  | "dessert"
  | "cinema_culture"
  | "shopping"
  | "other"
  | "unknown";

export type ExpirationType = "usage_deadline" | "exchange_deadline" | "unknown";

export type GifticonStatus =
  | "available"
  | "planned"
  | "used"
  | "expired"
  | "needs_review"
  | "archived";

export type GifticonConfidence = {
  overall: number | null;
  brand: number | null;
  productName: number | null;
  category: number | null;
  expirationDate: number | null;
};

export type Gifticon = {
  id: string;
  familyId: string;

  imagePath: string;
  thumbnailPath: string | null;
  imageHash: string | null;

  brand: string | null;
  normalizedBrand: string | null;
  productName: string | null;
  category: GifticonCategory;
  faceValue: number | null;
  quantity: number | null;

  expirationDate: string | null;
  expirationRawText: string | null;
  expirationType: ExpirationType;

  status: GifticonStatus;
  needsReview: boolean;
  reviewReasons: string[];

  aiModel: string | null;
  aiConfidence: GifticonConfidence;
  aiWarnings: string[];

  plannedMemberId: string | null;
  plannedAt: string | null;
  plannedNote: string | null;

  usedMemberId: string | null;
  usedAt: string | null;
  usedNote: string | null;

  memo: string | null;

  createdByMemberId: string;
  createdByDeviceId: string;
  createdAt: string;
  updatedAt: string;

  archivedAt: string | null;
  deletedAt: string | null;
};

export type Member = {
  id: string;
  familyId: string;
  name: string;
  avatarEmoji: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Device = {
  id: string;
  familyId: string;
  authUid: string;
  memberId: string;
  name: string;
  fcmTokens: string[];
  notificationsEnabled: boolean;
  lastSeenAt: string;
  createdAt: string;
  revokedAt: string | null;
};

export type NotificationType =
  | "expiry_d7"
  | "expiry_d3"
  | "expiry_d1"
  | "expiry_today"
  | "expired"
  | "plan_day_before"
  | "plan_today";

export type NotificationLog = {
  id: string;
  familyId: string;
  gifticonId: string;
  deviceId: string;
  type: NotificationType;
  targetDate: string;
  sentAt: string;
  status: "sent" | "failed" | "skipped";
};

export type AuditAction =
  | "create"
  | "ai_analyzed"
  | "update"
  | "plan_set"
  | "plan_changed"
  | "plan_cleared"
  | "use"
  | "use_cancelled"
  | "delete"
  | "restore";

export type AuditLog = {
  id: string;
  familyId: string;
  gifticonId: string;
  memberId: string;
  deviceId: string;
  action: AuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  createdAt: string;
};

export const CATEGORY_LABELS: Record<GifticonCategory, string> = {
  cafe: "카페",
  convenience_store: "편의점",
  bakery: "베이커리",
  restaurant: "외식",
  delivery_food: "배달·간편식",
  dessert: "디저트",
  cinema_culture: "영화·문화",
  shopping: "쇼핑·상품권",
  other: "기타",
  unknown: "확인 필요",
};

export const STATUS_LABELS: Record<GifticonStatus, string> = {
  available: "사용 가능",
  planned: "사용 예정",
  used: "사용 완료",
  expired: "기한 만료",
  needs_review: "확인 필요",
  archived: "보관",
};
