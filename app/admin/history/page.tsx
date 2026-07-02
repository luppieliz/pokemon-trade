"use client";

import AdminGate from "@/components/AdminGate";
import AdminNav from "@/components/AdminNav";
import EnquiriesView from "@/components/EnquiriesView";

export default function HistoryPage() {
  return (
    <AdminGate>
      {(password, lock) => (
        <>
          <AdminNav current="history" onLock={lock} />
          <EnquiriesView password={password} />
        </>
      )}
    </AdminGate>
  );
}
