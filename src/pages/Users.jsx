import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { getAllUsers } from "../apis/user";
import { banUser, unbanUser } from "../apis/admin";
import Table from "../components/Table";
import { FaUsers, FaSyncAlt, FaEye, FaBan, FaCheckCircle, FaMapMarkerAlt } from "react-icons/fa";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";

const Badge = ({ color, bg, children }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: bg, color }}>
    {children}
  </span>
);

export default function Users() {
  const { themeColors } = useTheme();

  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [banModal, setBanModal] = useState({ open: false, user: null, reason: "", loading: false, viewMode: false, closing: false, visible: false });

  const openBanModal = (user, reason = "", viewMode = false) => {
    setBanModal({ open: true, user, reason, loading: false, viewMode, closing: false, visible: false });
    setTimeout(() => setBanModal((prev) => ({ ...prev, visible: true })), 10);
  };

  const closeBanModal = () => {
    setBanModal((prev) => ({ ...prev, closing: true, visible: false }));
    setTimeout(() => setBanModal({ open: false, user: null, reason: "", loading: false, viewMode: false, closing: false, visible: false }), 220);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAllUsers(1, 500);
      setUsers(res.users || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleBan = (row) => {
    openBanModal(row, "", false);
  };

  const handleBanSubmit = async () => {
    if (!banModal.reason.trim()) return;
    setBanModal((prev) => ({ ...prev, loading: true }));
    try {
      await banUser(banModal.user._id, banModal.reason);
      setUsers((prev) => prev.map((u) => u._id === banModal.user._id ? { ...u, isActive: false, banned: { isBanned: true, reason: banModal.reason, bannedAt: new Date() } } : u));
      setBanModal({ open: false, user: null, reason: "", loading: false, viewMode: false, closing: false });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || "Failed to ban user.";
      setBanModal((prev) => ({ ...prev, loading: false, error: msg }));
    }
  };

  const handleUnban = async (row) => {
    try {
      await unbanUser(row._id);
      setUsers((prev) => prev.map((u) => u._id === row._id ? { ...u, isActive: true, banned: { isBanned: false, reason: null, bannedAt: null } } : u));
    } catch (e) {
      alert(e?.response?.data?.message || "Unban failed");
    }
  };

  // ── Columns ────────────────────────────────────────────────
  const columns = [
    {
      key: "name", label: "User",
      render: (row) => (
        <div>
          <p className="font-medium text-sm" style={{ color: themeColors.text }}>{row.name || "-"}</p>
          <p className="text-xs opacity-50" style={{ color: themeColors.text }}>{row.gender || "-"}</p>
        </div>
      ),
    },
    {
      key: "phone", label: "Phone",
      render: (row) => (
        <div>
          <p className="text-sm" style={{ color: themeColors.text }}>{row.phone}</p>
          {row.isPhoneVerified
            ? <span className="text-[10px] text-emerald-500">✓ Verified</span>
            : <span className="text-[10px] text-rose-400">✗ Not verified</span>}
        </div>
      ),
    },
    {
      key: "email", label: "Email",
      render: (row) => (
        <div>
          <p className="text-sm" style={{ color: themeColors.text }}>{row.email || "-"}</p>
          {row.email && (row.isEmailVerified
            ? <span className="text-[10px] text-emerald-500">✓ Verified</span>
            : <span className="text-[10px] text-rose-400">✗ Not verified</span>)}
        </div>
      ),
    },
    {
      key: "role", label: "Role",
      render: (row) => <Badge color={themeColors.primary} bg={themeColors.primary + "15"}>{row.role}</Badge>,
    },
    {
      key: "location", label: "City",
      render: (row) => <span className="text-sm" style={{ color: themeColors.text }}>{row.location?.city || "-"}</span>,
    },
    {
      key: "wallet", label: "Wallet",
      render: (row) => <span className="text-sm font-medium" style={{ color: themeColors.text }}>₹{row.wallet ?? 0}</span>,
    },
    {
      key: "plan", label: "Plan",
      render: (row) => (
        <Badge
          color={row.plan === "free" ? themeColors.text : themeColors.primary}
          bg={row.plan === "free" ? themeColors.border : themeColors.primary + "15"}
        >
          {row.plan}
        </Badge>
      ),
    },
    {
      key: "isBanned", label: "Status",
      render: (row) => (
        row.banned?.isBanned
          ? (
            <button
              onClick={() => openBanModal(row, row.banned?.reason || "", true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: "#ef444415", color: "#ef4444" }}
            >
              Banned
            </button>
          )
          : row.isActive
            ? <Badge color="#10b981" bg="#10b98115">Active</Badge>
            : <Badge color="#f59e0b" bg="#f59e0b15">Inactive</Badge>
      ),
    },
    {
      key: "createdAt", label: "Joined",
      render: (row) => <span className="text-xs" style={{ color: themeColors.text }}>{fmtDate(row.createdAt)}</span>,
    },
  ];

  const actions = [
    { label: "View",  icon: <FaEye />,         onClick: (row) => setSelectedUser(row) },
    { label: "Ban",   icon: <FaBan />,         color: "#ef4444", hide: (row) => row.banned?.isBanned,  onClick: handleBan },
    { label: "Unban", icon: <FaCheckCircle />,  color: "#10b981", hide: (row) => !row.banned?.isBanned, onClick: handleUnban },
  ];

  const filters = [
    {
      key: "role", label: "Role",
      options: [
        { label: "User",   value: "user" },
        { label: "Owner",  value: "owner" },
        { label: "Worker", value: "worker" },
        { label: "Admin",  value: "admin" },
        { label: "Ops",    value: "ops" },
      ],
    },
    {
      key: "isBanned", label: "Status",
      options: [
        { label: "Active", value: "false" },
        { label: "Banned", value: "true" },
      ],
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
            <FaUsers style={{ color: themeColors.primary }} /> Users
          </h1>
          <p className="text-sm opacity-60 mt-0.5" style={{ color: themeColors.text }}>Sabhi registered users ka data</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-3 py-2 rounded-lg border text-sm flex items-center gap-2 disabled:opacity-50"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
        >
          <FaSyncAlt className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-sm border"
          style={{ backgroundColor: themeColors.danger + "15", borderColor: themeColors.danger + "50", color: themeColors.danger }}>
          {error}
        </div>
      )}

      {/* Table */}
      <Table
        title="All Users"
        data={users}
        columns={columns}
        actions={actions}
        filters={filters}
        loading={loading}
        searchPlaceholder="Search by name, phone, email..."
        rowKey="_id"
      />

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col"
            style={{ backgroundColor: themeColors.surface }}
          >
            <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: themeColors.border }}>
              <div className="flex items-center gap-4">
                <div
                  className="h-14 w-14 rounded-full flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
                >
                  {selectedUser.avatar
                    ? <img src={selectedUser.avatar} alt={selectedUser.name} className="h-14 w-14 rounded-full object-cover" />
                    : selectedUser.name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>{selectedUser.name}</h2>
                  <p className="text-xs opacity-60" style={{ color: themeColors.text }}>{selectedUser.phone} • {selectedUser.role}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-xl px-2" style={{ color: themeColors.text }}>×</button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  ["Email",          selectedUser.email || "-"],
                  ["Gender",         selectedUser.gender || "-"],
                  ["Date of Birth",  fmtDate(selectedUser.dateOfBirth)],
                  ["City",           selectedUser.location?.city || "-"],
                  ["State",          selectedUser.location?.state || "-"],
                  ["Plan",           selectedUser.plan],
                  ["Wallet",         `₹${selectedUser.wallet ?? 0}`],
                  ["Total Earnings", `₹${selectedUser.totalEarnings ?? 0}`],
                  ["Rating",         selectedUser.rating ?? 0],
                  ["Total Reviews",  selectedUser.totalReviews ?? 0],
                  ["Referral Code",  selectedUser.referralCode || "-"],
                  ["Referral Count", selectedUser.referralCount ?? 0],
                  ["KYC Status",     selectedUser.kyc?.status || "-"],
                  ["Ban Reason",      selectedUser.banned?.reason || "-"],
                  ["Banned At",       fmtDate(selectedUser.banned?.bannedAt)],
                  ["Last Seen",      fmtDate(selectedUser.lastSeen)],
                  ["Joined",         fmtDate(selectedUser.createdAt)],
                  ["Phone Verified", selectedUser.isPhoneVerified ? "Yes" : "No"],
                ].map(([label, value]) => (
                  <div key={label} className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                    <p className="text-[10px] uppercase opacity-50 font-semibold" style={{ color: themeColors.text }}>{label}</p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: themeColors.text }}>{value}</p>
                  </div>
                ))}
              </div>

              {selectedUser.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold opacity-60 mb-2" style={{ color: themeColors.text }}>Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.skills.map((s) => (
                      <span key={s} className="px-2 py-1 rounded-lg text-xs border" style={{ borderColor: themeColors.border, color: themeColors.text }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedUser.location?.address && (
                <div className="p-3 rounded-lg border flex items-start gap-2" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                  <FaMapMarkerAlt className="mt-0.5 flex-shrink-0" style={{ color: themeColors.primary }} />
                  <p className="text-sm" style={{ color: themeColors.text }}>{selectedUser.location.address}</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => setSelectedUser(null)}
                className="px-6 py-2 rounded-lg font-semibold text-sm"
                style={{ backgroundColor: themeColors.primary, color: themeColors.onPrimary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banModal.open && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        style={{ opacity: banModal.visible ? 1 : 0 }}
      >
        <div
          className="w-full max-w-md rounded-2xl shadow-2xl border transition-all duration-200"
          style={{
            backgroundColor: themeColors.surface,
            borderColor: themeColors.border,
            opacity: banModal.visible ? 1 : 0,
            transform: banModal.visible ? "scale(1)" : "scale(0.92)",
          }}
        >
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-base font-bold" style={{ color: themeColors.text }}>
                {banModal.viewMode ? "Ban Details" : "Ban User"}
              </h2>
              <button onClick={closeBanModal} className="text-xl px-1" style={{ color: themeColors.text }}>×</button>
            </div>

            <div className="p-5 space-y-4">
              {banModal.error && (
                <div className="p-3 rounded-lg text-sm border" style={{ backgroundColor: "#ef444415", borderColor: "#ef444430", color: "#ef4444" }}>
                  {banModal.error}
                </div>
              )}
              {banModal.viewMode ? (
                <>
                  <p className="text-sm" style={{ color: themeColors.text }}>
                    <span className="font-semibold">{banModal.user?.name}</span> is currently banned.
                  </p>
                  <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                    <p className="text-[10px] uppercase opacity-50 font-semibold mb-1" style={{ color: themeColors.text }}>Ban Reason</p>
                    <p className="text-sm" style={{ color: themeColors.text }}>{banModal.reason || "No reason provided"}</p>
                  </div>
                  {banModal.user?.banned?.bannedAt && (
                    <div className="p-3 rounded-lg border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
                      <p className="text-[10px] uppercase opacity-50 font-semibold mb-1" style={{ color: themeColors.text }}>Banned At</p>
                      <p className="text-sm" style={{ color: themeColors.text }}>{fmtDate(banModal.user.banned.bannedAt)}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-sm" style={{ color: themeColors.text }}>
                    Enter a reason for banning <span className="font-semibold">{banModal.user?.name}</span>:
                  </p>
                  <textarea
                    rows={3}
                    value={banModal.reason}
                    onChange={(e) => setBanModal((prev) => ({ ...prev, reason: e.target.value }))}
                    placeholder="Enter ban reason..."
                    className="w-full px-3 py-2 rounded-lg border text-sm resize-none focus:outline-none"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                  />
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-5 pb-5">
              <button
                onClick={closeBanModal}
                className="px-4 py-2 rounded-lg border text-sm"
                style={{ borderColor: themeColors.border, color: themeColors.text }}
              >
                Cancel
              </button>
              {banModal.viewMode ? (
                <button
                  onClick={async () => {
                    await handleUnban(banModal.user);
                    closeBanModal();
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: "#10b981", color: "#fff" }}
                >
                  Unban User
                </button>
              ) : (
                <button
                  onClick={handleBanSubmit}
                  disabled={!banModal.reason.trim() || banModal.loading}
                  className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                  style={{ backgroundColor: "#ef4444", color: "#fff" }}
                >
                  {banModal.loading ? "Banning..." : "Ban User"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to   { opacity: 0; }
        }
        @keyframes scaleOut {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.92); }
        }
        .animate-fadeOut  { animation: fadeOut  0.2s ease-in forwards; }
        .animate-scaleOut { animation: scaleOut 0.2s ease-in forwards; }
      `}</style>
    </div>
  );
}
