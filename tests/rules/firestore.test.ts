import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// Must match .firebaserc's default project — firebase.json runs the
// emulator suite in singleProjectMode, which warns (and, in low-memory
// environments, has been observed to crash the emulator) if a test uses a
// different project id than the one the emulator was started for.
const PROJECT_ID = "giftnest-b8253";
const FAMILY_ID = "family-main";
const DEVICE_UID = "device-abc";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firebase/firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await db.doc(`families/${FAMILY_ID}/members/m1`).set({ id: "m1", name: "아빠", isActive: true });
    await db
      .doc(`families/${FAMILY_ID}/gifticons/g1`)
      .set({ id: "g1", brand: "스타벅스", status: "available" });
    await db.doc(`families/${FAMILY_ID}/settings/app`).set({ familyPinHash: "secret-hash" });
    await db.doc(`families/${FAMILY_ID}/authAttempts/${DEVICE_UID}`).set({ failCount: 1 });
  });
});

describe("Firestore security rules", () => {
  it("denies all reads and writes for unauthenticated clients", async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertFails(db.doc(`families/${FAMILY_ID}/members/m1`).get());
    await assertFails(db.doc(`families/${FAMILY_ID}/gifticons/g1`).get());
    await assertFails(db.doc(`families/${FAMILY_ID}/gifticons/g2`).set({ brand: "hacked" }));
  });

  it("allows an authenticated family device to read shared collections", async () => {
    const db = testEnv.authenticatedContext(DEVICE_UID).firestore();
    await assertSucceeds(db.doc(`families/${FAMILY_ID}/members/m1`).get());
    await assertSucceeds(db.doc(`families/${FAMILY_ID}/gifticons/g1`).get());
  });

  it("blocks direct client writes even from an authenticated family device", async () => {
    const db = testEnv.authenticatedContext(DEVICE_UID).firestore();
    await assertFails(db.doc(`families/${FAMILY_ID}/gifticons/g1`).update({ status: "used" }));
    await assertFails(db.doc(`families/${FAMILY_ID}/gifticons/g1`).delete());
    await assertFails(db.doc(`families/${FAMILY_ID}/members/m1`).update({ name: "변경" }));
  });

  it("denies access to a different familyId even when authenticated", async () => {
    const db = testEnv.authenticatedContext(DEVICE_UID).firestore();
    await assertFails(db.doc("families/some-other-family/gifticons/g1").get());
  });

  it("never exposes settings (PIN hash) or authAttempts to any client", async () => {
    const authed = testEnv.authenticatedContext(DEVICE_UID).firestore();
    await assertFails(authed.doc(`families/${FAMILY_ID}/settings/app`).get());
    await assertFails(authed.doc(`families/${FAMILY_ID}/authAttempts/${DEVICE_UID}`).get());

    const anon = testEnv.unauthenticatedContext().firestore();
    await assertFails(anon.doc(`families/${FAMILY_ID}/settings/app`).get());
  });
});

describe("sanity", () => {
  it("seeded fixtures exist", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const snap = await context.firestore().doc(`families/${FAMILY_ID}/members/m1`).get();
      expect(snap.exists).toBe(true);
    });
  });
});
