export async function sendBark(title: string, body: string) {
  if (typeof window === "undefined") return;
  try {
    const url = localStorage.getItem("barkUrl");
    if (!url) return;
    await fetch(`${url}${encodeURIComponent(title)}/${encodeURIComponent(body)}`, { method: "POST" });
  } catch {
    /* 静默失败 */
  }
}
