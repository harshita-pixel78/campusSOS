/* CampusSOS - application logic */

const STORAGE_KEY = "campusComplaints";
const STATUS_LIST = ["Submitted", "Triaged", "Assigned", "In Progress", "Resolved", "Closed", "Reopened"];
const PRIORITY_ORDER = { Critical: 1, High: 2, Medium: 3, Low: 4 };
const ACTIVE_STATUSES = ["Submitted", "Triaged", "Assigned", "In Progress", "Reopened"];

function generateComplaintID() {
    let id;
    const existing = new Set(getComplaints().map(c => c.id));
    do {
        id = `CS-${Date.now().toString().slice(-7)}${Math.floor(100 + Math.random() * 900)}`;
    } while (existing.has(id));
    return id;
}

function getCurrentDateTime() { return new Date().toISOString(); }

function getComplaints() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return [];
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed.map(normalizeComplaint) : [];
    } catch (error) {
        console.error("Unable to read complaints:", error);
        return [];
    }
}

function saveComplaints(complaints) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
        return true;
    } catch (error) {
        console.error("Unable to save complaints:", error);
        return false;
    }
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDateTime(value) {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Not available";
    return date.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function getComplaintAge(value) {
    if (!value) return "Unknown";
    const created = new Date(value).getTime();
    if (Number.isNaN(created)) return "Unknown";
    const minutes = Math.floor(Math.max(0, Date.now() - created) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hr`;
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? "" : "s"}`;
}

function normalizeComplaint(c) {
    return {
        id: String(c?.id || ""), studentName: String(c?.studentName || ""),
        description: String(c?.description || ""), location: String(c?.location || ""),
        category: String(c?.category || "General"), priority: String(c?.priority || "Low"),
        department: String(c?.department || "Campus Administration"),
        triageReason: String(c?.triageReason || ""), emergency: Boolean(c?.emergency),
        status: STATUS_LIST.includes(c?.status) ? c.status : "Submitted",
        assignedTo: String(c?.assignedTo || ""), resolutionNote: String(c?.resolutionNote || ""),
        studentFeedback: String(c?.studentFeedback || ""), createdAt: c?.createdAt || "",
        updatedAt: c?.updatedAt || c?.createdAt || "", resolvedAt: c?.resolvedAt || "", reopenedAt: c?.reopenedAt || ""
    };
}

function normalizeText(value) {
    return String(value || "").toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function containsAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
}

function getSmartTriage(description) {
    const text = normalizeText(description);
    const rules = [
        { category: "Safety", priority: "Critical", department: "Campus Safety", emergency: true, reason: "The description contains a potential immediate safety hazard.", keywords: ["fire", "smoke", "gas leak", "gas leakage", "explosion", "electric shock", "electrocution", "sparking", "electrical fire", "serious injury", "life threatening", "short circuit"] },
        { category: "Safety & Security", priority: "High", department: "Campus Security", emergency: false, reason: "The description suggests a security or personal-safety concern.", keywords: ["threat", "fight", "violence", "harassment", "stalking", "intruder", "theft", "stolen", "unsafe person", "bullying", "weapon"] },
        { category: "Maintenance", priority: "Medium", department: "Maintenance", emergency: false, reason: "The description appears to involve physical infrastructure or maintenance.", keywords: ["water leak", "water leakage", "leaking", "plumbing", "pipe", "tap", "faucet", "fan", "light", "electricity", "power", "repair", "broken", "air conditioner", "socket", "switch", "door", "window", "ceiling", "floor", "furniture", "chair", "desk"] },
        { category: "IT", priority: "Medium", department: "IT Support", emergency: false, reason: "The description appears to involve technology or connectivity.", keywords: ["wifi", "wi fi", "wi-fi", "internet", "network", "router", "connection", "login", "computer", "projector", "website", "server", "portal"] },
        { category: "Food", priority: "Medium", department: "Mess / Food Services", emergency: false, reason: "The description appears to involve food or dining services.", keywords: ["food", "mess", "meal", "breakfast", "lunch", "dinner", "canteen", "food quality", "food poisoning"] },
        { category: "Cleanliness", priority: "Medium", department: "Housekeeping", emergency: false, reason: "The description appears to involve cleanliness, hygiene, or sanitation.", keywords: ["dirty", "garbage", "cleaning", "toilet", "waste", "dust", "hygiene", "smell", "stink", "washroom", "sanitation"] },
        { category: "Hostel", priority: "Medium", department: "Hostel Administration", emergency: false, reason: "The description appears to involve hostel facilities or administration.", keywords: ["hostel", "warden", "roommate", "bed"] },
        { category: "General", priority: "Low", department: "Campus Administration", emergency: false, reason: "The issue appears to be a general request, suggestion, or improvement.", keywords: ["suggestion", "suggest", "request", "minor", "small issue", "improvement", "recommendation", "idea"] }
    ];
    return rules.find(rule => containsAny(text, rule.keywords)) || {
        category: "General", priority: "Low", department: "Campus Administration", emergency: false,
        reason: "The issue does not match a specific category yet. A campus team can review it manually."
    };
}

function renderTriage(triage, preview) {
    if (!preview) return;
    preview.innerHTML = `
        <div class="triage-result-heading"><span class="triage-live-dot"></span><strong>Suggested routing</strong></div>
        <div class="triage-row"><span class="triage-label">Category</span><span class="triage-value">${escapeHTML(triage.category)}</span></div>
        <div class="triage-row"><span class="triage-label">Priority</span><span class="triage-value"><span class="priority-badge priority-${triage.priority.toLowerCase()}">${escapeHTML(triage.priority)}</span></span></div>
        <div class="triage-row"><span class="triage-label">Department</span><span class="triage-value">${escapeHTML(triage.department)}</span></div>
        <div class="triage-reason"><strong>Why this suggestion?</strong><p>${escapeHTML(triage.reason)}</p></div>
        ${triage.emergency ? `<div class="emergency-warning"><strong>Potential immediate danger</strong><p>CampusSOS is not an emergency service. Move to safety and contact campus security or local emergency services immediately.</p></div>` : ""}
    `;
}

function showTriagePreview() {
    const problem = document.getElementById("problem");
    const preview = document.getElementById("triagePreview");
    if (!problem || !preview) return;
    const text = problem.value.trim();
    preview.setAttribute("aria-live", "polite");
    if (text.length < 8) {
        preview.innerHTML = `<div class="triage-empty"><strong>Smart Triage will appear here</strong><p>Describe the problem in a few words and CampusSOS will suggest a category, priority, and responsible department.</p></div>`;
        return;
    }
    renderTriage(getSmartTriage(text), preview);
}

function showFormError(message) {
    const form = document.getElementById("complaintForm");
    if (!form) return;
    document.getElementById("formError")?.remove();
    const box = document.createElement("div");
    box.id = "formError";
    box.className = "error-message form-error";
    box.setAttribute("role", "alert");
    box.textContent = message;
    form.prepend(box);
    box.scrollIntoView({ behavior: "smooth", block: "center" });
}

function clearFormError() { document.getElementById("formError")?.remove(); }

function submitComplaint(event) {
    event?.preventDefault();
    clearFormError();
    const form = document.getElementById("complaintForm");
    const submitButton = form?.querySelector("button[type='submit']");
    const name = document.getElementById("studentName")?.value.trim() || "";
    const description = document.getElementById("problem")?.value.trim() || "";
    const location = document.getElementById("location")?.value.trim() || "";

    if (description.length < 8) return showFormError("Please describe the problem in at least 8 characters.");
    if (description.length > 500) return showFormError("Please keep the problem description within 500 characters.");
    if (location.length < 2) return showFormError("Please enter where the problem happened.");
    if (submitButton) submitButton.disabled = true;

    const triage = getSmartTriage(description);
    const now = getCurrentDateTime();
    const complaint = { id: generateComplaintID(), studentName: name, description, location, category: triage.category, priority: triage.priority, department: triage.department, triageReason: triage.reason, emergency: triage.emergency, status: "Submitted", assignedTo: "", resolutionNote: "", studentFeedback: "", createdAt: now, updatedAt: now, resolvedAt: "", reopenedAt: "" };
    const complaints = getComplaints();
    complaints.unshift(complaint);
    if (!saveComplaints(complaints)) {
        if (submitButton) submitButton.disabled = false;
        return showFormError("The complaint could not be saved in this browser. Please try again.");
    }
    showSubmissionSuccess(complaint);
}

function showSubmissionSuccess(complaint) {
    const main = document.querySelector("main.page-container");
    if (!main) return;
    main.innerHTML = `
        <section class="success-card" aria-labelledby="successTitle">
            <div class="success-icon" aria-hidden="true">✓</div>
            <div class="page-badge">Complaint submitted</div>
            <h1 id="successTitle">Your report is recorded.</h1>
            <p>Save the Complaint ID below. You can use it to check progress later.</p>
            <div class="complaint-id-box"><span>Complaint ID</span><strong id="generatedComplaintId">${escapeHTML(complaint.id)}</strong><button type="button" class="copy-id-button" onclick="copyComplaintID()">Copy</button></div>
            <div class="success-summary">
                <div><span>Category</span><strong>${escapeHTML(complaint.category)}</strong></div>
                <div><span>Priority</span><strong><span class="priority-badge priority-${complaint.priority.toLowerCase()}">${escapeHTML(complaint.priority)}</span></strong></div>
                <div><span>Department</span><strong>${escapeHTML(complaint.department)}</strong></div>
            </div>
            ${complaint.emergency ? `<div class="emergency-warning"><strong>Potential immediate danger</strong><p>This report was flagged for a potential safety hazard. Do not wait for the app. Move to safety and contact campus security or local emergency services.</p></div>` : ""}
            <div class="success-actions"><a href="track.html?id=${encodeURIComponent(complaint.id)}" class="primary-button">Track this complaint</a><a href="report.html" class="secondary-button">Report another problem</a></div>
            <p id="copyMessage" class="copy-message" role="status" aria-live="polite"></p>
        </section>`;
    window.scrollTo({ top: 0, behavior: "smooth" });
}

async function copyComplaintID() {
    const value = document.getElementById("generatedComplaintId")?.textContent;
    const message = document.getElementById("copyMessage");
    if (!value || !message) return;
    try {
        await navigator.clipboard.writeText(value.trim());
        message.textContent = "Complaint ID copied to clipboard.";
    } catch {
        message.textContent = "Copy is unavailable here. Please copy the ID manually.";
    }
}

function trackComplaint(event) {
    event?.preventDefault();
    const input = document.getElementById("complaintId");
    const result = document.getElementById("trackingResult");
    if (!input || !result) return;
    const id = input.value.trim().toUpperCase();
    if (!id) {
        result.innerHTML = `<div class="error-message" role="alert"><strong>Enter a Complaint ID.</strong><p>Use the ID shown after you submitted your report.</p></div>`;
        input.focus();
        return;
    }
    const complaint = getComplaints().find(c => String(c.id).toUpperCase() === id);
    if (!complaint) {
        result.innerHTML = `<div class="error-message" role="alert"><strong>Complaint not found.</strong><p>Check the ID and try again. This MVP stores data only in the browser where the complaint was created.</p></div>`;
        return;
    }
    renderTrackingResult(complaint, result);
}

function getStatusIndex(status) {
    if (status === "Reopened") return 2;
    const index = ["Submitted", "Triaged", "Assigned", "In Progress", "Resolved", "Closed"].indexOf(status);
    return index < 0 ? 0 : index;
}

function renderTrackingResult(complaint, container) {
    const timelineStatuses = ["Submitted", "Triaged", "Assigned", "In Progress", "Resolved", "Closed"];
    const currentIndex = getStatusIndex(complaint.status);
    const reopened = complaint.status === "Reopened";
    const statusClass = String(complaint.status).toLowerCase().replace(/\s+/g, "-");
    container.innerHTML = `
        <div class="tracking-card">
            <div class="tracking-header"><div><span class="page-badge">${escapeHTML(complaint.id)}</span><h2>${escapeHTML(complaint.description)}</h2></div><span class="status-badge status-${statusClass}">${escapeHTML(complaint.status)}</span></div>
            ${reopened ? `<div class="reopened-message"><strong>Needs another look</strong><p>You reported that the issue was not fully resolved. The complaint is active again.</p></div>` : ""}
            <div class="timeline" aria-label="Complaint progress">${timelineStatuses.map((status, index) => { const complete = !reopened && index <= currentIndex; const active = !reopened && index === currentIndex; return `<div class="timeline-step ${complete ? "complete" : ""} ${active ? "active" : ""}"><div class="timeline-dot">${complete ? "✓" : index + 1}</div><div><strong>${status}</strong>${index === 0 ? `<span>${formatDateTime(complaint.createdAt)}</span>` : index === currentIndex ? `<span>Updated ${formatDateTime(complaint.updatedAt)}</span>` : ""}</div></div>`; }).join("")}</div>
            <div class="complaint-details">
                <div><span>Location</span><strong>${escapeHTML(complaint.location)}</strong></div><div><span>Category</span><strong>${escapeHTML(complaint.category)}</strong></div><div><span>Priority</span><strong><span class="priority-badge priority-${complaint.priority.toLowerCase()}">${escapeHTML(complaint.priority)}</span></strong></div><div><span>Department</span><strong>${escapeHTML(complaint.department)}</strong></div><div><span>Assigned to</span><strong>${escapeHTML(complaint.assignedTo || "Not assigned yet")}</strong></div><div><span>Last updated</span><strong>${formatDateTime(complaint.updatedAt)}</strong></div>
            </div>
            ${complaint.resolutionNote ? `<div class="resolution-note"><strong>Resolution update</strong><p>${escapeHTML(complaint.resolutionNote)}</p></div>` : ""}
            ${(complaint.status === "Resolved" || complaint.status === "Closed") ? `<div class="feedback-box"><strong>Was the problem actually fixed?</strong><p>Confirm the outcome so the campus team knows whether closure was appropriate.</p><div class="feedback-actions"><button type="button" class="primary-button" onclick="submitFeedback('${escapeHTML(complaint.id)}','Yes')">Yes, fixed</button><button type="button" class="secondary-button" onclick="submitFeedback('${escapeHTML(complaint.id)}','No')">No, reopen</button></div>${complaint.studentFeedback ? `<small>Feedback recorded: ${escapeHTML(complaint.studentFeedback)}</small>` : ""}</div>` : ""}
        </div>`;
}

function updateStatus(id, newStatus) {
    if (!STATUS_LIST.includes(newStatus)) return;
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;
    const now = getCurrentDateTime();
    complaint.status = newStatus;
    complaint.updatedAt = now;
    if (["Assigned", "In Progress"].includes(newStatus) && !complaint.assignedTo) complaint.assignedTo = complaint.department;
    if (["Resolved", "Closed"].includes(newStatus)) complaint.resolvedAt = complaint.resolvedAt || now;
    if (!["Resolved", "Closed"].includes(newStatus)) complaint.resolvedAt = "";
    if (newStatus === "Reopened") complaint.reopenedAt = now;
    if (newStatus !== "Reopened") complaint.reopenedAt = complaint.reopenedAt || "";
    saveComplaints(complaints);
    if (typeof loadDashboard === "function") loadDashboard();
    if (document.getElementById("trackingResult")) trackComplaint();
}

function assignComplaint(id, assignedTo) {
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return false;
    complaint.assignedTo = String(assignedTo || "").trim();
    if (complaint.assignedTo && ["Submitted", "Triaged"].includes(complaint.status)) complaint.status = "Assigned";
    complaint.updatedAt = getCurrentDateTime();
    const ok = saveComplaints(complaints);
    if (ok && typeof loadDashboard === "function") loadDashboard();
    return ok;
}

function saveResolutionNote(id, note) {
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return false;
    complaint.resolutionNote = String(note || "").trim();
    complaint.updatedAt = getCurrentDateTime();
    const ok = saveComplaints(complaints);
    if (ok && typeof loadDashboard === "function") loadDashboard();
    return ok;
}

function submitFeedback(id, feedback) {
    const complaints = getComplaints();
    const complaint = complaints.find(c => c.id === id);
    if (!complaint) return;
    const now = getCurrentDateTime();
    complaint.studentFeedback = feedback;
    complaint.updatedAt = now;
    if (feedback === "Yes") { complaint.status = "Closed"; complaint.resolvedAt = complaint.resolvedAt || now; }
    if (feedback === "No") { complaint.status = "Reopened"; complaint.reopenedAt = now; complaint.resolvedAt = ""; }
    saveComplaints(complaints);
    const input = document.getElementById("complaintId");
    if (input) trackComplaint();
    if (typeof loadDashboard === "function") loadDashboard();
}

function addDemoData() {
    const existing = getComplaints();
    const demo = [
        { id: "CS-DEMO-001", studentName: "Demo Student", description: "Water leakage near hostel washroom", location: "Girls Hostel, Block A", category: "Maintenance", priority: "Medium", department: "Maintenance", triageReason: "The description appears to involve physical infrastructure or maintenance.", emergency: false, status: "In Progress", assignedTo: "Maintenance Team", resolutionNote: "Technician inspection scheduled.", studentFeedback: "", createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 45 * 60000).toISOString(), resolvedAt: "", reopenedAt: "" },
        { id: "CS-DEMO-002", studentName: "Demo Student", description: "Wi-Fi is not working in the computer lab", location: "Computer Lab 2", category: "IT", priority: "Medium", department: "IT Support", triageReason: "The description appears to involve technology or connectivity.", emergency: false, status: "Submitted", assignedTo: "", resolutionNote: "", studentFeedback: "", createdAt: new Date(Date.now() - 5 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(), resolvedAt: "", reopenedAt: "" },
        { id: "CS-DEMO-003", studentName: "Demo Student", description: "Smoke and sparking from electrical panel", location: "Academic Block, Ground Floor", category: "Safety", priority: "Critical", department: "Campus Safety", triageReason: "The description contains a potential immediate safety hazard.", emergency: true, status: "Triaged", assignedTo: "Campus Safety Team", resolutionNote: "", studentFeedback: "", createdAt: new Date(Date.now() - 90 * 60000).toISOString(), updatedAt: new Date(Date.now() - 30 * 60000).toISOString(), resolvedAt: "", reopenedAt: "" },
        { id: "CS-DEMO-004", studentName: "Demo Student", description: "Washroom needs cleaning", location: "Library, First Floor", category: "Cleanliness", priority: "Medium", department: "Housekeeping", triageReason: "The description appears to involve cleanliness, hygiene, or sanitation.", emergency: false, status: "Resolved", assignedTo: "Housekeeping Team", resolutionNote: "Washroom cleaned and supplies refilled.", studentFeedback: "Yes", createdAt: new Date(Date.now() - 26 * 3600000).toISOString(), updatedAt: new Date(Date.now() - 3 * 3600000).toISOString(), resolvedAt: new Date(Date.now() - 3 * 3600000).toISOString(), reopenedAt: "" }
    ];
    const ids = new Set(existing.map(c => c.id));
    saveComplaints([...demo.filter(c => !ids.has(c.id)).map(normalizeComplaint), ...existing]);
    if (typeof loadDashboard === "function") loadDashboard();
}

function clearComplaints() {
    const modal = document.getElementById("confirmModal");
    if (modal && typeof openConfirmModal === "function") return openConfirmModal("Delete all complaints?", "This removes every complaint stored in this browser. This action cannot be undone.", () => { localStorage.removeItem(STORAGE_KEY); loadDashboard(); });
    localStorage.removeItem(STORAGE_KEY);
    if (typeof loadDashboard === "function") loadDashboard();
}

function setLocation(locationName) {
    const input = document.getElementById("location");
    if (!input) return;
    input.value = locationName;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
}

function setupPage() {
    const problem = document.getElementById("problem");
    const counter = document.getElementById("characterCount");
    if (problem) {
        problem.addEventListener("input", () => { if (counter) counter.textContent = problem.value.length; showTriagePreview(); });
        if (counter) counter.textContent = problem.value.length;
        showTriagePreview();
    }
    const form = document.getElementById("complaintForm");
    if (form) form.addEventListener("submit", submitComplaint);
    const trackingForm = document.getElementById("trackingForm");
    if (trackingForm) trackingForm.addEventListener("submit", trackComplaint);
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const input = document.getElementById("complaintId");
    if (id && input) { input.value = id.toUpperCase(); trackComplaint(); }
}

document.addEventListener("DOMContentLoaded", setupPage);
