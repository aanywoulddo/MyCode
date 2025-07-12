(function() {
    const e = !1,
        t = (...t) => {
            e
        },
        n = (...t) => {
            e
        },
        o = (...t) => {
            e
        };
    t();
    const r = ["div.cdk-overlay-container", '[role="dialog"]', ".modal-container", ".overlay-container"],
        a = ['button[data-test-id="delete-button"]', 'button[aria-label*="delete"]', 'button:contains("Delete")', "button.delete-btn"],
        i = ['button[data-test-id="confirm-button"]', 'button:contains("Delete")', 'button:contains("Confirm")', 'button[aria-label*="confirm"]', "button.confirm-btn"],
        s = ['button[data-test-id="actions-menu-button"]', 'button[aria-label*="actions"]', 'button[aria-label*="menu"]', "button.menu-button", "button.actions-button"];

    function l(e, t = document) {
        if (!t) return null;
        for (const n of e) try {
            const e = t.querySelector(n);
            if (e) return e
        } catch (e) {
            console.warn(`[GD] Invalid selector "${n}":`, e)
        }
        return null
    }

    function d(e, t = document, n = 7e3) {
        return new Promise((o, r) => {
            const a = l(e, t);
            if (a && null !== a.offsetParent && !a.disabled) return void o(a);
            let i = 0;
            const s = setInterval(() => {
                if (c && c.signal.aborted) return clearInterval(s), void r(new Error("Operation aborted"));
                i += 150;
                const a = l(e, t);
                a && null !== a.offsetParent && !a.disabled ? (clearInterval(s), o(a)) : i >= n && (clearInterval(s), console.error(`Elements not actionable within ${n}ms. Tried selectors:`, e), r(new Error(`Elements not actionable within ${n}ms`)))
            }, 150)
        })
    }
    let c = null,
        m = null,
        g = !1;
    let u = null,
        p = null,
        b = null,
        f = null,
        y = null,
        h = null,
        v = null,
        x = null;
    const w = [chrome.i18n.getMessage("deleteConversations_deleting")],
        C = [chrome.i18n.getMessage("deleteConversations_cleared"), chrome.i18n.getMessage("deleteConversations_done"), chrome.i18n.getMessage("deleteConversations_finished"), chrome.i18n.getMessage("deleteConversations_tidied"), chrome.i18n.getMessage("deleteConversations_taskComplete")],
        k = chrome.i18n.getMessage("deleteConversations_cancelled");

    function E(e) {
        return e[Math.floor(Math.random() * e.length)]
    }

    function T() {
        if (document.getElementById("gemini-delete-all-overlay-styles")) return;
        const e = function() {
            const e = getComputedStyle(document.documentElement),
                t = document.body.classList.contains("dark-theme") || document.body.classList.contains("dark_mode_toggled") || "dark" === document.documentElement.getAttribute("data-theme"),
                n = t ? "#202124" : "#ffffff",
                o = t ? "#e8eaed" : "#202124",
                r = t ? "#9aa0a6" : "#5f6368";
            try {
                return {
                    isDark: t,
                    backgroundColor: (t ? e.getPropertyValue("--google-grey-900") || n : e.getPropertyValue("--google-grey-100") || n) || n,
                    textColor: t ? e.getPropertyValue("--google-grey-200") || o : e.getPropertyValue("--google-grey-900") || o,
                    secondaryTextColor: t ? e.getPropertyValue("--google-grey-500") || r : e.getPropertyValue("--google-grey-700") || r,
                    accentColor: t ? "#8ab4f8" : "#1a73e8",
                    progressTrackColor: t ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                    successColor: t ? "#81c995" : "#34a853"
                }
            } catch (e) {
                return console.warn("Could not read Gemini theme variables, using defaults"), {
                    isDark: t,
                    backgroundColor: n,
                    textColor: o,
                    secondaryTextColor: r,
                    accentColor: t ? "#8ab4f8" : "#1a73e8",
                    progressTrackColor: t ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)",
                    successColor: t ? "#81c995" : "#34a853"
                }
            }
        }(),
            t = `
      #gemini-delete-all-overlay {
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background-color: ${e.backgroundColor}; /* Theme-synced */
        z-index: 2147483647; display: flex; flex-direction: column;
        justify-content: center; align-items: center;
        font-family: 'Google Sans', Roboto, Arial, sans-serif; color: ${e.textColor}; text-align: center;
        opacity: 0; transition: opacity 0.3s ease-in-out;
      }
      #gemini-delete-all-overlay.visible { opacity: 1; }
      #gemini-delete-all-overlay .spinner {
        display: block; /* Default state */
        border: 3px solid ${e.progressTrackColor}; border-top: 3px solid ${e.accentColor}; /* Themed */
        border-radius: 50%; width: 50px; height: 50px;
        animation: spin 0.8s linear infinite; margin-bottom: 25px;
      }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      
      /* Completion Tick Styles */
      #gemini-delete-all-overlay .completion-tick {
        display: none; /* Hidden by default */
        width: 60px; height: 60px;
        border-radius: 50%;
        stroke-width: 5; stroke: ${e.successColor}; /* Themed */
        stroke-miterlimit: 10;
        animation: draw-tick-container 0.5s ease-out forwards;
        margin-bottom: 20px;
      }
      #gemini-delete-all-overlay .completion-tick .tick-path {
        stroke-dasharray: 100;
        stroke-dashoffset: 100;
        animation: draw-tick-path 0.5s 0.2s ease-out forwards;
      }
      @keyframes draw-tick-container {
        0% { opacity: 0; transform: scale(0.5); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes draw-tick-path {
        to { stroke-dashoffset: 0; }
      }

      #gemini-delete-all-overlay .message { 
        font-size: 20px; font-weight: 500; margin-bottom: 8px; 
      }
      
      /* Progress Container and Text */
      #gemini-delete-all-overlay .progress-container {
        display: flex; flex-direction: column; align-items: center;
        width: 300px; /* Fixed width for the progress bar */
        margin: 10px 0;
      }
      #gemini-delete-all-overlay .progress-text { 
        font-size: 14px; color: ${e.secondaryTextColor}; 
        margin-bottom: 8px; width: 100%;
        display: flex; justify-content: space-between;
      }
      
      /* Progress Bar Styles */
      #gemini-delete-all-overlay .progress-bar {
        width: 100%; height: 4px; background-color: ${e.progressTrackColor};
        border-radius: 4px; overflow: hidden;
      }
      #gemini-delete-all-overlay .progress-bar-inner {
        height: 100%; width: 0%; /* Initial width */
        background-color: ${e.accentColor};
        /* Smooth animation when the width changes */
        transition: width 0.25s ease-out;
        border-radius: 4px;
      }
      
      /* Cancel Button */
      #gemini-delete-all-overlay .cancel-button {
        margin-top: 16px;
        color: ${e.secondaryTextColor};
        font-size: 14px;
        background: none;
        border: none;
        padding: 8px 16px;
        cursor: pointer;
        font-family: 'Google Sans', Roboto, Arial, sans-serif;
        border-radius: 4px;
        transition: background-color 0.15s;
      }
      #gemini-delete-all-overlay .cancel-button:hover {
        background-color: rgba(128, 128, 128, 0.1);
      }
      #gemini-delete-all-overlay .cancel-button:focus {
        outline: none;
        box-shadow: 0 0 0 2px ${e.accentColor};
      }
    `,
            n = document.createElement("style");
        n.id = "gemini-delete-all-overlay-styles", n.innerText = t, document.head.appendChild(n)
    }

    function S(e, t, n) {
        if (!p || !f) return;
        const o = e + t;
        p.textContent = chrome.i18n.getMessage("deleteConversations_progress", [String(o), String(n), String(e), String(t)]), o > 0 && f.style.animation && (f.style.animation = "", f.classList.remove("indeterminate"));
        const r = n > 0 ? o / n * 100 : 0;
        f.style.width = `${r}%`
    }

    function M(e, t, n, o = !1) {
        h && (h.style.display = "none"), b && (b.style.display = "none"), p && (p.style.display = "none"), x && (x.style.display = "none");
        let r = !1;
        if (y)
            if (o) y.textContent = k;
            else if (g) {
                y.textContent = chrome.i18n.getMessage("deleteConversations_workspaceMessage"), y.style.fontSize = "14px";
                try {
                    localStorage.removeItem("gemini_bulk_delete_workspace_warning_dismissed")
                } catch (e) {
                    console.warn("Could not reset workspace warning state:", e)
                }
            } else n > 0 && e === n && 0 === t ? (y.textContent = E(C), r = !0) : n > 0 && e > 0 && t > 0 ? (y.textContent = chrome.i18n.getMessage("deleteConversations_partialSuccess", [String(e), String(n)]), e >= t && (r = !0)) : n > 0 && t === n ? y.textContent = chrome.i18n.getMessage("deleteConversations_allFailed") : n > 0 && 0 === e && 0 === t ? y.textContent = chrome.i18n.getMessage("deleteConversations_noItemsProcessed") : 0 === n ? y.textContent = chrome.i18n.getMessage("deleteConversations_noItems") : (y.textContent = E(C), r = !0);
        r && v && n > 0 && (e > 0 || o) && (v.style.display = "block")
    }

    function A() {
        clearTimeout(m);
        const e = document.getElementById("gemini-delete-all-overlay");
        e ? (e.classList.remove("visible"), e.addEventListener("transitionend", () => {
            e && e.remove(), u = null, p = null, y = null, h = null, v = null, b = null, f = null, x = null
        }, {
            once: !0
        })) : (u = null, p = null, y = null, h = null, v = null, b = null, f = null, x = null)
    }

    function _() {
        document.querySelectorAll(".conversation-checkbox:checked").forEach(e => {
            e.checked = !1
        });
        try {
            const e = new Event("change", {
                bubbles: !0
            });
            document.querySelector(".conversation-checkbox") && document.querySelector(".conversation-checkbox").dispatchEvent(e);
        } catch (e) {
            n()
        }
    }

    function L(e) {
        return new Promise(t => setTimeout(t, e))
    }
    async function P(e) {
        if (c && c.signal.aborted) throw new Error("Operation aborted");
        const t = e.parentElement;
        if (!t) throw new Error("Checkbox parentElement is null.");
        if (t.classList.contains("conversations-container") || t.id && t.id.startsWith("conversations-list")) throw new Error("conversationItem incorrectly identified as main list container.");
        const n = t.nextElementSibling;
        if (!n) throw new Error("Actions wrapper (sibling to conversation item) not found.");
        let o = l(s, n);
        if (o || (o = n.querySelector("button")), !o) throw new Error("Three-dot button not found in actions wrapper.");
        o.click();
        const m = l(r);
        if (!m) throw new Error("Overlay container not found.");
        const g = await d(a, m, 7e3);
        if (!g) throw new Error("Delete button not found in menu");
        g.click();
        const u = await d(i, m, 7e3);
        if (!u) throw new Error("Confirm button not found in dialog");
        u.click(), await
            function(e, t = 15e3) {
                return new Promise((n, o) => {
                    if (!e || !document.body.contains(e)) return void n();
                    let r = 0;
                    const a = setInterval(() => {
                        if (c && c.signal.aborted) return clearInterval(a), void o(new Error("Operation aborted"));
                        r += 100, document.body.contains(e) && null !== e.offsetParent ? r >= t && (clearInterval(a), console.error("Element did not disappear within timeout:", e), o(new Error("Element did not disappear within timeout."))) : (clearInterval(a), n())
                    }, 100)
                })
            }(t)
    }(async function() {
        let e = Array.from(document.querySelectorAll(".conversation-checkbox:checked"));
        const r = e.length;
        if (0 === r) {
            return;
        }
        const a = function(e) {
            const t = document.getElementById("gemini-delete-all-overlay");
            t && t.remove(), c = new AbortController, clearTimeout(m), m = setTimeout(() => {
                if (c && !c.signal.aborted) {
                    console.error("Bulk deletion watchdog triggered - operation taking too long"), c.abort("timeout");
                    const e = document.createElement("div");
                    e.textContent = chrome.i18n.getMessage("deleteConversations_timeout"), e.style.cssText = "color: #f28b82; font-size: 14px; margin-top: 8px;", y && y.parentNode && y.parentNode.insertBefore(e, y.nextSibling), setTimeout(() => {
                        A(), _()
                    }, 3e3)
                }
            }, 3e4), T(), u = document.createElement("div"), u.id = "gemini-delete-all-overlay", u.setAttribute("role", "dialog"), u.setAttribute("aria-modal", "true"), u.setAttribute("aria-labelledby", "gemini-delete-message"), h = document.createElement("div"), h.className = "spinner", v = document.createElementNS("http://www.w3.org/2000/svg", "svg"), v.setAttribute("class", "completion-tick"), v.setAttribute("viewBox", "0 0 52 52");
            const n = document.createElementNS("http://www.w3.org/2000/svg", "path");
            n.setAttribute("class", "tick-path"), n.setAttribute("fill", "none"), n.setAttribute("d", "M14.1 27.2l7.1 7.2 16.7-16.8"), v.appendChild(n), y = document.createElement("div"), y.className = "message", y.id = "gemini-delete-message", y.setAttribute("role", "status"), y.setAttribute("aria-live", "polite"), y.textContent = E(w);
            const o = document.createElement("div");
            o.className = "progress-container", p = document.createElement("div"), p.className = "progress-text", p.textContent = chrome.i18n.getMessage("deleteConversations_preparing", String(e)), o.appendChild(p), b = document.createElement("div"), b.className = "progress-bar", f = document.createElement("div"), f.className = "progress-bar-inner", f.id = "gbd-progress", f.style.width = "30%", f.style.animation = "progress-indeterminate 1.5s ease-in-out infinite", b.appendChild(f), o.appendChild(b), x = document.createElement("button"), x.className = "cancel-button", x.textContent = chrome.i18n.getMessage("deleteConversations_cancel"), x.addEventListener("click", () => {
                c && !c.signal.aborted && (c.abort(), y.textContent = k, M(0, 0, e, !0), setTimeout(() => {
                    A(), _()
                }, 1500))
            }), u.appendChild(h), u.appendChild(v), u.appendChild(y), u.appendChild(o), u.appendChild(x), document.body.appendChild(u), requestAnimationFrame(() => {
                u && u.classList.add("visible")
            });
            const r = document.getElementById("gemini-delete-all-overlay-styles");
            return r && (r.innerText += "\n        @keyframes progress-indeterminate {\n          0% { left: -30%; width: 30% }\n          50% { left: 100%; width: 30% }\n          100% { left: 100%; width: 0 }\n        }\n        #gemini-delete-all-overlay .progress-bar-inner.indeterminate {\n          position: relative;\n          animation: progress-indeterminate 1.5s ease-in-out infinite;\n        }\n      "), c
        }(r);
        if (!a) return void console.error("Failed to initialize abort controller");
        const i = setTimeout(() => {
            if (c && !c.signal.aborted) {
                console.error("Bulk deletion watchdog triggered - operation taking too long"), c.abort("timeout"), y && (y.textContent = chrome.i18n.getMessage("deleteConversations_longOperation")), b && (b.style.display = "none"), p && (p.textContent = chrome.i18n.getMessage("deleteConversations_longOperationSuggestion"), p.style.display = "block", p.style.textAlign = "center", p.style.width = "100%", p.style.marginTop = "10px"), h && (h.style.borderTopColor = "#f28b82");
                const e = document.createElement("button");
                if (e.textContent = chrome.i18n.getMessage("deleteConversations_tryAgain"), e.style.cssText = "\n          background-color: var(--gd-bg-primary);\n          color: var(--gd-focus-ring, #1a73e8);\n          border: 1px solid var(--gd-focus-ring, #1a73e8);\n          border-radius: 4px;\n          padding: 8px 16px;\n          margin-top: 16px;\n          font-family: 'Google Sans', Roboto, Arial, sans-serif;\n          font-size: 14px;\n          cursor: pointer;\n        ", e.addEventListener("click", () => {
                    A(), _()
                }), y && y.parentNode) {
                    const t = y.parentNode;
                    x && (x.style.display = "none"), t.appendChild(e)
                }
                setTimeout(() => {
                    A(), _()
                }, 3e4)
            }
        }, 3e4);
        try {
            if (await L(500), a.signal.aborted) return A(), void _();
            let n = 0,
                o = 0;
            for (const [a, i] of Array.from(e).entries()) {
                if (c && c.signal.aborted) {
                    console.log("Deletion aborted by user or timeout");
                    break
                }
                if (document.body.contains(i)) {
                    try {
                        await P(i), n++;
                        try {
                            const e = await chrome.storage.sync.get(["remainingDeletes", "isUnlocked"]),
                                n = e.remainingDeletes || 0;
                            if (e.isUnlocked || !1) t();
                            else if (n > 0) {
                                const e = n - 1;
                                await chrome.storage.sync.set({
                                    remainingDeletes: e
                                }), t(), e <= 0 && t()
                            }
                        } catch (e) {
                            console.error("Error updating quota:", e)
                        }
                    } catch (e) {
                        if (o++, "Operation aborted" === e.message) break;
                        console.error(`Failed to delete conversation for checkbox (original index: ${i.dataset.index||"N/A"}):`, e.message), document.body.dispatchEvent(new KeyboardEvent("keydown", {
                            key: "Escape",
                            code: "Escape",
                            keyCode: 27,
                            bubbles: !0,
                            cancelable: !0
                        })), await L(100)
                    }
                    S(n, o, r), (a + 1) % 20 == 0 && await new Promise(e => {
                        window.requestIdleCallback ? requestIdleCallback(e) : setTimeout(e, 10)
                    })
                } else S(n, o, r)
            }
            c && c.signal.aborted || (M(n, o, r), await L(2200))
        } finally {
            clearTimeout(i), A(), _()
        }
        console.log(`Bulk delete process finished. Total Selected: ${r}, Deleted: ${n}, Errors: ${o}`)
    })()
})();