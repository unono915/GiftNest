import { FAMILY_ID } from "./config";

export const familyPath = () => `families/${FAMILY_ID}`;
export const membersPath = () => `${familyPath()}/members`;
export const devicesPath = () => `${familyPath()}/devices`;
export const gifticonsPath = () => `${familyPath()}/gifticons`;
export const auditLogsPath = () => `${familyPath()}/auditLogs`;
export const notificationLogsPath = () => `${familyPath()}/notificationLogs`;
export const settingsPath = () => `${familyPath()}/settings/app`;
export const authAttemptsPath = () => `${familyPath()}/authAttempts`;
