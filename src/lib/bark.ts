export async function sendBark(title: string, body: string) {
  if (typeof window === "undefined") return;
  try {
    // 先查 localStorage（兼容旧数据），再查 API
    let url = localStorage.getItem("barkUrl") || "";
    if (!url) {
      try {
        const res = await fetch("/api/user/settings");
        if (res.ok) {
          const data = await res.json();
          url = data.barkUrl || "";
        }
      } catch {
        /* 获取 API 失败，忽略 */
      }
    }
    if (!url) return;
    await fetch(`${url}${encodeURIComponent(title)}/${encodeURIComponent(body)}`, { method: "POST" });
  } catch {
    /* 静默失败 */
  }
}
