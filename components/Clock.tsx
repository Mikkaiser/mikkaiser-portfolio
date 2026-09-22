"use client";

import { useEffect, useState } from "react";

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dubai", hour: "numeric", minute: "2-digit", hour12: true });

export function Clock() {
  // Rendered empty on the server so the static HTML never carries a stale time.
  const [now, setNow] = useState("");
  useEffect(() => {
    const tick = () => setNow(fmt.format(new Date()).toUpperCase());
    tick();
    const t = setInterval(tick, 15000);
    return () => clearInterval(t);
  }, []);
  return <div className="foot__clock" aria-label="Current time in Abu Dhabi">{now}</div>;
}
