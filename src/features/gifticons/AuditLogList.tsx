"use client";

import { useAuditLogs } from "./useAuditLogs";
import { useMembers } from "@/features/members/useMembers";
import type { AuditAction } from "@/types/domain";

const ACTION_LABELS: Record<AuditAction, string> = {
  create: "등록",
  ai_analyzed: "AI 분석 완료",
  update: "정보 수정",
  plan_set: "사용 예정 설정",
  plan_changed: "사용 예정 변경",
  plan_cleared: "사용 예정 해제",
  use: "사용 완료",
  use_cancelled: "사용 완료 취소",
  delete: "삭제",
  restore: "복구",
};

export function AuditLogList({ gifticonId }: { gifticonId: string }) {
  const logs = useAuditLogs(gifticonId);
  const { members } = useMembers();

  if (logs.length === 0) {
    return <p className="text-sm text-neutral-400">변경 이력이 없습니다.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {logs.map((log) => {
        const member = members.find((m) => m.id === log.memberId);
        return (
          <li key={log.id} className="text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">{ACTION_LABELS[log.action]}</span>
            {" · "}
            {member ? `${member.avatarEmoji} ${member.name}` : "알 수 없음"}
            {" · "}
            <span className="text-neutral-400">{new Date(log.createdAt).toLocaleString("ko-KR")}</span>
          </li>
        );
      })}
    </ul>
  );
}
