import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchGlobals } from "../store/global";
import {
    getLeaveTypes,
    addLeaveType,
    updateLeaveType,
    deactivateLeaveType,
    getLeaveRules,
    addLeaveRule,
    updateLeaveRule,
    deleteLeaveRule,
    getCreditRules,
    addCreditRule,
    updateCreditRule,
    deleteCreditRule,
} from "../util/admin";

export default function LeaveTypePage() {
    const dispatch = useDispatch();
    const global = useSelector((s) => s.global);
    const [selectedType, setSelectedType] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rules, setRules] = useState([]);
    const [creditRules, setCreditRules] = useState([]);
    const [leaveTypes, setLeaveTypes] = useState([]);


    useEffect(() => {
        (async () => {
            dispatch(fetchGlobals()); // still keep this for reset or other global data
            try {
                const data = await getLeaveTypes();
                const normalized = Array.isArray(data)
                    ? data
                    : data?.data || Object.values(data || {});
                setLeaveTypes(normalized);
            } catch (err) {
                console.error("Failed to fetch leave types:", err);
            }
        })();
    }, [dispatch]);

    const refreshRules = async (typeId) => {
        if (!typeId) {
            console.warn("refreshRules called without typeId");
            return;
        }

        setLoading(true);
        try {
            const [rRaw, cRaw] = await Promise.all([
                getLeaveRules(typeId),
                getCreditRules(typeId),
            ]);

            console.log("🔹 Raw leaveRules:", rRaw);
            console.log("🔹 Raw creditRules:", cRaw);

            // --- Normalization that works for ALL formats ---
            const normalize = (raw) => {
                if (!raw) return [];
                if (Array.isArray(raw)) return raw;
                if (raw.data && Array.isArray(raw.data)) return raw.data;
                if (typeof raw === "object") {
                    // Some Redis caches return object with keys as ids
                    const vals = Object.values(raw);
                    if (vals.every((v) => typeof v === "object")) return vals;
                }
                return [];
            };

            const rulesData = normalize(rRaw);
            const creditData = normalize(cRaw);

            console.log("✅ Normalized Rules:", rulesData);
            console.log("✅ Normalized Credits:", creditData);

            // Filter by leave_type_id — backend uses snake_case
            const sameId = (a, b) => Number(a) === Number(b);

            const rList = uniqueById(normalizeList(rRaw)).filter((r) =>
                sameId(r.leave_type_id || r.leaveTypeId, typeId)
            );
            const cList = uniqueById(normalizeList(cRaw)).filter((r) =>
                sameId(r.leave_type_id || r.leaveTypeId, typeId)
            );
            
            console.log("📊 Final Fetched Rules:", filteredRules);
            console.log("📊 Final Fetched Credit Rules:", filteredCredits);

            setRules(filteredRules);
            setCreditRules(filteredCredits);
        } catch (e) {
            console.error("refreshRules error:", e);
            setRules([]);
            setCreditRules([]);
        } finally {
            setLoading(false);
        }
    };



    const handleSelectType = async (type) => {
        console.log("🟨 handleSelectType received:", type);

        // Handle both backend and normalized formats
        const typeId =
            type?.id ||
            type?.leave_type_id ||
            type?.leaveTypeId ||
            type?.type_id ||
            type?.typeId;

        console.log("🟩 Resolved typeId:", typeId);

        if (!typeId) {
            console.warn("⚠️ handleSelectType: Missing typeId for", type);
            return;
        }

        setSelectedType(type);
        await refreshRules(typeId);
    };



    const handleAddLeaveType = async () => {
        const name = prompt("Enter Leave Type Name:");
        if (!name) return;
        await addLeaveType({ name });
        dispatch(fetchGlobals());
        const updated = await getLeaveTypes();
        setLeaveTypes(Array.isArray(updated) ? updated : updated?.data || Object.values(updated || {}));

    };

    const handleUpdateLeaveType = async (type) => {
        const newName = prompt("New name:", type.name);
        if (!newName) return;
        await updateLeaveType(type.id, { name: newName });
        dispatch(fetchGlobals());
        const updated = await getLeaveTypes();
        setLeaveTypes(Array.isArray(updated) ? updated : updated?.data || Object.values(updated || {}));

    };

    const handleDeactivateLeaveType = async (type) => {
        if (!window.confirm(`Deactivate ${type.name}?`)) return;
        await deactivateLeaveType(type.id);
        dispatch(fetchGlobals());
        if (selectedType?.id === type.id) setSelectedType(null);
        const updated = await getLeaveTypes();
        setLeaveTypes(Array.isArray(updated) ? updated : updated?.data || Object.values(updated || {}));

    };

    const handleAddRule = async () => {
        if (!selectedType) return alert("Select a leave type first!");
        const ruleName = prompt("Enter rule name:");
        if (!ruleName) return;
        await addLeaveRule(selectedType.id, { ruleName });
        await refreshRules(selectedType.id);
        const updated = await getLeaveTypes();
        setLeaveTypes(Array.isArray(updated) ? updated : updated?.data || Object.values(updated || {}));

    };

    const handleDeleteRule = async (rule) => {
        await deleteLeaveRule(rule.id);
        await refreshRules(selectedType.id);
        const updated = await getLeaveTypes();
        setLeaveTypes(Array.isArray(updated) ? updated : updated?.data || Object.values(updated || {}));

    };

    const handleAddCreditRule = async () => {
        if (!selectedType) return alert("Select a leave type first!");
        const name = prompt("Credit rule name:");
        if (!name) return;
        await addCreditRule(selectedType.id, { name });
        await refreshRules(selectedType.id);
        const updated = await getLeaveTypes();
        setLeaveTypes(Array.isArray(updated) ? updated : updated?.data || Object.values(updated || {}));

    };

    const handleDeleteCreditRule = async (rule) => {
        await deleteCreditRule(rule.id);
        await refreshRules(selectedType.id);
        const updated = await getLeaveTypes();
        setLeaveTypes(Array.isArray(updated) ? updated : updated?.data || Object.values(updated || {}));

    };

    // Formatters
    const formatKey = (key) =>
        key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (ch) => ch.toUpperCase());

    const formatValue = (val) => {
        if (val === null || val === undefined || val === "") return "—";
        if (typeof val === "boolean") return val ? "Yes" : "No";
        if (typeof val === "object") return JSON.stringify(val);
        return String(val);
    };

    const HIDDEN_KEYS = new Set([
        "id",
        "leave_type_id",
        "leaveTypeId",
        "created_at",
        "updated_at",
        "deleted_at",
    ]);

    const renderRuleBlock = (title, items, onAdd, onDelete) => (
        <div className="mt-6">
            <h3 className="font-semibold text-lg mb-1">{title}</h3>
            <ul className="border rounded-md divide-y">
                {items.length === 0 ? (
                    <p className="text-gray-400 italic p-2">No {title.toLowerCase()} defined</p>
                ) : (
                    items.map((rule) => (
                        <li
                            key={`${title}-${rule.id}`}
                            className="p-3 flex justify-between items-start hover:bg-gray-50 rounded-md"
                        >
                            <div className="flex-1">
                                <p className="font-medium mb-2">
                                    {rule.ruleName || rule.name || `#${rule.id}`}
                                </p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-700">
                                    {Object.entries(rule)
                                        .filter(([k]) => !HIDDEN_KEYS.has(k))
                                        .map(([k, v]) => (
                                            <div key={`${rule.id}-${k}`}>
                                                <span className="font-medium">{formatKey(k)}:</span>{" "}
                                                {formatValue(v)}
                                            </div>
                                        ))}
                                </div>
                            </div>
                            <button
                                onClick={() => onDelete(rule)}
                                className="text-red-600 text-sm ml-3"
                            >
                                Delete
                            </button>
                        </li>
                    ))
                )}
            </ul>
            <button
                onClick={onAdd}
                className="mt-2 text-sm bg-blue-600 text-white px-3 py-1 rounded-md"
            >
                + Add {title}
            </button>
        </div>
    );

    return (
        <div className="flex gap-6 p-6">
            {/* LEFT: Leave Types List */}
            <div className="w-1/3 bg-white rounded-2xl shadow p-4">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">Leave Types</h2>
                    <button
                        onClick={handleAddLeaveType}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md"
                    >
                        + Add
                    </button>
                </div>
                <ul className="divide-y">
                    {leaveTypes.map((lt) => (
                        <li
                            key={lt.id}
                            onClick={() => handleSelectType(lt)}
                            className={`p-3 cursor-pointer hover:bg-gray-50 ${selectedType?.id === lt.id ? "bg-blue-50" : ""
                                }`}
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-medium">{lt.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {lt.acronym || "—"} | Balance: {lt.defaultBalance ?? "—"}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpdateLeaveType(lt);
                                        }}
                                        className="text-blue-600 text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeactivateLeaveType(lt);
                                        }}
                                        className="text-red-600 text-sm"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* RIGHT: Rules + Credit Rules */}
            <div className="flex-1 bg-white rounded-2xl shadow p-6">
                {!selectedType ? (
                    <p className="text-gray-500">Select a leave type to view details.</p>
                ) : loading ? (
                    <p className="text-gray-500 italic">Loading rules...</p>
                ) : (
                    <>
                        <h2 className="text-xl font-bold mb-2">
                            {selectedType.name} ({selectedType.acronym || "—"})
                        </h2>
                        {renderRuleBlock("Rule", rules, handleAddRule, handleDeleteRule)}
                        {renderRuleBlock(
                            "Credit Rule",
                            creditRules,
                            handleAddCreditRule,
                            handleDeleteCreditRule
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
