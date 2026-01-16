const AppState = { mode: "basic", pages: [], pagesPath: "docs/1/pages.json", currentSlug: null, isLoading: false };

/** Setter */
/** set 모드 */
function setMode(mode) {
    AppState.mode = mode;
    AppState.pagesPath = `docs/${modeNumber(mode)}/pages.json`;
}
/** set 페이지 */
function setPages(pages) {
    AppState.pages = pages;
}
/** set 현재 페이지 주소 */
function setCurrentSlug(slug) {
    AppState.currentSlug = slug;
}
/** set 로딩 */
function setLoading(isLoading) {
    AppState.isLoading = isLoading;
    isLoading ? showLoading() : hideLoading();
}
/** set 페이지 경로 */
function setPagesPath(path) {
    AppState.pagesPath = path;
}

const DOM = {
    pages: document.getElementById("pages"),
    article: document.getElementById("article"),
    title: document.getElementById("title"),
    subtitle: document.getElementById("subtitle"),
    search: document.getElementById("q"),
    loading: document.getElementById("page-loading"),
    homeBtn: document.getElementById("home-btn"),
    logo: document.querySelector(".logo"),
};
DOM.pages.innerHTML = "";
DOM.article.innerHTML = "";
DOM.title.textContent = "";
DOM.subtitle.textContent = "";
/** 로딩 중... */
function showLoading() {
    DOM.loading.style.display = "flex";
}
function hideLoading() {
    DOM.loading.style.display = "none";
}

/** 모드 이름(string -> 타이틀) */
function modeName(s) {
    return s === "advanced" ? "점프 투 데이터 팩(Adv)" : "점프 투 데이터 팩";
}
/** 모드 숫자 -> 문자, 문자 -> 숫자 */
const modeMap = { menu: "0", basic: "1", advanced: "2" };
const modeMapReverse = Object.fromEntries(Object.entries(modeMap).map(([k, v]) => [v, k]));
function modeNumber(s) {
    return modeMap[s];
}
function modeNumber2Name(s) {
    return modeMapReverse[s];
}

/** 타이틀 클릭 -> 홈 */
DOM.homeBtn.addEventListener("click", () => {
    location.hash = AppState.mode === "basic" ? "1" : "2";
});
/** 로고 클릭 -> 모드 변경 */
DOM.logo.addEventListener("click", () => {
    const targetMode = AppState.mode === "basic" ? "advanced" : "basic";
    location.hash = modeNumber(targetMode);
});

/** 모드 변경 감지 */
window.addEventListener("hashchange", applyModeFromHash); /** 페이지 로딩 이후 전환할 때 */
document.addEventListener("DOMContentLoaded", applyModeFromHash); /** 첫 페이지 로딩 때 */
function applyModeFromHash() {
    const hash = location.hash.replace("#", "");
    const mode = modeNumber2Name(hash.split("/")[0]) || "basic";
    setMode(mode);
    DOM.logo.src = `assets/${mode}.svg`;
    DOM.homeBtn.textContent = modeName(mode);
    loadPages();
}

/** 페이지 로드 */
async function loadPages() {
    setLoading(true); // 로딩 중 시작
    const res = await fetch(AppState.pagesPath);
    const pages = await res.json();
    setPages(pages);
    renderSidebar(AppState.pages);
    const slug = location.hash.replace("#", "") || AppState.pages[0]?.slug;
    if (slug) loadPage(slug);
    setLoading(false); // 로딩 중 종료
}

/** 사이드 바 렌더링 */
function renderSidebar(list, depth = 0, searchQuery = "") {
    // 최상위 페이지 호출 초기화
    if (depth === 0) {
        DOM.pages.innerHTML = "";
    }

    list.forEach((p) => {
        const a = document.createElement("a");
        a.className = "page-item";
        a.dataset.slug = p.slug;
        a.style.paddingLeft = `${12 + depth * 10}px`;

        const titleHTML = highlight(p.title, searchQuery);
        const summaryHTML = highlight(p.summary || "", searchQuery);

        a.innerHTML = `<strong>${titleHTML}</strong><div style="font-size:14px;color:var(--muted)">${
            summaryHTML || ""
        }</div>`;
        a.href = "#" + p.slug;
        a.addEventListener("click", (e) => {
            e.preventDefault();
            const s = a.dataset.slug;
            history.pushState({ slug: s }, "", "#" + s);
            loadPage(s);
        });
        DOM.pages.appendChild(a);

        if (p.children && Array.isArray(p.children)) {
            renderSidebar(p.children, depth + 1, searchQuery);
        }
    });
}
/** 사이드 바 페이지 하이라이트 */
function highlightActive() {
    const items = DOM.pages.querySelectorAll(".page-item");
    items.forEach((it) => {
        it.classList.toggle("active", it.dataset.slug === AppState.currentSlug);
    });
}

/** 표시할 페이지 1차적으로 검색  */
function findPage(list, slug) {
    for (const p of list) {
        if (p.slug === slug) return p;
        if (p.children) {
            const children = Array.isArray(p.children) ? p.children : [p.children];
            const found = findPage(children, slug);
            if (found) return found;
        }
    }
    return null;
}

/** 페이지 실제로 로드 */
async function loadPage(slug) {
    await loadPagesFromPath("docs/" + slug.split("/")[0] + "/pages.json");

    const previewBox = document.getElementById("link-preview");
    if (previewBox) {
        previewBox.classList.remove("show");
        previewBox.style.display = "none";
    }

    setCurrentSlug(slug);
    const p = findPage(AppState.pages, slug);
    if (!p) {
        DOM.article.innerHTML = "";
        DOM.title.textContent = "";
        DOM.subtitle.textContent = "";
        return;
    }
    DOM.title.textContent = p.title;
    DOM.subtitle.textContent = p.summary;

    try {
        const mdRes = await fetch(p.file);
        const md = await mdRes.text();
        const html = marked.parse(md); /** 마크 다운 -> html */
        DOM.article.innerHTML = html;

        replaceAnnotationsInArticle(); /** 어노테이션 로딩 */
        replaceEmojisInArticle(); /** 이모지 로딩 */
        addCopyButtons(); /** 복사 버튼 로딩 */

        if (window.Prism) Prism.highlightAll();

        const codeBlocks = DOM.article.querySelectorAll("pre > code.language-mermaid"); /** mermaid 렌더 */
        codeBlocks.forEach((block) => {
            const pre = block.parentElement;
            const graphCode = block.textContent;
            const div = document.createElement("div");
            div.className = "mermaid";
            div.textContent = graphCode;
            pre.replaceWith(div);
        });

        const mermaidElements = DOM.article.querySelectorAll(".mermaid");
        if (window.mermaid && mermaidElements.length > 0) {
            try {
                mermaid.init(undefined, mermaidElements);
            } catch (e) {
                console.warn("Mermaid init error:", e);
            }
        }

        attachLinkPreviews(); /** 링크 미리보기 로딩 */
        p.content = md;

        const query = DOM.search.value.trim();
        if (query) {
            DOM.article.innerHTML = highlight(DOM.article.innerHTML, query);
        }
    } catch (err) {
        DOM.article.textContent = "로딩 실패: " + err;
    }

    highlightActive(); /** 사이드 바 하이라이트 */

    const contentEl = document.querySelector(".content");
    if (contentEl) contentEl.scrollTop = 0;
}
async function loadPagesFromPath(path) {
    if (AppState.pagesPath !== path) {
        setPagesPath(path);
        try {
            const res = await fetch(path);
            if (!res.ok) throw new Error("Failed to load pages");
            const pages = await res.json();
            setPages(pages);
            renderSidebar(AppState.pages);
        } catch (error) {
            console.error(error);
        }
    }
}

/** 검색 창 */
DOM.search.addEventListener("input", async (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) {
        renderSidebar(AppState.pages);
        return;
    }

    async function filterTree(list) {
        const out = [];
        const tasks = list.map(async (p) => {
            if (!p.content) {
                try {
                    const res = await fetch(p.file);
                    p.content = await res.text();
                } catch (err) {
                    console.warn(`Failed to load content for ${p.slug}: ${err}`);
                    p.content = "";
                }
            }

            const hay = (p.title + " " + (p.summary || "") + " " + (p.content || "")).toLowerCase();
            let filteredChildren = [];

            if (p.children && Array.isArray(p.children)) {
                filteredChildren = await filterTree(p.children);
            }

            if (hay.includes(q)) {
                out.push({ ...p, children: filteredChildren });
            } else if (filteredChildren.length > 0) {
                out.push(...filteredChildren);
            }
        });

        await Promise.all(tasks);
        return out;
    }

    const filteredTree = await filterTree(AppState.pages);
    renderSidebar(filteredTree, 0, q);
});

/** 검색어 하이라이트 */
function highlight(text, q) {
    if (!q) return text;

    const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return text.replace(/(<[^>]+>)|([^<]+)/g, (match, tag, content) => {
        if (tag) {
            return tag;
        } else if (content) {
            return content.replace(regex, "<mark>$1</mark>");
        }
        return match;
    });
}
/** 슬래시 키로 검색 창 이동 */
document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement !== DOM.search) {
        e.preventDefault();
        DOM.search.focus();
        DOM.search.select();
    }
});
/** 코드 블록 복사 버튼 */
function addCopyButtons() {
    const codeBlocks = document.querySelectorAll("pre > code");

    codeBlocks.forEach((code) => {
        const pre = code.parentElement;
        if (pre.querySelector(".copy-btn")) return;

        const btn = document.createElement("button");
        btn.className = "copy-btn";
        btn.type = "button";

        const img = document.createElement("img");
        img.src = "assets/img/copy.svg";
        img.className = "copy-icon";
        btn.appendChild(img);

        btn.addEventListener("click", () => {
            navigator.clipboard.writeText(code.textContent).then(() => {
                img.src = "assets/img/check.svg";
                btn.classList.add("copied");
                setTimeout(() => {
                    img.src = "assets/img/copy.svg";
                    btn.classList.remove("copied");
                }, 1200);
            });
        });

        pre.style.position = "relative";
        btn.style.position = "absolute";
        btn.style.top = "8px";
        btn.style.zIndex = "10";
        pre.appendChild(btn);

        // 위치 이동
        const updatePosition = () => {
            btn.style.left = pre.scrollLeft + pre.clientWidth - btn.offsetWidth - 8 + "px";
        };
        // 초기 위치
        updatePosition();
        // 스크롤 위치 이동
        pre.addEventListener("scroll", updatePosition);
        window.addEventListener("resize", updatePosition);
    });
}
/** 어노테이션 (@Deprecated) */
function replaceAnnotationsInArticle() {
    const supported = ["Deprecated", "Todo", "Note"];

    DOM.article.querySelectorAll("p").forEach((p) => {
        const match = p.textContent.trim().match(/^@([A-Za-z]+)\s*(.*)$/);
        if (!match || !supported.includes(match[1])) return;

        p.replaceWith(
            Object.assign(document.createElement("div"), {
                className: `annotation ${match[1].toLowerCase()}`,
                innerHTML: `<span class="annotation-tag">@${
                    match[1]
                }</span><span class="annotation-text">${marked.parseInline(match[2])}</span>`,
            })
        );
    });
}
/** 이모지 (:sans:) */
function replaceEmojisInArticle() {
    const emojiPath = "assets/img/emoji/";
    DOM.article.innerHTML = DOM.article.innerHTML.replace(/:([a-zA-Z0-9_]+):/g, (match, name) => {
        return `<img src="${emojiPath}${name}.png" class="emoji" onerror="this.style.display='none'">`;
    });
}
/** 알림 박스 */
const renderer = {
    paragraph(text) {
        const boxTypes = ["info", "warning", "tip"];
        const emoji = {
            info: `<img src="assets/img/box/info.png" class="box-icon">`,
            warning: `<img src="assets/img/box/warning.png" class="box-icon">`,
            tip: `<img src="assets/img/box/tip.png" class="box-icon">`,
        };

        for (const type of boxTypes) {
            const regex = new RegExp(`^:::${type}\\s*(.*):::`, "s");
            const match = text.match(regex);
            if (match) {
                const content = match[1].trim();
                return `
               <div class="${type}-box box"> ${emoji[type]}
                  <div class="box-text">${marked.parseInline(content)}</div>
               </div>
            `;
            }
        }
        return `<p>${marked.parseInline(text)}</p>`;
    },
};
marked.use({ renderer });

/** 진행 바 */
const content = document.querySelector(".content");
function updateProgressBar() {
    const scrollTop = content.scrollTop;
    const contentHeight = content.scrollHeight - content.clientHeight;
    const progress = (scrollTop / contentHeight) * 100;

    const bar = document.getElementById("progress-bar");
    bar.style.width = progress + "%";
}
content.addEventListener("scroll", updateProgressBar);
window.addEventListener("resize", updateProgressBar);

/** 뒤로 | 앞으로 가기 */
window.addEventListener("popstate", (e) => {
    const slug = location.hash.replace("#", "") || AppState.pages[0]?.slug;
    if (slug) loadPage(slug);
});

const previewBox = document.createElement("div");
previewBox.id = "link-preview";
document.body.appendChild(previewBox);
/** 링크 미리보기 */
function attachLinkPreviews() {
    const articleLinks = DOM.article.querySelectorAll("a");

    articleLinks.forEach((link) => {
        const href = link.getAttribute("href");
        const text = link.textContent.trim();

        let isInternal = false;
        let slug = null;

        if (href.startsWith("#")) {
            slug = href.replace("#", "");
            isInternal = true;
        } else if (href.endsWith(".html")) {
            slug = href.replace(".html", "");
            isInternal = true;
        }

        // 외부 링크 새 탭
        if (!isInternal) {
            link.setAttribute("target", "_blank");
            link.setAttribute("rel", "noopener noreferrer");
        }

        link.addEventListener("mouseenter", (e) => {
            if (!href) return;

            if (isInternal) {
                const p = findPage(AppState.pages, slug);
                previewBox.innerHTML = p
                    ? `<strong>${p.title}</strong><br>${p.summary || ""}`
                    : `<strong>${text}</strong>`;
            } else {
                try {
                    const domain = new URL(href).hostname;
                    const iconUrl = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`;
                    previewBox.innerHTML = `
                  <img src="${iconUrl}" style="width:20px;height:20px;vertical-align:middle;margin-right:6px;">
                  <strong>${text}</strong><br>
                  <span style="font-size:12px;color:#888">${domain}</span>
               `;
                } catch {
                    previewBox.innerHTML = `<strong>${text}</strong>`;
                }
            }

            const rect = link.getBoundingClientRect();
            const x = rect.right + 8;
            const y = rect.top - previewBox.offsetHeight - 8;

            previewBox.style.left = `${x + window.scrollX}px`;
            previewBox.style.top = `${Math.max(y, rect.bottom + 8) + window.scrollY}px`;

            previewBox.style.display = "block";
            previewBox.classList.add("show");
        });

        link.addEventListener("mouseleave", () => {
            previewBox.classList.remove("show");
            previewBox.style.display = "none";
        });
    });
}

/** 최신 버전 기입 */
const latestVersion = document.getElementById("latest-version");
// JSON 불러오기
fetch("https://piston-meta.mojang.com/mc/game/version_manifest.json")
    .then((res) => res.json())
    .then((data) => {
        latestVersion.textContent = "최신 버전: " + data.versions[0].id;
        latestVersion.style = "color:#FFF";
    });

/** 초기화 */
loadPages();
