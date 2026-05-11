let refreshing = false;
let lastData = {
  algorithm: "未知",
  size: "未知",
  used: "未知",
  ratio: "未知"
};
let fetchFailCount = 0;

async function refreshZram() {
  if (refreshing) return;
  refreshing = true;

  try {
    // status.json 现在输出到 webroot 根目录
    const res = await fetch("./status.json?ts=" + Date.now());
    if (!res.ok) throw new Error("状态文件不存在或服务器错误");
    const json = await res.json();

    if (!json || json.algorithm == null || json.size == null || json.used == null || json.ratio == null) {
      throw new Error("状态数据不完整");
    }

    // size / used 是原始 MB 数值字符串，autoUnit 负责格式化显示
    setStatus(json.algorithm, autoUnit(json.size), autoUnit(json.used), json.ratio, false, "状态已更新");
    lastData = {
      algorithm: json.algorithm,
      size: autoUnit(json.size),
      used: autoUnit(json.used),
      ratio: json.ratio,
      loadedOnce: true
    };
    fetchFailCount = 0;
  } catch (e) {
    fetchFailCount++;
    if (fetchFailCount === 1 && !lastData.loadedOnce) {
      setStatus("错误", "错误", "错误", "错误", false, "无法获取状态：" + e.message);
    } else if (fetchFailCount >= 3) {
      setStatus("错误", "错误", "错误", "错误", false, "连续多次无法读取状态：" + e.message);
    } else {
      // 保持上次数据，仅顶部显示小红提示
      setStatus(lastData.algorithm, lastData.size, lastData.used, lastData.ratio, false, "读取状态失败（网络或写入延迟），已自动重试…");
    }
  }

  refreshing = false;
}

// 输入为 MB 数值字符串，输出为人类可读字符串
function autoUnit(str) {
  if (!str && str !== 0) return "—";
  const n = parseFloat(str);
  if (isNaN(n)) return str;
  if (n >= 1024) return (n / 1024).toFixed(2) + " GB";
  return n.toFixed(0) + " MB";
}

function setStatus(algo, size, used, ratio, skeleton, tip) {
  ["algo", "size", "used", "ratio"].forEach((id, i) => {
    const el = document.getElementById(id);
    el.classList.remove("skeleton");
    if (skeleton) el.classList.add("skeleton");
    el.innerText = [algo, size, used, ratio][i];
  });

  let tipEl = document.getElementById("errtip");
  if (!tipEl) {
    tipEl = document.createElement("div");
    tipEl.id = "errtip";
    tipEl.style = "color:#d00;text-align:center;margin-top:8px;font-size:14px;";
    document.getElementById("zram-status").appendChild(tipEl);
  }
  tipEl.innerText = tip || "";
}

window.addEventListener("DOMContentLoaded", () => {
  setStatus("加载中...", "加载中...", "加载中...", "加载中...", true, "");
  refreshZram();
  setInterval(refreshZram, 3000); // 3秒轮询，减少无意义请求
  document.getElementById("refresh-btn")?.addEventListener("click", (e) => {
    if (refreshing) e.preventDefault();
    else refreshZram();
  });
});