import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, describe, it } from "vitest";
import type firebase from "firebase/compat/app";

// firebase/compat's UploadTask is thenable but not a real Promise, which
// assertSucceeds/assertFails require — adapt it here.
function uploadPromise(task: firebase.storage.UploadTask): Promise<unknown> {
  return Promise.resolve(task);
}

// See firestore.test.ts for why this must match .firebaserc's default project.
const PROJECT_ID = "giftnest-b8253";
const DEVICE_UID = "device-abc";
const IMAGE_PATH = "families/family-main/gifticons/g1/original.jpg";

const smallImage = new Uint8Array(1024).fill(1);

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    storage: {
      rules: readFileSync("firebase/storage.rules", "utf8"),
      host: "127.0.0.1",
      port: 9199,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Storage security rules", () => {
  it("denies reads for unauthenticated clients", async () => {
    const storage = testEnv.unauthenticatedContext().storage();
    await assertFails(storage.ref(IMAGE_PATH).getDownloadURL());
  });

  it("allows an authenticated device to upload a small image", async () => {
    const storage = testEnv.authenticatedContext(DEVICE_UID).storage();
    await assertSucceeds(
      uploadPromise(storage.ref(IMAGE_PATH).put(smallImage, { contentType: "image/jpeg" }))
    );
  });

  it("rejects non-image content types", async () => {
    const storage = testEnv.authenticatedContext(DEVICE_UID).storage();
    await assertFails(
      uploadPromise(
        storage.ref("families/family-main/gifticons/g2/original.exe").put(smallImage, {
          contentType: "application/octet-stream",
        })
      )
    );
  });

  it("rejects uploads over the 15MB limit", async () => {
    const storage = testEnv.authenticatedContext(DEVICE_UID).storage();
    const oversized = new Uint8Array(16 * 1024 * 1024);
    await assertFails(
      uploadPromise(
        storage.ref("families/family-main/gifticons/g3/original.jpg").put(oversized, {
          contentType: "image/jpeg",
        })
      )
    );
  });

  it("blocks client-side updates and deletes even for authenticated devices", async () => {
    const storage = testEnv.authenticatedContext(DEVICE_UID).storage();
    await assertSucceeds(
      uploadPromise(storage.ref(IMAGE_PATH).put(smallImage, { contentType: "image/jpeg" }))
    );
    await assertFails(storage.ref(IMAGE_PATH).delete());
  });
});
