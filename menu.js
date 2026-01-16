const menuBtn = document.querySelector(".dropdown-btn");
const dropdownMenu = document.querySelector(".dropdown-menu");

const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebar-overlay");

if (sidebarToggle && sidebar && sidebarOverlay) {
    sidebarToggle.addEventListener("click", () => {
        sidebar.classList.toggle("show");
        sidebarOverlay.classList.toggle("show");
        sidebarToggle.textContent = sidebar.classList.contains("show") ? "✕" : "☰";
    });

    sidebarOverlay.addEventListener("click", () => {
        sidebar.classList.remove("show");
        sidebarOverlay.classList.remove("show");
        sidebarToggle.textContent = "☰";
    });
}

/** 메뉴 버튼 클릭 */
menuBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.classList.toggle("show");
});

/** 다른 곳 클릭하면 닫기 */
document.addEventListener("click", (e) => {
    if (e.target.closest("a") || (!e.target.closest(".dropdown-menu") && !e.target.closest(".dropdown-btn"))) {
        dropdownMenu.classList.remove("show");
    }
});

/** jar 화면 */
const jarTypeSelect = document.getElementById("jar-type");
const versionInput = document.getElementById("minecraft-version");
const versionList = document.getElementById("version-list");
const downloadBtn = document.getElementById("jar-download");

if (versionList && versionInput && downloadBtn) {
    let versions = [];

    fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json")
        .then((res) => res.json())
        .then((data) => {
            versions = data.versions.map((v) => v.id);
            renderVersionList();
        });

    function renderVersionList() {
        versionList.innerHTML = "";
        versions.slice(0, versions.length - 61).forEach((v) => {
            const li = document.createElement("li");
            li.textContent = v;
            li.addEventListener("click", () => {
                versionInput.value = v;
                hideVersionList();
            });
            versionList.appendChild(li);
        });
    }
    function showVersionList() {
        const rect = versionInput.getBoundingClientRect();
        versionList.style.top = rect.bottom + window.scrollY + "px";
        versionList.style.left = rect.left + window.scrollX + "px";
        versionList.style.width = rect.width + "px";
        versionList.style.display = "block";
    }
    function hideVersionList() {
        versionList.style.display = "none";
    }

    versionInput.addEventListener("input", () => {
        const q = versionInput.value.toLowerCase();
        let shown = 0;
        versionList.querySelectorAll("li").forEach((li) => {
            if (li.textContent.toLowerCase().includes(q) && shown < 10) {
                li.style.display = "";
                shown++;
            } else {
                li.style.display = "none";
            }
        });
        showVersionList();
    });

    downloadBtn.addEventListener("click", async () => {
        const version = versionInput.value;
        const type = jarTypeSelect.value;

        if (!versions.includes(version)) {
            return;
        }

        try {
            const manifest = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest.json").then((r) =>
                r.json()
            );
            const verObj = manifest.versions.find((v) => v.id === version);
            if (!verObj) throw new Error("버전 데이터를 찾을 수 없음");

            const jarData = await fetch(verObj.url).then((r) => r.json());
            const files = [];

            if (type === "client" || type === "both") files.push(jarData.downloads.client.url);
            if (type === "server" || type === "both") files.push(jarData.downloads.server.url);

            if (!files.length) throw new Error("선택한 타입의 Jar 파일이 없음");

            let blocked = false;
            files.forEach((url) => {
                const win = window.open(url, "_blank");
                if (!win) blocked = true;
            });
        } catch (err) {}
    });
}
